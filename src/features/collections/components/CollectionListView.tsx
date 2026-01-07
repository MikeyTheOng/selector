import { CollectionRowLabel } from "./CollectionRowLabel";
import { TreeNode, TreeProvider, TreeView } from "@/components/kibo-ui/tree";
import { cn } from "@/lib/utils";
import type { FileRow, FolderListing, LastClickedFile } from "@/types/fs";
import { useMemo } from "react";

type CollectionListViewProps = {
  listing: FolderListing;
  selectedFiles: Record<string, FileRow>;
  lastClickedFile: LastClickedFile | null;
  focusedFile: LastClickedFile | null;
  onSelectFolder: (path: string) => void;
  onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
  onSelectRange: (from: FileRow, to: FileRow, allFiles: FileRow[]) => void;
  onFocusFile: (file: FileRow) => void;
  onToggleFileSelection: (file: FileRow) => void;
  onActivateItem?: (row: FileRow) => void;
};

export const CollectionListView = ({
  listing,
  selectedFiles,
  lastClickedFile,
  focusedFile,
  onSelectFolder,
  onSelectFile,
  onSelectRange,
  onFocusFile,
  onToggleFileSelection,
  onActivateItem,
}: CollectionListViewProps) => {
  const rows = useMemo(() => [
    ...listing.folders.map((folder) => ({
      ...folder,
      type: "folder" as const,
      row: {
        path: folder.path,
        name: folder.name,
        size: 0,
        sizeLabel: "",
        dateModified: folder.dateModified,
        extension: "",
        kindLabel: "Folder",
        dateModifiedLabel: folder.dateModifiedLabel,
        status: folder.status,
      } as FileRow,
    })),
    ...listing.files.map((file) => ({
      ...file,
      type: "file" as const,
      row: file,
    })),
  ], [listing]);

  const allRowItems = useMemo(() => rows.map(r => r.row), [rows]);

  const handleItemClick = (event: React.MouseEvent, row: FileRow) => {
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

  return (
    <div tabIndex={0} className="outline-none focus:outline-none">
      <div className="grid cursor-default select-none grid-cols-[minmax(0,1fr)_160px_170px] gap-3 border-b border-border/50 px-3 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span>Name</span>
        <span>Kind</span>
        <span>Date modified</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">No items found in this collection.</div>
      ) : (
        <TreeProvider selectable={false} showLines={false} className="w-full">
          <TreeView className="p-0">
            <div className="divide-y divide-border/40">
              {rows.map((row) => {
                const isSelected = Boolean(selectedFiles[row.path]);
                const isFocused = focusedFile?.file.path === row.path;

                return (
                  <TreeNode key={row.path} nodeId={row.path} level={0}>
                    <button
                      type="button"
                      onClick={(event) => handleItemClick(event, row.row)}
                      onDoubleClick={() => {
                        if (row.row.status === "missing" || row.row.status === "offline") {
                          onActivateItem?.(row.row);
                          return;
                        }
                        if (row.type === "folder") {
                          onSelectFolder(row.path);
                        } else if (onActivateItem) {
                          onActivateItem(row.row);
                        }
                      }}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_160px_170px] items-center gap-3 px-2 py-1 text-left text-xs transition outline-none",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted/60",
                        isFocused && "ring-1 ring-inset ring-ring ring-offset-0 z-10",
                        (row.row.status === "missing" || row.row.status === "offline") && "opacity-50 grayscale"
                      )}
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CollectionRowLabel
                          name={row.name}
                          type={row.type}
                          status={row.row.status}
                          iconClassName={cn(
                            row.type === "folder"
                              ? isSelected ? "text-primary-foreground" : "text-primary"
                              : isSelected
                                ? "text-primary-foreground"
                                : "text-muted-foreground",
                            (row.row.status === "missing" || row.row.status === "offline") && "text-muted-foreground"
                          )}
                          labelClassName={
                            isSelected ? "text-primary-foreground" : "text-foreground"
                          }
                        />
                      </div>
                      <span
                        className={cn(
                          "cursor-default select-text truncate text-xs",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {row.row.kindLabel || "-"}
                      </span>
                      <span
                        className={cn(
                          "cursor-default select-text truncate text-xs",
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {row.row.dateModifiedLabel || "-"}
                      </span>
                    </button>
                  </TreeNode>
                );
              })}
            </div>
          </TreeView>
        </TreeProvider>
      )}

    </div>
  );
};
