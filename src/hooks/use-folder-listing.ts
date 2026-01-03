import { watch, type WatchEvent } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";
import {
  FileRow,
  FolderListing,
  formatSize,
  fsModule,
  getErrorMessage,
  getExtension,
  isHiddenName,
  resolveEntry,
} from "../lib/fs";

const createListing = (overrides: Partial<FolderListing> = {}): FolderListing => ({
  folders: [],
  files: [],
  isLoading: false,
  fileCount: 0,
  folderCount: 0,
  isTruncated: false,
  ...overrides,
});

const shouldRefreshForEvent = (event: WatchEvent) => {
  if (event.type && typeof event.type === "object" && "access" in event.type) {
    return false;
  }
  return true;
};

export const useFolderListing = (selectedFolder: string | null) => {
  const [listing, setListing] = useState<FolderListing>(() => createListing());
  const [listingCache, setListingCache] = useState<Record<string, FolderListing>>({});

  const applyListingUpdate = useCallback(
    (path: string, nextListing: FolderListing) => {
      setListingCache((prev) => ({
        ...prev,
        [path]: nextListing,
      }));
      if (path === selectedFolder) {
        setListing(nextListing);
      }
    },
    [selectedFolder],
  );

  const applyListingError = useCallback(
    (path: string, error: unknown) => {
      const fallbackListing = createListing({
        isLoading: false,
        error: getErrorMessage(error),
      });
      setListingCache((prev) => ({
        ...prev,
        [path]: fallbackListing,
      }));
      if (path === selectedFolder) {
        setListing(fallbackListing);
      }
    },
    [selectedFolder],
  );

  const readFolderListing = useCallback(async (path: string) => {
    const entries = await fsModule.readDir(path, { recursive: false });
    const visibleEntries = entries
      .map((entry) => {
        const resolved = resolveEntry(entry, path);
        if (!resolved) {
          return null;
        }
        return { entry, ...resolved };
      })
      .filter(
        (entry): entry is { entry: typeof entries[number]; name: string; path: string } =>
          Boolean(entry),
      )
      .filter((entry) => !isHiddenName(entry.name));
    const folders = visibleEntries
      .filter((item) => item.entry.isDirectory)
      .map((item) => ({
        path: item.path,
        name: item.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const files = visibleEntries
      .filter((item) => item.entry.isFile ?? !item.entry.isDirectory)
      .map((item) => ({
        path: item.path,
        name: item.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const metadataReader = fsModule.metadata ?? fsModule.stat;
    const rows = await Promise.all(
      files.map(async (entry) => {
        const name = entry.name;
        let size: number | undefined;
        if (metadataReader) {
          try {
            size = (await metadataReader(entry.path)).size;
          } catch (error) {
            size = undefined;
          }
        }

        return {
          path: entry.path,
          name,
          extension: getExtension(name),
          size,
          sizeLabel: formatSize(size),
        } satisfies FileRow;
      }),
    );

    return {
      folders,
      files: rows,
      isLoading: false,
      fileCount: files.length,
      folderCount: folders.length,
      isTruncated: false,
    } satisfies FolderListing;
  }, []);

  const refreshListingForPath = useCallback(
    async (path: string) => {
      try {
        const nextListing = await readFolderListing(path);
        applyListingUpdate(path, nextListing);
      } catch (error) {
        applyListingError(path, error);
      }
    },
    [applyListingError, applyListingUpdate, readFolderListing],
  );

  const loadCachedListing = useCallback(
    async (path: string) => {
      setListingCache((prev) => ({
        ...prev,
        [path]: {
          ...(prev[path] ?? createListing()),
          isLoading: true,
          error: undefined,
        },
      }));
      await refreshListingForPath(path);
    },
    [refreshListingForPath],
  );

  useEffect(() => {
    if (!selectedFolder) {
      return;
    }

    let isActive = true;
    const loadingListing = createListing({ isLoading: true, error: undefined });

    const loadFolder = async () => {
      setListing(loadingListing);
      setListingCache((prev) => ({
        ...prev,
        [selectedFolder]: loadingListing,
      }));

      try {
        const nextListing = await readFolderListing(selectedFolder);

        if (!isActive) {
          return;
        }

        applyListingUpdate(selectedFolder, nextListing);
      } catch (error) {
        if (!isActive) {
          return;
        }

        applyListingError(selectedFolder, error);
      }
    };

    loadFolder();

    return () => {
      isActive = false;
    };
  }, [applyListingError, applyListingUpdate, readFolderListing, selectedFolder]);

  useEffect(() => {
    if (!selectedFolder) {
      return;
    }

    let isActive = true;
    let unwatch: (() => void) | null = null;
    let refreshInProgress = false;
    let refreshQueued = false;

    const refreshListing = async () => {
      if (refreshInProgress) {
        refreshQueued = true;
        return;
      }

      refreshInProgress = true;
      do {
        refreshQueued = false;
        await refreshListingForPath(selectedFolder);
        if (!isActive) {
          return;
        }
      } while (refreshQueued);
      refreshInProgress = false;
    };

    const startWatch = async () => {
      try {
        const stop = await watch(
          selectedFolder,
          (event) => {
            if (!shouldRefreshForEvent(event)) {
              return;
            }
            void refreshListing();
          },
          { recursive: false, delayMs: 200 },
        );

        if (!isActive) {
          stop();
          return;
        }

        unwatch = stop;
      } catch (error) {
        if (isActive) {
          console.warn(`Failed to watch folder: ${selectedFolder}`, error);
        }
      }
    };

    void startWatch();

    return () => {
      isActive = false;
      if (unwatch) {
        unwatch();
      }
    };
  }, [refreshListingForPath, selectedFolder]);

  useEffect(() => {
    if (!selectedFolder) {
      return;
    }

    const refreshOnFocus = () => {
      void refreshListingForPath(selectedFolder);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshListingForPath(selectedFolder);
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshListingForPath, selectedFolder]);

  const ensureListing = useCallback(
    (path: string) => {
      if (!path || listingCache[path]) {
        return;
      }
      void loadCachedListing(path);
    },
    [listingCache, loadCachedListing],
  );

  const getListingForPath = useCallback(
    (path: string) => listingCache[path] ?? (path === selectedFolder ? listing : undefined),
    [listing, listingCache, selectedFolder],
  );

  return {
    listing,
    ensureListing,
    getListingForPath,
  };
};
