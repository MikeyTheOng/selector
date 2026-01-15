import type { FileRow, FolderRow, ExplorerItem } from "@/types/explorer";

export function fileRowToExplorerItem(row: FileRow): ExplorerItem {
  return {
    ...row,
    kind: "file",
  };
}

export function folderRowToExplorerItem(row: FolderRow): ExplorerItem {
  return {
    ...row,
    kind: "folder",
  };
}
