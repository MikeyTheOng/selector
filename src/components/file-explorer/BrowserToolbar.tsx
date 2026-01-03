import { ChevronLeft, ChevronRight, Columns2, LayoutList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type BrowserToolbarProps = {
  currentFolderName: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  viewMode: "list" | "column";
  onViewModeChange: (mode: "list" | "column") => void;
  fileCount: number;
  folderCount: number;
  selectedCount: number;
  isSelectionOpen: boolean;
  onToggleSelection: () => void;
};

export const BrowserToolbar = ({
  currentFolderName,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  viewMode,
  onViewModeChange,
  fileCount,
  folderCount,
  selectedCount,
  isSelectionOpen,
  onToggleSelection,
}: BrowserToolbarProps) => (
  <div className="flex cursor-default select-none flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
    <div className="flex min-w-0 items-center gap-2">
      <div className="inline-flex items-center rounded-full border border-border/50 bg-background/70 p-1 text-[0.6875rem] font-semibold text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack}
          className={cn("h-7 w-7 rounded-full", canGoBack ? "hover:text-foreground" : "opacity-50")}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onForward}
          disabled={!canGoForward}
          className={cn("h-7 w-7 rounded-full", canGoForward ? "hover:text-foreground" : "opacity-50")}
          aria-label="Go forward"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="cursor-default truncate text-base font-semibold text-foreground">
        {currentFolderName}
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value) => value && onViewModeChange(value as "list" | "column")}
        className="rounded-full border border-border/50 bg-background/70 p-1 text-[0.6875rem] font-semibold text-muted-foreground"
        aria-label="View mode"
      >
        <ToggleGroupItem
          value="list"
          className={cn(
            "gap-1 rounded-full px-3 py-1",
            viewMode === "list" ? "bg-foreground/10 text-foreground" : "hover:text-foreground",
          )}
        >
          <LayoutList className="h-3.5 w-3.5" />
          List
        </ToggleGroupItem>
        <ToggleGroupItem
          value="column"
          className={cn(
            "gap-1 rounded-full px-3 py-1",
            viewMode === "column" ? "bg-foreground/10 text-foreground" : "hover:text-foreground",
          )}
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
    </div>
  </div>
);
