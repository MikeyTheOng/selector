import { TreeNode, TreeProvider, TreeView } from "@/components/kibo-ui/tree";
import { FileRowLabel } from "./FileRowLabel";
import type { LastClickedFile } from "../hooks/use-file-selection";
import { cn } from "@/lib/utils";
import type { FileRow, FolderListing, LocationItem } from "@/types/fs";
import { useEffect, useMemo } from "react";

type ColumnViewProps = {
  locations: LocationItem[];
  selectedFolder: string | null;
  selectedFiles: Record<string, FileRow>;
  lastClickedFile: LastClickedFile | null;
  focusedFile: LastClickedFile | null;
  getListingForPath: (path: string) => FolderListing | undefined;
  onEnsureListing: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
  onSelectRange: (from: FileRow, to: FileRow, allFiles: FileRow[]) => void;
  onUpdateLastClickedFile: (file: FileRow, columnPath?: string) => void;
  onFocusFile: (file: FileRow, columnPath?: string) => void;
  onToggleFileSelection: (file: FileRow) => void;
};

export const ColumnView = ({
  locations,
  selectedFolder,
  selectedFiles,
  lastClickedFile,
  focusedFile,
  getListingForPath,
  onEnsureListing,
  onSelectFolder,
  onSelectFile,
  onSelectRange,
  onUpdateLastClickedFile,
  onFocusFile,
  onToggleFileSelection,
}: ColumnViewProps) => {
  const rootPath = useMemo(() => {
    if (!selectedFolder) {
      return null;
    }
    const sortedLocations = [...locations]
      .map((location) => location.path)
      .filter(
        (path) =>
          selectedFolder === path ||
          selectedFolder.startsWith(path.endsWith("/") ? path : `${path}/`),
      )
      .sort((a, b) => b.length - a.length);
    return sortedLocations[0] ?? selectedFolder;
  }, [locations, selectedFolder]);

  const columnPaths = useMemo(() => {
    if (!rootPath) {
      return [] as string[];
    }
    if (!selectedFolder || selectedFolder === rootPath) {
      return [rootPath];
    }
    const relative = selectedFolder.slice(rootPath.length);
    const segments = relative.split("/").filter(Boolean);
    const paths = [rootPath];
    let currentPath = rootPath;
    segments.forEach((segment) => {
      const nextPath = currentPath.endsWith("/")
        ? `${currentPath}${segment}`
        : `${currentPath}/${segment}`;
      paths.push(nextPath);
      currentPath = nextPath;
    });
    return paths;
  }, [rootPath, selectedFolder]);

  const selectedChildPaths = useMemo(
    () =>
      columnPaths.map((_, index) =>
        index < columnPaths.length - 1 ? columnPaths[index + 1] : null,
      ),
    [columnPaths],
  );

  useEffect(() => {
    columnPaths.forEach((path) => {
      onEnsureListing(path);
    });
  }, [columnPaths, onEnsureListing]);

  if (!selectedFolder || columnPaths.length === 0) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Select a folder.</div>;
  }

  return (
    <TreeProvider selectable={false} showLines={false} className="h-full w-full min-h-0">
      <div className="min-w-max h-full min-h-0">
        <div className="flex h-full min-h-0 divide-x divide-border/40">
          {columnPaths.map((path, columnIndex) => {
            const listing = getListingForPath(path);
            const selectedChildPath = selectedChildPaths[columnIndex];
            const rows =
              listing?.folders && listing?.files
                ? [
                    ...listing.folders.map((folder) => ({
                      ...folder,
                      type: "folder" as const,
                      row: {
                        path: folder.path,
                        name: folder.name,
                        size: 0,
                        modified: folder.modified,
                        extension: "",
                        kindLabel: "Folder",
                      } as FileRow,
                    })),
                    ...listing.files.map((file) => ({
                      ...file,
                      type: "file" as const,
                      row: file,
                    })),
                  ]
                : [];

            return (
              <div key={path} className="h-full w-64 shrink-0 min-h-0">
                <div className="h-full min-h-0 overflow-y-auto">
                  <TreeView className="p-0">
                    {!listing || listing.isLoading ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">Loading...</div>
                    ) : listing.error ? (
                      <div className="px-3 py-4 text-sm text-destructive">{listing.error}</div>
                    ) : rows.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">
                        No items found.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {rows.map((row) => {
                          const isSelected = Boolean(selectedFiles[row.path]);
                          const isInActivePath =
                            row.type === "folder" && selectedChildPath === row.path;
                          const isFocused = focusedFile?.file.path === row.path && focusedFile?.columnPath === path;

                          // Get files only for this column (for shift+click range selection)
                          const columnFiles = rows.map(r => r.row);

                          return (
                            <TreeNode key={row.path} nodeId={row.path} level={0}>
                              <button
                                type="button"
                                onClick={(event) => {
                                  if (row.type === "folder") {
                                    onSelectFolder(row.path);
                                    if (event.metaKey || event.ctrlKey) {
                                      onToggleFileSelection(row.row);
                                    }
                                    onFocusFile(row.row, path);
                                    return;
                                  }

                                  // Shift+click for range selection (only within same column)
                                  if (
                                    event.shiftKey &&
                                    lastClickedFile &&
                                    lastClickedFile.columnPath === path
                                  ) {
                                    onSelectRange(lastClickedFile.file, row.row, columnFiles);
                                    onFocusFile(row.row, path);
                                    return;
                                  }

                                  if (event.metaKey || event.ctrlKey) {
                                    onToggleFileSelection(row.row);
                                  } else {
                                    onSelectFile(row.row);
                                  }
                                  onFocusFile(row.row, path);
                                }}
                                className={cn(
                                  "flex w-full items-center px-2 py-1 text-left text-xs transition outline-none",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : isInActivePath
                                      ? "bg-active-path text-foreground font-medium"
                                      : "text-foreground hover:bg-muted/60",
                                  isFocused && "ring-1 ring-inset ring-ring ring-offset-0 z-10",
                                )}
                                aria-selected={isSelected || isInActivePath}
                              >
                                <FileRowLabel
                                  name={row.name}
                                  type={row.type}
                                  iconClassName={cn(
                                    row.type === "folder"
                                      ? isSelected ? "text-primary-foreground" : "text-primary"
                                      : isSelected
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground",
                                  )}
                                  labelClassName={
                                    isSelected
                                      ? "text-primary-foreground"
                                      : "text-foreground"
                                  }
                                />
                              </button>
                            </TreeNode>
                          );
                        })}
                      </div>
                    )}
                  </TreeView>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TreeProvider>
  );
};
