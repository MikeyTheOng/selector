import { useCallback, useEffect, useState } from "react";
import { BrowserToolbar } from "@/components/file-explorer/BrowserToolbar";
import { ColumnView } from "@/components/file-explorer/ColumnView";
import { FileListView } from "@/components/file-explorer/FileListView";
import { LocationsSidebar } from "@/components/file-explorer/LocationsSidebar";
import { PathBar } from "@/components/file-explorer/PathBar";
import { SelectionSheet } from "@/components/file-explorer/SelectionSheet";
import { useFileSelection } from "@/hooks/use-file-selection";
import { useFolderListing } from "@/hooks/use-folder-listing";
import { FileRow, LocationItem, getPathBaseName } from "@/lib/fs";

type FileExplorerViewProps = {
  locations: LocationItem[];
  locationsError: string | null;
  selectedFolder: string | null;
  onSelectFolder: (path: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
};

export const FileExplorerView = ({
  locations,
  locationsError,
  selectedFolder,
  onSelectFolder,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: FileExplorerViewProps) => {
  const { listing, ensureListing, getListingForPath } = useFolderListing(selectedFolder, locations);
  const {
    selectedFiles,
    selectedEntries,
    selectedCount,
    selectFile,
    selectMultiple,
    toggleFileSelection,
    removeSelection,
    clearSelections,
  } = useFileSelection();
  const [viewMode, setViewMode] = useState<"list" | "column">("list");
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const currentFolderName = selectedFolder ? getPathBaseName(selectedFolder) : "Select a folder";
  const handleFileSelection = useCallback(
    (row: FileRow, options?: { additive?: boolean }) => {
      if (options?.additive) {
        toggleFileSelection(row);
      } else {
        selectFile(row);
      }
    },
    [selectFile, toggleFileSelection],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== "a") return;

      if (listing.isLoading || listing.error || listing.files.length === 0) {
        return;
      }

      selectMultiple(listing.files, { additive: true });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [listing, selectMultiple]);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <LocationsSidebar
        locations={locations}
        locationsError={locationsError}
        selectedFolder={selectedFolder}
        onSelectFolder={onSelectFolder}
      />

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <BrowserToolbar
          currentFolderName={currentFolderName}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={onBack}
          onForward={onForward}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          fileCount={listing.fileCount}
          folderCount={listing.folderCount}
          selectedCount={selectedCount}
          isSelectionOpen={isSelectionOpen}
          onToggleSelection={() => setIsSelectionOpen((prev) => !prev)}
        />

        <SelectionSheet
          isOpen={isSelectionOpen}
          entries={selectedEntries}
          onClose={() => setIsSelectionOpen(false)}
          onRemove={removeSelection}
          onClear={clearSelections}
        />

        <div className="flex-1 overflow-auto">
          {viewMode === "list" ? (
            listing.isLoading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Loading files...</div>
            ) : listing.error ? (
              <div className="px-4 py-6 text-sm text-destructive">{listing.error}</div>
            ) : (
              <FileListView
                listing={listing}
                selectedFiles={selectedFiles}
                onSelectFolder={onSelectFolder}
                onSelectFile={handleFileSelection}
                onSelectMultiple={selectMultiple}
              />
            )
          ) : (
            <ColumnView
              locations={locations}
              selectedFolder={selectedFolder}
              selectedFiles={selectedFiles}
              getListingForPath={getListingForPath}
              onEnsureListing={ensureListing}
              onSelectFolder={onSelectFolder}
              onSelectFile={handleFileSelection}
            />
          )}
        </div>

        <PathBar
          selectedFolder={selectedFolder}
          locations={locations}
          onSelectFolder={onSelectFolder}
        />
      </section>
    </div>
  );
};
