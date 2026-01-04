import { FileRowLabel } from "@/components/file-explorer/FileRowLabel";
import { TreeNode, TreeProvider, TreeView } from "@/components/kibo-ui/tree";
import { useMultiSelect } from "@/hooks/use-multi-select";
import { cn } from "@/lib/utils";
import { FileRow, FolderListing } from "@/lib/fs";
import { useRef } from "react";

type FileListViewProps = {
  listing: FolderListing;
  selectedFiles: Record<string, FileRow>;
  onSelectFolder: (path: string) => void;
  onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
  onSelectMultiple?: (rows: FileRow[], options?: { additive?: boolean }) => void;
};

export const FileListView = ({
  listing,
  selectedFiles,
  onSelectFolder,
  onSelectFile,
  onSelectMultiple,
}: FileListViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const rows = [
    ...listing.folders.map((folder) => ({
      type: "folder" as const,
      path: folder.path,
      name: folder.name,
      kindLabel: "Folder",
      dateModifiedLabel: folder.dateModifiedLabel,
    })),
    ...listing.files.map((file) => ({
      type: "file" as const,
      path: file.path,
      name: file.name,
      kindLabel: file.kindLabel,
      dateModifiedLabel: file.dateModifiedLabel,
      row: file,
    })),
  ];

  const { isDragging, selectionRectStyle, registerRowRef, handleMouseDown } = useMultiSelect({
    files: listing.files,
    onSelectFile,
    onSelectMultiple,
    containerRef,
  });

  const rectStyle = selectionRectStyle();

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      className="outline-none focus:outline-none"
    >
      <div className="grid cursor-default select-none grid-cols-[minmax(0,1fr)_160px_170px] gap-3 border-b border-border/50 px-3 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span>Name</span>
        <span>Kind</span>
        <span>Date modified</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-3 py-4 text-sm text-muted-foreground">No items found in this folder.</div>
      ) : (
        <TreeProvider selectable={false} showLines={false} className="w-full">
          <TreeView className="p-0">
            <div className="divide-y divide-border/40">
              {rows.map((row) => {
                const isFileSelected =
                  row.type === "file" ? Boolean(selectedFiles[row.path]) : false;

                return (
                  <TreeNode key={row.path} nodeId={row.path} level={0}>
                    <button
                      ref={(el) => {
                        if (row.type === "file") {
                          registerRowRef(row.path, el);
                        }
                      }}
                      type="button"
                      onClick={(event) => {
                        if (row.type === "folder") {
                          onSelectFolder(row.path);
                          return;
                        }
                        onSelectFile(row.row, { additive: event.metaKey || event.ctrlKey });
                      }}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_160px_170px] items-center gap-3 px-2 py-1 text-left text-xs transition",
                        isFileSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted/60 focus-visible:bg-muted/60",
                      )}
                      aria-selected={isFileSelected}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileRowLabel
                          name={row.name}
                          type={row.type}
                          iconClassName={cn(
                            row.type === "folder"
                              ? "text-primary"
                              : isFileSelected
                                ? "text-primary-foreground"
                                : "text-muted-foreground",
                          )}
                          labelClassName={
                            isFileSelected ? "text-primary-foreground" : "text-foreground"
                          }
                        />
                      </div>
                      <span
                        className={cn(
                          "cursor-default select-text truncate text-xs",
                          isFileSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {row.kindLabel || "-"}
                      </span>
                      <span
                        className={cn(
                          "cursor-default select-text truncate text-xs",
                          isFileSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                        )}
                      >
                        {row.dateModifiedLabel || "-"}
                      </span>
                    </button>
                  </TreeNode>
                );
              })}
            </div>
          </TreeView>
        </TreeProvider>
      )}

      {/* Drag selection rectangle */}
      {isDragging && rectStyle && (
        <div
          style={rectStyle}
          className="fixed pointer-events-none border border-primary/30 bg-primary/10"
        />
      )}
    </div>
  );
};
