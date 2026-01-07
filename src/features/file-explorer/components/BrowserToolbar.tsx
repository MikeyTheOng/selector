import { ExplorerToolbar } from "@/components/explorer/ExplorerToolbar";
import type { ExplorerViewMode } from "@/types/explorer";

type BrowserToolbarProps = {
  currentFolderName: string;
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
  viewMode,
  onViewModeChange,
  fileCount,
  folderCount,
  selectedCount,
  isSelectionOpen,
  onToggleSelection,
}: BrowserToolbarProps) => {
  return (
    <ExplorerToolbar
      title={currentFolderName}
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