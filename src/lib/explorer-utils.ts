import type { FileRow, FolderRow } from "@/types/fs";
import type { ExplorerItem } from "@/types/explorer";

/**
 * Converts a FileRow to an ExplorerItem
 */
export function fileRowToExplorerItem(row: FileRow): ExplorerItem {
  return {
    id: row.path,
    path: row.path,
    name: row.name,
    kind: "file",
    status: row.status || "available",
    dateModified: row.dateModified,
    dateModifiedLabel: row.dateModifiedLabel,
    size: row.size,
    sizeLabel: row.sizeLabel,
    kindLabel: row.kindLabel,
    extension: row.extension,
  };
}

/**
 * Converts a FolderRow to an ExplorerItem
 */
export function folderRowToExplorerItem(row: FolderRow): ExplorerItem {
  return {
    id: row.path,
    path: row.path,
    name: row.name,
    kind: "folder",
    status: row.status || "available",
    dateModified: row.dateModified,
    dateModifiedLabel: row.dateModifiedLabel,
    kindLabel: "Folder",
  };
}

/**
 * Converts a FolderRow to a FileRow for compatibility with older components
 */
export function folderToFileRow(f: FolderRow): FileRow {
  return {
    path: f.path,
    name: f.name,
    size: 0,
    sizeLabel: "",
    extension: "",
    kindLabel: "Folder",
    dateModified: f.dateModified,
    dateModifiedLabel: f.dateModifiedLabel,
    status: f.status,
  };
}
