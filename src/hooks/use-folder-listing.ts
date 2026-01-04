import { watch, type WatchEvent } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";
import {
  FileRow,
  FolderListing,
  formatDateTime,
  formatSize,
  fsModule,
  getErrorMessage,
  getExtension,
  getKindLabel,
  getPathHierarchy,
  isHiddenName,
  resolveEntry,
  type LocationItem,
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

export const useFolderListing = (
  selectedFolder: string | null,
  locations: LocationItem[],
) => {
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
    const folderRows = await Promise.all(
      folders.map(async (entry) => {
        let mtime: Date | null = null;
        if (metadataReader) {
          try {
            mtime = (await metadataReader(entry.path)).mtime ?? null;
          } catch (error) {
            mtime = null;
          }
        }

        return {
          path: entry.path,
          name: entry.name,
          dateModified: mtime,
          dateModifiedLabel: formatDateTime(mtime),
        };
      }),
    );
    const rows = await Promise.all(
      files.map(async (entry) => {
        const name = entry.name;
        const extension = getExtension(name);
        let size: number | undefined;
        let mtime: Date | null = null;
        if (metadataReader) {
          try {
            const metadata = await metadataReader(entry.path);
            size = metadata.size;
            mtime = metadata.mtime ?? null;
          } catch (error) {
            size = undefined;
            mtime = null;
          }
        }

        return {
          path: entry.path,
          name,
          extension,
          kindLabel: getKindLabel(extension),
          size,
          sizeLabel: formatSize(size),
          dateModified: mtime,
          dateModifiedLabel: formatDateTime(mtime),
        } satisfies FileRow;
      }),
    );

    return {
      folders: folderRows,
      files: rows,
      isLoading: false,
      fileCount: files.length,
      folderCount: folderRows.length,
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
    if (!selectedFolder || locations.length === 0) {
      return;
    }

    let isActive = true;
    const unwatchMap = new Map<string, () => void>();
    const refreshInProgressMap = new Map<string, boolean>();
    const refreshQueuedMap = new Map<string, boolean>();

    const pathsToWatch = getPathHierarchy(selectedFolder, locations);

    const createRefreshForPath = (path: string) => async () => {
      if (refreshInProgressMap.get(path)) {
        refreshQueuedMap.set(path, true);
        return;
      }

      refreshInProgressMap.set(path, true);
      do {
        refreshQueuedMap.set(path, false);
        await refreshListingForPath(path);
        if (!isActive) {
          return;
        }
      } while (refreshQueuedMap.get(path));
      refreshInProgressMap.set(path, false);
    };

    const startWatchers = async () => {
      for (const path of pathsToWatch) {
        try {
          const refreshForPath = createRefreshForPath(path);
          const stop = await watch(
            path,
            (event) => {
              if (!shouldRefreshForEvent(event)) {
                return;
              }
              void refreshForPath();
            },
            { recursive: false, delayMs: 200 },
          );

          if (!isActive) {
            stop();
            return;
          }

          unwatchMap.set(path, stop);
        } catch (error) {
          if (isActive) {
            console.warn(`Failed to watch folder: ${path}`, error);
          }
        }
      }
    };

    void startWatchers();

    return () => {
      isActive = false;
      for (const unwatch of unwatchMap.values()) {
        unwatch();
      }
      unwatchMap.clear();
    };
  }, [locations, refreshListingForPath, selectedFolder]);

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
