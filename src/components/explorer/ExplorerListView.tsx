import React from "react";
import { TreeProvider, TreeView, TreeNode } from "@/components/kibo-ui/tree";
import { cn } from "@/lib/utils";
import type { ExplorerItem, ExplorerViewMode } from "@/types/explorer";

export interface ExplorerListViewProps {
  /** All items to display in the view */
  items: ExplorerItem[];
  /** Current view mode */
  viewMode: ExplorerViewMode;
  /** Map of selected item paths to their item data */
  selectedPaths: Record<string, ExplorerItem>;
  /** The item path that was most recently clicked (used for range selection) */
  lastClickedPath?: string | null;
  /** The item path that currently has focus */
  focusedPath?: string | null;
  /** Callback when an item is clicked */
  onItemClick: (item: ExplorerItem, event: React.MouseEvent) => void;
  /** Callback when an item is double clicked */
  onItemDoubleClick: (item: ExplorerItem) => void;
  /** Callback when an item is right-clicked */
  onItemContextMenu?: (item: ExplorerItem, event: React.MouseEvent) => void;
  /** Callback when the view background is right-clicked */
  onContextMenu?: (event: React.MouseEvent) => void;
  /** Optional custom renderer for the item's label/content */
  renderItemLabel?: (props: { item: ExplorerItem; isSelected: boolean }) => React.ReactNode;
  /** Optional message to show when the list is empty */
  emptyMessage?: string;
  /** Optional additional class names for the container */
  className?: string;
}

export const ExplorerListView = ({
  items,
  viewMode,
  selectedPaths,
  focusedPath,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  onContextMenu,
  renderItemLabel,
  emptyMessage = "No items found.",
  className,
}: ExplorerListViewProps) => {
  if (items.length === 0) {
    return (
      <div 
        className="px-4 py-6 text-sm text-muted-foreground"
        onContextMenu={onContextMenu}
      >
        {emptyMessage}
      </div>
    );
  }

  const isList = viewMode === "list";

  if (viewMode === "grid") {
    return (
      <div
        onContextMenu={onContextMenu}
        className={cn(
          "grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 p-4",
          className
        )}
      >
        {items.map((item) => {
          const isSelected = Boolean(selectedPaths[item.path]);
          const isFocused = focusedPath === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={(e) => onItemClick(item, e)}
              onDoubleClick={() => onItemDoubleClick(item)}
              onContextMenu={(e) => {
                onItemContextMenu?.(item, e);
              }}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-lg p-2 text-center transition outline-none",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/60",
                isFocused && "ring-2 ring-ring ring-offset-2 z-10",
                (item.status === "missing" || item.status === "offline") && "opacity-50 grayscale"
              )}
              aria-selected={isSelected}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-background/50 text-3xl shadow-sm group-hover:bg-background/80">
                {/* Fallback icon logic if no custom renderer */}
                {renderItemLabel ? renderItemLabel({ item, isSelected }) : (
                  <span className="text-xl">{item.kind === "folder" ? "📁" : "📄"}</span>
                )}
              </div>
              <span className="w-full truncate text-xs font-medium">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      onContextMenu={onContextMenu}
      className={cn("outline-none focus:outline-none", className)}
      data-testid="explorer-list-view"
    >
      {/* Header (Only for List view) */}      {isList && (
        <div className="grid cursor-default select-none grid-cols-[minmax(0,1fr)_160px_170px] gap-3 border-b border-border/50 px-3 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <span>Name</span>
          <span>Kind</span>
          <span>Date modified</span>
        </div>
      )}

      <TreeProvider selectable={false} showLines={false} className="w-full">
        <TreeView className="p-0">
          <div className={cn("divide-y divide-border/40", !isList && "divide-none")}>
            {items.map((item) => {
              const isSelected = Boolean(selectedPaths[item.path]);
              const isFocused = focusedPath === item.path;

              return (
                <TreeNode key={item.path} nodeId={item.path} level={0}>
                  <button
                    type="button"
                    onClick={(e) => onItemClick(item, e)}
                    onDoubleClick={() => onItemDoubleClick(item)}
                    onContextMenu={(e) => {
                      onItemContextMenu?.(item, e);
                    }}
                    className={cn(
                      "grid w-full items-center gap-3 px-2 py-1 text-left text-xs transition outline-none",
                      isList ? "grid-cols-[minmax(0,1fr)_160px_170px]" : "flex",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted/60",
                      isFocused && "ring-1 ring-inset ring-ring ring-offset-0 z-10",
                      (item.status === "missing" || item.status === "offline") && "opacity-50 grayscale"
                    )}
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {renderItemLabel ? renderItemLabel({ item, isSelected }) : (
                        <>
                          <span className="shrink-0">{item.kind === "folder" ? "📁" : "📄"}</span>
                          <span className="truncate">{item.name}</span>
                        </>
                      )}
                    </div>

                    {isList && (
                      <>
                        <span
                          className={cn(
                            "cursor-default select-text truncate text-xs",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          {item.kindLabel || "-"}
                        </span>
                        <span
                          className={cn(
                            "cursor-default select-text truncate text-xs",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground",
                          )}
                        >
                          {item.dateModifiedLabel || "-"}
                        </span>
                      </>
                    )}
                  </button>
                </TreeNode>
              );
            })}
          </div>
        </TreeView>
      </TreeProvider>
    </div>
  );
};