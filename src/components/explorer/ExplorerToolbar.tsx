import React from "react";
import { Columns2, LayoutList, Grid2X2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  /** Optional title to display on the left */
  title?: string;
  /** Optional custom content for the left side (e.g., navigation buttons) */
  leftContent?: React.ReactNode;
  /** Optional custom content for the right side (e.g., action buttons) */
  rightContent?: React.ReactNode;
  /** Optional additional class names */
  className?: string;
  /** View modes to disable */
  disabledViewModes?: ExplorerViewMode[];
  /** Optional slot for rendering selection UI (trigger + dialog/sheet) */
  selectionPanel?: React.ReactNode;
}

export const ExplorerToolbar = ({
  viewMode,
  onViewModeChange,
  fileCount,
  folderCount,
  title,
  leftContent,
  rightContent,
  className,
  disabledViewModes = [], // TODO: Remove once disabled view modes are implemented
  selectionPanel,
}: ExplorerToolbarProps) => {
  return (
    <div
      className={cn(
        "flex cursor-default select-none flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {leftContent}
        {title && (
          <p className="cursor-default truncate text-base font-semibold text-foreground">
            {title}
          </p>
        )}
        <Badge
          variant="outline"
          className="text-xs font-medium font-stretch-condensed text-muted-foreground"
        >
          {fileCount} files - {folderCount} folders
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) =>
            value && onViewModeChange(value as ExplorerViewMode)
          }
          className="rounded-full border border-border/50 bg-background/70 p-1 text-[0.6875rem] font-semibold text-muted-foreground"
          aria-label="View mode"
        >
          <ToggleGroupItem
            value="list"
            className={cn(
              "gap-1 rounded-full px-3 py-1",
              viewMode === "list"
                ? "bg-foreground/10 text-foreground"
                : "hover:text-foreground",
            )}
            aria-label="List view"
            disabled={disabledViewModes.includes("list")}
          >
            <LayoutList className="h-3.5 w-3.5" />
            List
          </ToggleGroupItem>
          <ToggleGroupItem
            value="column"
            className={cn(
              "gap-1 rounded-full px-3 py-1",
              viewMode === "column"
                ? "bg-foreground/10 text-foreground"
                : "hover:text-foreground",
            )}
            aria-label="Column view"
            disabled={disabledViewModes.includes("column")}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Column
          </ToggleGroupItem>
          <ToggleGroupItem
            value="grid"
            className={cn(
              "gap-1 rounded-full px-3 py-1",
              viewMode === "grid"
                ? "bg-foreground/10 text-foreground"
                : "hover:text-foreground",
            )}
            aria-label="Grid view"
            disabled={disabledViewModes.includes("grid")}
          >
            <Grid2X2 className="h-3.5 w-3.5" />
            Grid
          </ToggleGroupItem>
        </ToggleGroup>

        {selectionPanel}

        {rightContent}
      </div>
    </div>
  );
};
