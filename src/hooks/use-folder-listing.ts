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

export const useFolderListing = (selectedFolder: string | null) => {
  const [listing, setListing] = useState<FolderListing>(() => createListing());
  const [listingCache, setListingCache] = useState<Record<string, FolderListing>>({});

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

      try {
        const nextListing = await readFolderListing(path);
        setListingCache((prev) => ({
          ...prev,
          [path]: nextListing,
        }));
      } catch (error) {
        setListingCache((prev) => ({
          ...prev,
          [path]: createListing({ isLoading: false, error: getErrorMessage(error) }),
        }));
      }
    },
    [readFolderListing],
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

        setListing(nextListing);
        setListingCache((prev) => ({
          ...prev,
          [selectedFolder]: nextListing,
        }));
      } catch (error) {
        if (!isActive) {
          return;
        }

        const fallbackListing = createListing({
          isLoading: false,
          error: getErrorMessage(error),
        });

        setListing(fallbackListing);
        setListingCache((prev) => ({
          ...prev,
          [selectedFolder]: fallbackListing,
        }));
      }
    };

    loadFolder();

    return () => {
      isActive = false;
    };
  }, [readFolderListing, selectedFolder]);

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
