import { FileRowLabel } from "./FileRowLabel";
import { TreeNode, TreeProvider, TreeView } from "@/components/kibo-ui/tree";
import type { LastClickedFile } from "../hooks/use-file-selection";
import { cn } from "@/lib/utils";
import type { FileRow, FolderListing } from "@/types/fs";

type FileListViewProps = {
  listing: FolderListing;
  selectedFiles: Record<string, FileRow>;
  lastClickedFile: LastClickedFile | null;
  onSelectFolder: (path: string) => void;
  onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
  onSelectRange: (from: FileRow, to: FileRow, allFiles: FileRow[]) => void;
  onUpdateLastClickedFile: (file: FileRow) => void;
};

export const FileListView = ({
  listing,
  selectedFiles,
  lastClickedFile,
  onSelectFolder,
  onSelectFile,
  onSelectRange,
  onUpdateLastClickedFile,
}: FileListViewProps) => {
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

  const handleFileClick = (event: React.MouseEvent, file: FileRow) => {
    // Shift+click for range selection
    if (event.shiftKey && lastClickedFile) {
      onSelectRange(lastClickedFile.file, file, listing.files);
      onUpdateLastClickedFile(file);
      return;
    }

    // Regular click or Cmd/Ctrl+click
    onSelectFile(file, { additive: event.metaKey || event.ctrlKey });
    onUpdateLastClickedFile(file);
  };

  return (
    <div tabIndex={0} className="outline-none focus:outline-none">
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
                      type="button"
                      onClick={(event) => {
                        if (row.type === "folder") {
                          onSelectFolder(row.path);
                          return;
                        }
                        handleFileClick(event, row.row);
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

    </div>
  );
};
