import { TreeNode, TreeProvider, TreeView } from "@/components/kibo-ui/tree";
import { FileRowLabel } from "./FileRowLabel";
import { cn } from "@/lib/utils";
import type { FileRow, FolderListing, LocationItem } from "@/types/fs";
import { useEffect, useMemo } from "react";

type ColumnViewProps = {
  locations: LocationItem[];
  selectedFolder: string | null;
  selectedFiles: Record<string, FileRow>;
  getListingForPath: (path: string) => FolderListing | undefined;
  onEnsureListing: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
};

export const ColumnView = ({
  locations,
  selectedFolder,
  selectedFiles,
  getListingForPath,
  onEnsureListing,
  onSelectFolder,
  onSelectFile,
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
                      type: "folder" as const,
                      path: folder.path,
                      name: folder.name,
                    })),
                    ...listing.files.map((file) => ({
                      type: "file" as const,
                      path: file.path,
                      name: file.name,
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
                          const isFileSelected =
                            row.type === "file" && Boolean(selectedFiles[row.path]);
                          const isFolderSelected =
                            row.type === "folder" && selectedChildPath === row.path;
                          const isSelected = isFileSelected || isFolderSelected;

                          return (
                            <TreeNode key={row.path} nodeId={row.path} level={0}>
                              <button
                                type="button"
                                onClick={(event) => {
                                  if (row.type === "folder") {
                                    onSelectFolder(row.path);
                                    return;
                                  }
                                  onSelectFile(row.row, {
                                    additive: event.metaKey || event.ctrlKey,
                                  });
                                }}
                                className={cn(
                                  "flex w-full items-center px-2 py-1 text-left text-xs transition",
                                  isFolderSelected
                                    ? "bg-accent text-foreground"
                                    : isFileSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "text-foreground hover:bg-muted/60 focus-visible:bg-muted/60",
                                )}
                                aria-selected={isSelected}
                              >
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
                                    isFileSelected
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
