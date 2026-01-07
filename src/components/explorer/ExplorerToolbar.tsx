import React from "react";
import { Columns2, LayoutList, Grid2X2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { ExplorerViewMode } from "@/types/explorer";

export interface ExplorerToolbarProps {
  /** Current view mode (list, grid, or column) */
  viewMode: ExplorerViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ExplorerViewMode) => void;
  /** Total number of files */
  fileCount: number;
  /** Total number of folders */
  folderCount: number;
  /** Number of currently selected items */
  selectedCount: number;
  /** Whether the selection sheet/panel is open */
  isSelectionOpen: boolean;
  /** Callback to toggle the selection sheet/panel */
  onToggleSelection: () => void;
  /** Optional title to display on the left */
  title?: string;
  /** Optional custom content for the left side (e.g., navigation buttons) */
  leftContent?: React.ReactNode;
  /** Optional custom content for the right side (e.g., action buttons) */
  rightContent?: React.ReactNode;
  /** Optional additional class names */
  className?: string;
}

export const ExplorerToolbar = ({
  viewMode,
  onViewModeChange,
  fileCount,
  folderCount,
  selectedCount,
  isSelectionOpen,
  onToggleSelection,
  title,
  leftContent,
  rightContent,
  className,
}: ExplorerToolbarProps) => {
  return (
    <div 
      className={cn(
        "flex cursor-default select-none flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {leftContent}
        {title && (
          <p className="cursor-default truncate text-base font-semibold text-foreground">
            {title}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && onViewModeChange(value as ExplorerViewMode)}
          className="rounded-full border border-border/50 bg-background/70 p-1 text-[0.6875rem] font-semibold text-muted-foreground"
          aria-label="View mode"
        >
          <ToggleGroupItem
            value="list"
            className={cn(
              "gap-1 rounded-full px-3 py-1",
              viewMode === "list" ? "bg-foreground/10 text-foreground" : "hover:text-foreground",
            )}
            aria-label="List view"
          >
            <LayoutList className="h-3.5 w-3.5" />
            List
          </ToggleGroupItem>
          <ToggleGroupItem
            value="grid"
            className={cn(
              "gap-1 rounded-full px-3 py-1",
              viewMode === "grid" ? "bg-foreground/10 text-foreground" : "hover:text-foreground",
            )}
            aria-label="Grid view"
          >
            <Grid2X2 className="h-3.5 w-3.5" />
            Grid
          </ToggleGroupItem>
          <ToggleGroupItem
            value="column"
            className={cn(
              "gap-1 rounded-full px-3 py-1",
              viewMode === "column" ? "bg-foreground/10 text-foreground" : "hover:text-foreground",
            )}
            aria-label="Column view"
          >
            <Columns2 className="h-3.5 w-3.5" />
            Column
          </ToggleGroupItem>
        </ToggleGroup>

        <Badge
          variant="secondary"
          className="rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          {fileCount} files - {folderCount} folders
        </Badge>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleSelection}
          className={cn(
            "h-7 rounded-full border-border/50 px-3 py-1 text-xs font-semibold",
            isSelectionOpen
              ? "bg-foreground/10 text-foreground"
              : "bg-background/70 text-muted-foreground hover:text-foreground",
          )}
          aria-expanded={isSelectionOpen}
        >
          {selectedCount} selected
        </Button>

        {rightContent}
      </div>
    </div>
  );
};