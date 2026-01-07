import { useMemo } from "react";
import { FileRowLabel } from "./FileRowLabel";
import { ExplorerListView } from "@/components/explorer/ExplorerListView";
import { fileRowToExplorerItem, folderRowToExplorerItem } from "@/lib/explorer-utils";
import type { FileRow, FolderListing, LastClickedFile } from "@/types/fs";
import type { ExplorerViewMode, ExplorerItem } from "@/types/explorer";

type FileListViewProps = {
  listing: FolderListing;
  selectedFiles: Record<string, FileRow>;
  lastClickedFile: LastClickedFile | null;
  focusedFile: LastClickedFile | null;
  viewMode?: ExplorerViewMode;
  onSelectFolder: (path: string) => void;
  onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
  onSelectRange: (from: FileRow, to: FileRow, allFiles: FileRow[]) => void;
  onFocusFile: (file: FileRow) => void;
  onToggleFileSelection: (file: FileRow) => void;
  onActivateItem?: (row: FileRow) => void;
};

export const FileListView = ({
  listing,
  selectedFiles,
  lastClickedFile,
  focusedFile,
  viewMode = "list",
  onSelectFolder,
  onSelectFile,
  onSelectRange,
  onFocusFile,
  onToggleFileSelection,
  onActivateItem,
}: FileListViewProps) => {
  const explorerItems = useMemo(() => [
    ...listing.folders.map(folderRowToExplorerItem),
    ...listing.files.map(fileRowToExplorerItem),
  ], [listing]);

  // Map back from ExplorerItem to FileRow for compatibility
  const allRowItems = useMemo(() => [
    ...listing.folders.map(f => ({
      ...f,
      size: 0,
      sizeLabel: "",
      extension: "",
      kindLabel: "Folder",
    } as FileRow)),
    ...listing.files
  ], [listing]);

  const handleItemClick = (item: ExplorerItem, event: React.MouseEvent) => {
    const row = allRowItems.find(r => r.path === item.id);
    if (!row) return;

    // Shift+click for range selection
    if (event.shiftKey && lastClickedFile) {
      onSelectRange(lastClickedFile.file, row, allRowItems);
      onFocusFile(row);
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      onToggleFileSelection(row);
    } else {
      onSelectFile(row);
    }
    onFocusFile(row);
  };

  const handleItemDoubleClick = (item: ExplorerItem) => {
    const row = allRowItems.find(r => r.path === item.id);
    if (!row) return;

    if (row.status === "missing" || row.status === "offline") {
      onActivateItem?.(row);
      return;
    }

    if (item.kind === "folder") {
      onSelectFolder(item.path);
    } else if (onActivateItem) {
      onActivateItem(row);
    }
  };

  return (
    <ExplorerListView
      items={explorerItems}
      viewMode={viewMode}
      selectedIds={selectedFiles as unknown as Record<string, ExplorerItem>}
      lastClickedId={lastClickedFile?.file.path}
      focusedId={focusedFile?.file.path}
      onItemClick={handleItemClick}
      onItemDoubleClick={handleItemDoubleClick}
      emptyMessage="No items found in this folder."
      renderItemLabel={({ item, isSelected }) => (
        <FileRowLabel
          name={item.name}
          type={item.kind as "file" | "folder"}
          iconClassName={item.kind === "folder" 
            ? isSelected ? "text-primary-foreground" : "text-primary"
            : isSelected ? "text-primary-foreground" : "text-muted-foreground"
          }
          labelClassName={isSelected ? "text-primary-foreground" : "text-foreground"}
        />
      )}
    />
  );
};