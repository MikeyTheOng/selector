import { readDir } from "@tauri-apps/plugin-fs";
import { getEntryPath } from "@/lib/path-utils";
import type { FsDirEntry } from "@/types/explorer";

type ReadDirRecursiveOptions = {
  onError?: (path: string, error: unknown) => void;
  onSymlink?: (path: string, entry: FsDirEntry) => void;
};

type ResolvedEntry = FsDirEntry & { path: string };

export const readDirRecursive = async (
  rootPath: string,
  options: ReadDirRecursiveOptions = {},
): Promise<ResolvedEntry[]> => {
  const results: ResolvedEntry[] = [];
  const queue = [rootPath];

  while (queue.length > 0) {
    const currentPath = queue.shift();
    if (!currentPath) {
      continue;
    }

    let entries: FsDirEntry[];
    try {
      entries = (await readDir(currentPath)) as FsDirEntry[];
    } catch (error) {
      options.onError?.(currentPath, error);
      continue;
    }

    for (const entry of entries) {
      const entryPath = getEntryPath(entry, currentPath);
      if (!entryPath) {
        continue;
      }

      if (entry.isSymlink) {
        options.onSymlink?.(entryPath, entry);
        continue;
      }

      results.push({ ...entry, path: entryPath });

      if (entry.isDirectory) {
        queue.push(entryPath);
      }
    }
  }

  return results;
};
