import { FileRowLabel } from "@/components/file-explorer/FileRowLabel";
import { TreeNode, TreeProvider, TreeView } from "@/components/kibo-ui/tree";
import { cn } from "@/lib/utils";
import { FileRow, FolderListing } from "@/lib/fs";

type FileListViewProps = {
  listing: FolderListing;
  selectedFiles: Record<string, FileRow>;
  onSelectFolder: (path: string) => void;
  onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
};

export const FileListView = ({
  listing,
  selectedFiles,
  onSelectFolder,
  onSelectFile,
}: FileListViewProps) => {
  const rows = [
    ...listing.folders.map((folder) => ({
      type: "folder" as const,
      path: folder.path,
      name: folder.name,
    })),
    ...listing.files.map((file) => ({
      type: "file" as const,
      path: file.path,
      name: file.name,
      extension: file.extension,
      sizeLabel: file.sizeLabel,
      row: file,
    })),
  ];

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_120px_90px] gap-3 border-b border-border/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span>Name</span>
        <span>Extension</span>
        <span>Size</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">No items found in this folder.</div>
      ) : (
        <TreeProvider selectable={false} showLines={false} className="w-full">
          <TreeView className="p-0">
            <div className="divide-y divide-border/40">
              {rows.map((row) => {
                const isSelected =
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
                        onSelectFile(row.row, { additive: event.metaKey || event.ctrlKey });
                      }}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_120px_90px] items-center gap-3 px-4 py-2 text-left text-sm transition",
                        isSelected
                          ? "bg-accent/60 text-foreground"
                          : "text-foreground hover:bg-muted/60 focus-visible:bg-muted/60",
                      )}
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileRowLabel
                          name={row.name}
                          type={row.type}
                          labelClassName="font-medium text-foreground"
                        />
                      </div>
                      <span className="truncate text-sm text-muted-foreground">
                        {row.type === "file" ? row.extension || "-" : "-"}
                      </span>
                      <span className="truncate text-sm text-muted-foreground">
                        {row.type === "file" ? row.sizeLabel : "-"}
                      </span>
                    </button>
                  </TreeNode>
                );
              })}
            </div>
          </TreeView>
        </TreeProvider>
      )}
    </>
  );
};
