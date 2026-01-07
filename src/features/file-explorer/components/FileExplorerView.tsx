import { useCallback, useEffect, useState } from "react";
import { BrowserToolbar } from "./BrowserToolbar";
import { ColumnView } from "./ColumnView";
import { FileListView } from "./FileListView";
import { LocationsSidebar } from "./LocationsSidebar";
import { PathBar } from "./PathBar";
import { SelectionSheet } from "./SelectionSheet";
import { useFileSelection } from "../hooks/use-file-selection";
import { useFolderListing } from "../hooks/use-folder-listing";
import { useQuickLook } from "../hooks/use-quick-look";
import { useExplorerViewState } from "@/hooks/explorer/useExplorerViewState";
import { listen } from "@tauri-apps/api/event";
import type { FileRow, LocationItem } from "@/types/fs";
import { getPathBaseName } from "@/lib/path-utils";
import { folderToFileRow } from "@/lib/explorer-utils";
import type { ExplorerViewMode } from "@/types/explorer";

interface QuickLookEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

type FileExplorerViewProps = {
  locations: LocationItem[];
  locationsError: string | null;
  selectedFolder: string | null;
  onSelectFolder: (path: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  /** Optional slot for injecting external action UI into the SelectionSheet */
  selectionActions?: (entries: FileRow[]) => React.ReactNode;
  /** Optional slot for injecting Collections UI into the sidebar */
  renderCollections?: () => React.ReactNode;
  /** Optional slot to override the main content area */
  renderMainContent?: () => React.ReactNode;
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
  selectionActions,
  renderCollections,
  renderMainContent,
}: FileExplorerViewProps) => {
  const { listing, ensureListing, getListingForPath } = useFolderListing(selectedFolder, locations);
  const {
    selectedFiles,
    selectedEntries,
    selectedCount,
    lastClickedFile,
    focusedFile,
    selectFile,
    selectMultiple,
    selectRange,
    toggleFileSelection,
    removeSelection,
    clearSelections,
    clearLastClickedFile,
    focusFile,
    clearFocus,
  } = useFileSelection();
  const { isPreviewActive, togglePreview, updatePreview, closePreview } = useQuickLook();
  const { viewMode, setViewMode } = useExplorerViewState({ initialViewMode: "list" });
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const currentFolderName = selectedFolder ? getPathBaseName(selectedFolder) : "Select a folder";

  const handleFileSelection = useCallback(
    (row: FileRow, options?: { additive?: boolean }) => {
      if (options?.additive) {
        toggleFileSelection(row);
      } else {
        selectFile(row);
      }
      focusFile(row);
    },
    [selectFile, toggleFileSelection, focusFile],
  );

  // Sync Quick Preview with focused item
  useEffect(() => {
    if (isPreviewActive && focusedFile) {
      const timer = setTimeout(() => {
        updatePreview(focusedFile.file.path);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [focusedFile, isPreviewActive, updatePreview]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent | { key: string, preventDefault: () => void, metaKey?: boolean, ctrlKey?: boolean, shiftKey?: boolean }) => {
      // ESC key: close preview if active, otherwise clear selections and close sheet
      if (event.key === "Escape") {
        event.preventDefault();
        if (isPreviewActive) {
          closePreview();
        } else {
          clearSelections();
          clearFocus();
          setIsSelectionOpen(false);
        }
        return;
      }

      // Space key: toggle quick preview
      if (event.key === " " && focusedFile) {
        event.preventDefault();
        togglePreview(focusedFile.file.path);
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;

      // Cmd/Ctrl+Enter: Toggle selection of focused item
      if (isMod && event.key === "Enter") {
        event.preventDefault();
        if (focusedFile) {
          toggleFileSelection(focusedFile.file);
        }
        return;
      }

      // Navigation Logic
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(event.key)) {
        if (viewMode === "list") {
          const allRows = [
            ...listing.folders.map(folderToFileRow),
            ...listing.files
          ];

          if (allRows.length === 0) return;

          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            let nextIndex = -1;

            if (!focusedFile) {
              nextIndex = event.key === "ArrowUp" ? allRows.length - 1 : 0;
            } else {
              const currentIndex = allRows.findIndex(r => r.path === focusedFile.file.path);
              if (event.key === "ArrowUp") {
                nextIndex = Math.max(0, currentIndex - 1);
              } else {
                nextIndex = Math.min(allRows.length - 1, currentIndex + 1);
              }
            }

            if (nextIndex !== -1) {
              const nextRow = allRows[nextIndex];
              if (isShift && lastClickedFile) {
                selectRange(lastClickedFile.file, nextRow, allRows);
                focusFile(nextRow);
              } else {
                focusFile(nextRow);
              }
            }
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (focusedFile) {
              const isFolder = listing.folders.some(f => f.path === focusedFile.file.path);
              if (isFolder) {
                onSelectFolder(focusedFile.file.path);
              }
            }
          }
        } else if (viewMode === "column") {
          // Column View keyboard navigation
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            // Go up to parent folder
            if (selectedFolder) {
              const segments = selectedFolder.split("/").filter(Boolean);
              if (segments.length > 1) {
                const parentPath = "/" + segments.slice(0, -1).join("/");
                onSelectFolder(parentPath);
              }
            }
          } else if (event.key === "ArrowRight" || event.key === "Enter") {
            event.preventDefault();
            if (focusedFile) {
              const isFolder = listing.folders.some(f => f.path === focusedFile.file.path);
              if (isFolder) {
                onSelectFolder(focusedFile.file.path);
              }
            }
          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const currentListing = getListingForPath(selectedFolder || "");
            if (!currentListing) return;

            const allRows = [
              ...currentListing.folders.map(folderToFileRow),
              ...currentListing.files
            ];

            if (allRows.length === 0) return;

            let nextIndex = -1;
            if (!focusedFile || focusedFile.columnPath !== selectedFolder) {
              nextIndex = event.key === "ArrowUp" ? allRows.length - 1 : 0;
            } else {
              const currentIndex = allRows.findIndex(r => r.path === focusedFile.file.path);
              if (event.key === "ArrowUp") {
                nextIndex = Math.max(0, currentIndex - 1);
              } else {
                nextIndex = Math.min(allRows.length - 1, currentIndex + 1);
              }
            }

            if (nextIndex !== -1) {
              const nextRow = allRows[nextIndex];
              if (isShift && lastClickedFile && lastClickedFile.columnPath === selectedFolder) {
                selectRange(lastClickedFile.file, nextRow, allRows);
                focusFile(nextRow, selectedFolder || undefined);
              } else {
                focusFile(nextRow, selectedFolder || undefined);
              }
            }
          }
        }
        return;
      }

      // Cmd/Ctrl+A: select all files
      if (!isMod) return;
      if (event.key.toLowerCase() !== "a") return;

      if (listing.isLoading || listing.error || listing.files.length === 0) {
        return;
      }

      selectMultiple(listing.files, { additive: true });
    };

    const setupListeners = async () => {
      const unlisten = await listen<QuickLookEvent>("quicklook://navigate", (event) => {
        const { key: rawKey, metaKey, ctrlKey, shiftKey } = event.payload;
        const key = rawKey === "Space" ? " " : rawKey;
        handleKeyDown({
          key,
          preventDefault: () => { },
          metaKey,
          ctrlKey,
          shiftKey
        });
      });
      return unlisten;
    };

    const unlistenPromise = setupListeners();

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlistenPromise.then(fn => fn());
    };
  }, [listing, selectMultiple, clearSelections, clearFocus, focusedFile, viewMode, selectedFolder, onSelectFolder, focusFile, toggleFileSelection, selectRange, lastClickedFile, getListingForPath, isPreviewActive, togglePreview, closePreview]);

  useEffect(() => {
    if (viewMode === "column") return;

    clearLastClickedFile();
    clearFocus();
  }, [selectedFolder, viewMode, clearLastClickedFile, clearFocus]);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <LocationsSidebar
        locations={locations}
        locationsError={locationsError}
        selectedFolder={selectedFolder}
        onSelectFolder={onSelectFolder}
        renderCollections={renderCollections}
      />

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {!renderMainContent && (
          <BrowserToolbar
            currentFolderName={currentFolderName}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={onBack}
            onForward={onForward}
            viewMode={viewMode}
            onViewModeChange={(mode: ExplorerViewMode) => setViewMode(mode)}
            fileCount={listing.fileCount}
            folderCount={listing.folderCount}
            selectedCount={selectedCount}
            isSelectionOpen={isSelectionOpen}
            onToggleSelection={() => setIsSelectionOpen((prev) => !prev)}
          />
        )}

        <SelectionSheet
          isOpen={isSelectionOpen}
          entries={selectedEntries}
          onClose={() => setIsSelectionOpen(false)}
          onRemove={removeSelection}
          onClear={clearSelections}
          renderActions={selectionActions}
        />

        <div className="flex-1 overflow-auto">
          {renderMainContent ? (
            renderMainContent()
          ) : viewMode === "column" ? (
            <ColumnView
              locations={locations}
              selectedFolder={selectedFolder}
              selectedFiles={selectedFiles}
              lastClickedFile={lastClickedFile}
              focusedFile={focusedFile}
              getListingForPath={getListingForPath}
              onEnsureListing={ensureListing}
              onSelectFolder={onSelectFolder}
              onSelectFile={handleFileSelection}
              onSelectRange={selectRange}
              onFocusFile={focusFile}
              onToggleFileSelection={toggleFileSelection}
            />
          ) : (
            listing.isLoading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Loading files...</div>
            ) : listing.error ? (
              <div className="px-4 py-6 text-sm text-destructive">{listing.error}</div>
            ) : (
              <FileListView
                listing={listing}
                selectedFiles={selectedFiles}
                lastClickedFile={lastClickedFile}
                focusedFile={focusedFile}
                viewMode={viewMode}
                onSelectFolder={onSelectFolder}
                onSelectFile={handleFileSelection}
                onSelectRange={selectRange}
                onFocusFile={focusFile}
                onToggleFileSelection={toggleFileSelection}
              />
            )
          )}
        </div>

        {!renderMainContent && (
          <PathBar
            selectedFolder={selectedFolder}
            locations={locations}
            onSelectFolder={onSelectFolder}
          />
        )}
      </section>
    </div>
  );
};
