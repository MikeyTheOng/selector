import { ExplorerToolbar } from "@/components/explorer/ExplorerToolbar";
import { useExplorerContext } from "../context/ExplorerContext";
import { getPathBaseName } from "@/lib/path-utils";

export const BrowserToolbar = () => {
  const {
    folderId,
    viewMode,
    setViewMode,
    listing,
    selectedCount,
    isSelectionOpen,
    setIsSelectionOpen,
  } = useExplorerContext();

  const currentFolderName = folderId ? getPathBaseName(folderId) : "Select a folder";

  return (
    <ExplorerToolbar
      title={currentFolderName}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      fileCount={listing.fileCount}
      folderCount={listing.folderCount}
      selectedCount={selectedCount}
      isSelectionOpen={isSelectionOpen}
      onToggleSelection={() => setIsSelectionOpen(!isSelectionOpen)}
      disabledViewModes={["grid"]}
    />
  );
};