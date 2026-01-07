import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExplorerToolbar } from "@/components/explorer/ExplorerToolbar";
import { cn } from "@/lib/utils";
import type { ExplorerViewMode } from "@/types/explorer";

type BrowserToolbarProps = {
  currentFolderName: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  viewMode: ExplorerViewMode;
  onViewModeChange: (mode: ExplorerViewMode) => void;
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
}: BrowserToolbarProps) => {
  const leftContent = (
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
  );

  return (
    <ExplorerToolbar
      title={currentFolderName}
      leftContent={leftContent}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      fileCount={fileCount}
      folderCount={folderCount}
      selectedCount={selectedCount}
      isSelectionOpen={isSelectionOpen}
      onToggleSelection={onToggleSelection}
      disabledViewModes={["grid"]}
    />
  );
};