import { useCallback, useState } from "react";
import { ColumnView } from "./components/file-explorer/ColumnView";
import { BrowserToolbar } from "./components/file-explorer/BrowserToolbar";
import { FileListView } from "./components/file-explorer/FileListView";
import { LocationsSidebar } from "./components/file-explorer/LocationsSidebar";
import { SelectionSheet } from "./components/file-explorer/SelectionSheet";
import { SelectionSummary } from "./components/file-explorer/SelectionSummary";
import { useFileSelection } from "./hooks/use-file-selection";
import { useFolderListing } from "./hooks/use-folder-listing";
import { useLocations } from "./hooks/use-locations";
import { useNavigation } from "./hooks/use-navigation";
import { FileRow, getPathBaseName } from "./lib/fs";

function App() {
  const { locations, error: locationsError, homePath } = useLocations();
  const { selectedFolder, navigateTo, canGoBack, canGoForward, goBack, goForward } =
    useNavigation(homePath);
  const { listing, ensureListing, getListingForPath } = useFolderListing(selectedFolder);
  const {
    selectedFiles,
    selectedEntries,
    selectedCount,
    selectFile,
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

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(76,138,255,0.18),transparent_55%),linear-gradient(135deg,rgba(248,250,255,0.9),rgba(236,240,247,0.9))] text-foreground">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur">
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <LocationsSidebar
            locations={locations}
            locationsError={locationsError}
            selectedFolder={selectedFolder}
            onSelectFolder={navigateTo}
          />

          <section className="relative flex min-h-0 flex-1 flex-col">
            <BrowserToolbar
              currentFolderName={currentFolderName}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onBack={goBack}
              onForward={goForward}
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
              {listing.isLoading ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">Loading files...</div>
              ) : listing.error ? (
                <div className="px-4 py-6 text-sm text-destructive">{listing.error}</div>
              ) : viewMode === "list" ? (
                <FileListView
                  listing={listing}
                  selectedFiles={selectedFiles}
                  onSelectFolder={navigateTo}
                  onSelectFile={handleFileSelection}
                />
              ) : (
                <ColumnView
                  locations={locations}
                  selectedFolder={selectedFolder}
                  selectedFiles={selectedFiles}
                  getListingForPath={getListingForPath}
                  onEnsureListing={ensureListing}
                  onSelectFolder={navigateTo}
                  onSelectFile={handleFileSelection}
                />
              )}
            </div>

            <SelectionSummary entries={selectedEntries} onRemove={removeSelection} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
