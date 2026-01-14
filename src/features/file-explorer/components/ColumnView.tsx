import { TreeNode, TreeProvider, TreeView } from "@/components/kibo-ui/tree";
import { FileRowLabel } from "./FileRowLabel";
import { cn } from "@/lib/utils";
import { getParentPath } from "@/lib/path-utils";
import { fileRowToExplorerItem, folderRowToExplorerItem } from "@/lib/explorer-utils";
import type { FolderListing, LocationItem, ExplorerItem } from "@/types/explorer";
import { useEffect, useMemo } from "react";

type ColumnViewProps = {
  locations: LocationItem[];
  selectedFolder: string | null;
  selectedPaths: Record<string, ExplorerItem>;
  lastClickedPath: string | null;
  focusedPath: string | null;
  getListingForPath: (path: string) => FolderListing | undefined;
  onEnsureListing: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onSelectItem: (item: ExplorerItem, options?: { additive?: boolean }) => void;
  onSelectRange: (from: ExplorerItem, to: ExplorerItem, allItems: ExplorerItem[]) => void;
  onFocusItem: (item: ExplorerItem) => void;
  onToggleSelection: (item: ExplorerItem) => void;
};

export const ColumnView = ({
  locations,
  selectedFolder,
  selectedPaths,
  lastClickedPath,
  focusedPath,
  getListingForPath,
  onEnsureListing,
  onSelectFolder,
  onSelectItem,
  onSelectRange,
  onFocusItem,
  onToggleSelection,
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
            
            const columnItems = listing ? [
                ...listing.folders.map(folderRowToExplorerItem),
                ...listing.files.map(fileRowToExplorerItem)
            ] : [];

            return (
              <div key={path} className="h-full w-64 shrink-0 min-h-0">
                <div className="h-full min-h-0 overflow-y-auto">
                  <TreeView className="p-0">
                    {!listing || listing.isLoading ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">Loading...</div>
                    ) : listing.error ? (
                      <div className="px-3 py-4 text-sm text-destructive">{listing.error}</div>
                    ) : columnItems.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground">
                        No items found.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {columnItems.map((item) => {
                          const isSelected = Boolean(selectedPaths[item.path]);
                          const isInActivePath =
                            item.kind === "folder" && selectedChildPath === item.path;
                          const isFocused = focusedPath === item.path;

                          return (
                            <TreeNode key={item.path} nodeId={item.path} level={0}>
                              <button
                                type="button"
                                onClick={(event) => {
                                  if (item.kind === "folder") {
                                    onSelectFolder(item.path);
                                    if (event.metaKey || event.ctrlKey) {
                                      onToggleSelection(item);
                                    }
                                    onFocusItem(item);
                                    return;
                                  }

                                  // Shift+click for range selection (only within same column)
                                  if (
                                    event.shiftKey &&
                                    lastClickedPath &&
                                    getParentPath(lastClickedPath) === path
                                  ) {
                                    const fromItem = columnItems.find(i => i.path === lastClickedPath);
                                    if (fromItem) {
                                        onSelectRange(fromItem, item, columnItems);
                                        onFocusItem(item);
                                        return;
                                    }
                                  }

                                  if (event.metaKey || event.ctrlKey) {
                                    onToggleSelection(item);
                                  } else {
                                    onSelectItem(item);
                                  }
                                  onFocusItem(item);
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
                                  name={item.name}
                                  type={item.kind}
                                  iconClassName={cn(
                                    item.kind === "folder"
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