import {
  formatDateTime,
  formatSize,
  getExtension,
  getKindLabel,
} from "@/lib/formatters";
import { getFileKind } from "@/lib/file-types";
import { getEntryPath } from "@/lib/path-utils";
import { fsModule } from "@/lib/tauri/fs";
import type { ExplorerItem } from "@/types/explorer";
import type { FileKind } from "@/lib/file-types";

export const detectAmbiguity = (
  items: ExplorerItem[],
): { isAmbiguous: boolean } => {
  const hasFolder = items.some((item) => item.kind === "folder");
  return { isAmbiguous: hasFolder };
};

export const resolveFilesOnly = (items: ExplorerItem[]): ExplorerItem[] =>
  items.filter((item) => item.kind === "file");

export const resolveFoldersOnly = (items: ExplorerItem[]): ExplorerItem[] =>
  items.filter((item) => item.kind === "folder");

const normalizePath = (path: string) => {
  if (!path) return "";
  if (path === "/") return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
};

const isChildPath = (parent: string, child: string) => {
  if (!parent || !child) return false;
  if (parent === "/") {
    return child !== "/";
  }
  return child.startsWith(`${parent}/`);
};

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

export const resolveExpandFolders = async (
  items: ExplorerItem[],
): Promise<ExplorerItem[]> => {
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

export const deduplicateByPath = (items: ExplorerItem[]): ExplorerItem[] => {
  // Output list: the minimal set of non-overlapping selections we want to keep.
  // Important: order matters — we keep the first occurrence and skip later duplicates/overlaps.
  const deduped: ExplorerItem[] = [];

  // Tracks exact paths we've already accepted (after normalization). This only prevents
  // exact duplicates like "/docs" + "/docs" or "/docs/" + "/docs".
  const seen = new Set<string>();

  for (const item of items) {
    // Normalize so "/path" and "/path/" are treated as the same path.
    const normalized = normalizePath(item.path);

    // Skip empty/invalid paths and exact duplicates we've already kept.
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    // Skip hierarchical overlaps (parent/child relationships), e.g.:
    // - keeping "/photos" means we should drop "/photos/vacation.jpg"
    // - keeping "/photos/vacation.jpg" means we should drop "/photos"
    //
    // We check both directions to handle either input order.
    const overlaps = deduped.some((existing) => {
      const existingPath = normalizePath(existing.path);
      return (
        isChildPath(existingPath, normalized) ||
        isChildPath(normalized, existingPath)
      );
    });

    if (overlaps) {
      continue;
    }

    deduped.push(item);
    seen.add(normalized);
  }

  return deduped;
};

const createEmptyKindMap = () =>
  new Map<FileKind, ExplorerItem[]>([
    ["image", []],
    ["video", []],
    ["document", []],
  ]);

export const classifyByFileKind = (
  items: ExplorerItem[],
): Map<FileKind, ExplorerItem[]> => {
  const grouped = createEmptyKindMap();

  for (const item of items) {
    if (item.kind !== "file") {
      continue;
    }
    const kind = getFileKind(item.extension);
    grouped.get(kind)?.push(item);
  }

  return grouped;
};

export const getFileKindCounts = (
  items: ExplorerItem[],
): Record<FileKind, number> => {
  const grouped = classifyByFileKind(items);

  return {
    image: grouped.get("image")?.length ?? 0,
    video: grouped.get("video")?.length ?? 0,
    document: grouped.get("document")?.length ?? 0,
  };
};
