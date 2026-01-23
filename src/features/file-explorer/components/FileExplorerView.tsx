import { useCallback, type ComponentType } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExplorerToolbar } from "@/components/explorer/ExplorerToolbar";
import type { ExplorerSelectionPanelProps } from "@/components/explorer/ExplorerSelectionPanel";
import { useNavigation } from "@/hooks/use-navigation";
import { useExplorerShortcuts } from "@/hooks/explorer/use-explorer-shortcuts";
import { ColumnView } from "./ColumnView";
import { FileListView } from "./FileListView";
import { PathBar } from "./PathBar";
import { useExplorerContext } from "../context/ExplorerContext";
import type { LocationItem, ExplorerItem } from "@/types/explorer";
import {
  fileRowToExplorerItem,
  folderRowToExplorerItem,
} from "@/lib/explorer-utils";
import { getPathBaseName } from "@/lib/path-utils";
import { Button } from "@/components/ui/button";

type FileExplorerViewProps = {
  locations: LocationItem[];
  folderId: string | null;
  onSelectFolder: (path: string) => void;
  SelectionPanel: ComponentType<ExplorerSelectionPanelProps>;
};

export const FileExplorerView = ({
  locations,
  folderId,
  onSelectFolder,
  SelectionPanel,
}: FileExplorerViewProps) => {
  const {
    listing,
    ensureListing,
    getListingForPath,
    selectedPaths,
    selectedEntries,
    selectedCount,
    lastClickedPath,
    focusedPath,
    selectItem,
    selectMultiple,
    selectRange,
    toggleSelection,
    removeSelection,
    clearSelections,
    focusItem,
    clearFocus,
    isPreviewActive,
    togglePreview,
    closePreview,
    viewMode,
    setViewMode,
  } = useExplorerContext();

  const { goBack, goForward, canGoBack, canGoForward } = useNavigation();

  const currentFolderName = folderId
    ? getPathBaseName(folderId)
    : "Select a folder";

  const navigationButtons = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={goBack}
        disabled={!canGoBack}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={goForward}
        disabled={!canGoForward}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const handleItemSelection = useCallback(
    (item: ExplorerItem, options?: { additive?: boolean }) => {
      if (options?.additive) {
        toggleSelection(item);
      } else {
        selectItem(item);
      }
      focusItem(item);
    },
    [selectItem, toggleSelection, focusItem],
  );

  // Helper to get items for the current active view context (for keyboard nav)
  const getCurrentViewItems = useCallback(() => {
    // In list view, it's just the current listing
    if (viewMode === "list") {
      return [
        ...listing.folders.map(folderRowToExplorerItem),
        ...listing.files.map(fileRowToExplorerItem),
      ];
    }

    const currentListing = getListingForPath(folderId || "");
    if (!currentListing) return [];

    return [
      ...currentListing.folders.map(folderRowToExplorerItem),
      ...currentListing.files.map(fileRowToExplorerItem),
    ];
  }, [listing, viewMode, folderId, getListingForPath]);

  useExplorerShortcuts({
    getCurrentViewItems,
    selectMultiple,
    clearSelections,
    clearFocus,
    focusedPath,
    viewMode,
    folderId,
    onSelectFolder,
    focusItem,
    toggleSelection,
    selectRange,
    lastClickedPath,
    isPreviewActive,
    togglePreview,
    closePreview,
  });

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <ExplorerToolbar
        title={currentFolderName}
        leftContent={navigationButtons}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fileCount={listing.fileCount}
        folderCount={listing.folderCount}
        disabledViewModes={["grid"]}
        selectionPanel={
          <SelectionPanel
            selectedCount={selectedCount}
            entries={selectedEntries}
            onRemoveSelection={removeSelection}
            onClearAllSelections={clearSelections}
          />
        }
      />

      <div className="flex-1 overflow-auto">
        {viewMode === "column" ? (
          <ColumnView
            locations={locations}
            selectedFolder={folderId}
            selectedPaths={selectedPaths}
            lastClickedPath={lastClickedPath}
            focusedPath={focusedPath}
            getListingForPath={getListingForPath}
            onEnsureListing={ensureListing}
            onSelectFolder={onSelectFolder}
            onSelectItem={handleItemSelection}
            onSelectRange={selectRange}
            onFocusItem={focusItem}
            onToggleSelection={toggleSelection}
          />
        ) : listing.isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            Loading files...
          </div>
        ) : listing.error ? (
          <div className="px-4 py-6 text-sm text-destructive">
            {listing.error}
          </div>
        ) : (
          <FileListView
            listing={listing}
            selectedPaths={selectedPaths}
            lastClickedPath={lastClickedPath}
            focusedPath={focusedPath}
            viewMode={viewMode}
            onSelectFolder={onSelectFolder}
            onSelectItem={handleItemSelection}
            onSelectRange={selectRange}
            onFocusItem={focusItem}
            onToggleSelection={toggleSelection}
          />
        )}
      </div>

      <PathBar
        selectedFolder={folderId}
        locations={locations}
        onSelectFolder={onSelectFolder}
      />
    </section>
  );
};
