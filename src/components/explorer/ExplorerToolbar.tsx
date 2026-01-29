import React from "react";
import { Columns3, List, LayoutGrid, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { ExplorerViewMode } from "@/types/explorer";

type ViewModeItem = {
  value: ExplorerViewMode;
  label: string;
  Icon: LucideIcon;
};

const VIEW_MODE_ITEMS: ViewModeItem[] = [
  { value: "list", label: "List view", Icon: List },
  { value: "column", label: "Column view", Icon: Columns3 },
  { value: "grid", label: "Grid view", Icon: LayoutGrid },
];

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
          variant={"outline"}
          onValueChange={(value) =>
            value && onViewModeChange(value as ExplorerViewMode)
          }
          className="group h-8 border-none text-xs text-muted-foreground hover:bg-foreground/10 transition"
          aria-label="View mode"
        >
          {VIEW_MODE_ITEMS.map(({ value, label, Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className={cn(
                "gap-1 px-2 h-8",
                viewMode === value
                  ? "bg-foreground/10 text-foreground"
                  : "hover:bg-transparent",
              )}
              aria-label={label}
              disabled={disabledViewModes.includes(value)}
            >
              <Icon className="h-4 w-4" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {selectionPanel}

        {rightContent}
      </div>
    </div>
  );
};
