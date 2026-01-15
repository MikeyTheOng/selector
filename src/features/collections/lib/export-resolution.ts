import { formatDateTime, formatSize, getExtension, getKindLabel } from "@/lib/formatters";
import { getEntryPath } from "@/lib/path-utils";
import { fsModule } from "@/lib/tauri/fs";
import type { ExplorerItem } from "@/types/explorer";

export const detectAmbiguity = (items: ExplorerItem[]): { isAmbiguous: boolean } => {
  const hasFolder = items.some((item) => item.kind === "folder");
  return { isAmbiguous: hasFolder };
};

export const resolveFilesOnly = (items: ExplorerItem[]): ExplorerItem[] =>
  items.filter((item) => item.kind === "file");

export const resolveFoldersOnly = (items: ExplorerItem[]): ExplorerItem[] =>
  items.filter((item) => item.kind === "folder");

const createFileItem = (path: string): ExplorerItem => {
  const name = path.split("/").filter(Boolean).pop() ?? path;
  const extension = getExtension(name);

  return {
    path,
    name,
    kind: "file",
    status: "available",
    extension,
    kindLabel: getKindLabel(extension),
    sizeLabel: formatSize(undefined),
    dateModified: null,
    dateModifiedLabel: formatDateTime(null),
  };
};

export const resolveExpandFolders = async (items: ExplorerItem[]): Promise<ExplorerItem[]> => {
  const files = items.filter((item) => item.kind === "file");
  const folders = items.filter((item) => item.kind === "folder");

  if (folders.length === 0) {
    return files;
  }

  const resolved = await Promise.all(
    folders.map(async (folder) => {
      const entries = await fsModule.readDir(folder.path, { recursive: true });
      return entries
        .filter((entry) => entry.isFile ?? !entry.isDirectory)
        .map((entry) => {
          const path = getEntryPath(entry, folder.path);
          return path ? createFileItem(path) : null;
        })
        .filter((entry): entry is ExplorerItem => Boolean(entry));
    }),
  );

  return [...files, ...resolved.flat()];
};
