import { useCallback, useEffect, type ComponentType } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExplorerToolbar } from "@/components/explorer/ExplorerToolbar";
import type { ExplorerSelectionPanelProps } from "@/components/explorer/ExplorerSelectionPanel";
import { useNavigation } from "@/hooks/use-navigation";
import { ColumnView } from "./ColumnView";
import { FileListView } from "./FileListView";
import { PathBar } from "./PathBar";
import { useExplorerContext } from "../context/ExplorerContext";
import { listen } from "@tauri-apps/api/event";
import type { LocationItem, ExplorerItem } from "@/types/explorer";
import { fileRowToExplorerItem, folderRowToExplorerItem } from "@/lib/explorer-utils";
import { getPathBaseName } from "@/lib/path-utils";
import { Button } from "@/components/ui/button";

interface QuickLookEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

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
    updatePreview,
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

  // Sync Quick Preview with focused item
  useEffect(() => {
    if (isPreviewActive && focusedPath) {
      const timer = setTimeout(() => {
        updatePreview(focusedPath);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [focusedPath, isPreviewActive, updatePreview]);

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

  useEffect(() => {
    const handleKeyDown = (
      event:
        | KeyboardEvent
        | {
            key: string;
            preventDefault: () => void;
            metaKey?: boolean;
            ctrlKey?: boolean;
            shiftKey?: boolean;
          },
    ) => {
      // ESC key
      if (event.key === "Escape") {
        event.preventDefault();
        if (isPreviewActive) {
          closePreview();
        } else {
          clearSelections();
          clearFocus();
        }
        return;
      }

      // Space key
      if (event.key === " " && focusedPath) {
        event.preventDefault();
        togglePreview(focusedPath);
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const currentItems = getCurrentViewItems();

      // Cmd/Ctrl+Enter: Toggle selection of focused item
      if (isMod && event.key === "Enter") {
        event.preventDefault();
        if (focusedPath) {
          const item = currentItems.find(i => i.path === focusedPath);
          if (item) {
            toggleSelection(item);
          }
        }
        return;
      }

      // Cmd/Ctrl+A: Select all items
      if (isMod && event.key.toLowerCase() === "a") {
        event.preventDefault();
        if (currentItems.length > 0) {
          selectMultiple(currentItems, { additive: true });
        }
        return;
      }

      // Navigation Logic
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(
          event.key,
        )
      ) {
        if (currentItems.length === 0 && viewMode === "list") return;

        if (viewMode === "list") {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            let nextIndex = -1;

            if (!focusedPath) {
              nextIndex = event.key === "ArrowUp" ? currentItems.length - 1 : 0;
            } else {
              const currentIndex = currentItems.findIndex(
                (i) => i.path === focusedPath,
              );
              if (event.key === "ArrowUp") {
                nextIndex = Math.max(0, currentIndex - 1);
              } else {
                nextIndex = Math.min(currentItems.length - 1, currentIndex + 1);
              }
            }

            if (nextIndex !== -1) {
              const nextItem = currentItems[nextIndex];
              if (isShift && lastClickedPath) {
                // Find anchor in current items
                const anchorItem = currentItems.find(i => i.path === lastClickedPath);
                if (anchorItem) {
                    selectRange(anchorItem, nextItem, currentItems);
                }
                focusItem(nextItem);
              } else {
                focusItem(nextItem);
              }
            }
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (focusedPath) {
              const item = currentItems.find(i => i.path === focusedPath);
              if (item && item.kind === "folder") {
                onSelectFolder(item.path);
              }
            }
          }
        } else if (viewMode === "column") {
          // Column View keyboard navigation
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            // Go up to parent folder
            if (folderId) {
              const segments = folderId.split("/").filter(Boolean);
              if (segments.length > 1) {
                const parentPath = "/" + segments.slice(0, -1).join("/");
                onSelectFolder(parentPath);
              } else if (segments.length === 1) {
                 // Volume root -> root
                 onSelectFolder("/");
              }
            }
          } else if (event.key === "ArrowRight" || event.key === "Enter") {
            event.preventDefault();
            if (focusedPath) {
              const item = currentItems.find(i => i.path === focusedPath);
              if (item && item.kind === "folder") {
                onSelectFolder(item.path);
              }
            }
          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            
            if (currentItems.length === 0) return;

            let nextIndex = -1;
            // Check if focused item is in current list (active column)
            // If focusedPath is set but not in currentItems, it means focus is in another column.
            // In that case, we should probably start from 0 or keep focus there?
            // Standard Finder behavior: up/down moves in active column.
            
            const currentIndex = focusedPath 
                ? currentItems.findIndex(i => i.path === focusedPath) 
                : -1;

            if (currentIndex === -1) {
              // Focus not in current column, start fresh
              nextIndex = event.key === "ArrowUp" ? currentItems.length - 1 : 0;
            } else {
              if (event.key === "ArrowUp") {
                nextIndex = Math.max(0, currentIndex - 1);
              } else {
                nextIndex = Math.min(currentItems.length - 1, currentIndex + 1);
              }
            }

            if (nextIndex !== -1) {
              const nextItem = currentItems[nextIndex];
              if (isShift && lastClickedPath) {
                 const anchorItem = currentItems.find(i => i.path === lastClickedPath);
                 if (anchorItem) {
                    selectRange(anchorItem, nextItem, currentItems);
                 }
                 focusItem(nextItem);
              } else {
                focusItem(nextItem);
              }
            }
          }
        }
        return;
      }
    };

    const setupListeners = async () => {
      const unlisten = await listen<QuickLookEvent>(
        "quicklook://navigate",
        (event) => {
          const { key: rawKey, metaKey, ctrlKey, shiftKey } = event.payload;
          const key = rawKey === "Space" ? " " : rawKey;
          handleKeyDown({
            key,
            preventDefault: () => {},
            metaKey,
            ctrlKey,
            shiftKey,
          });
        },
      );
      return unlisten;
    };

    const unlistenPromise = setupListeners();

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlistenPromise.then((fn) => fn());
    };
  }, [
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
  ]);

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