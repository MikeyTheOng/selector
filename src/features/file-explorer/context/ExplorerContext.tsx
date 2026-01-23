import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { useFolderListing } from "../hooks/use-folder-listing";
import { useExplorerSelection } from "@/hooks/explorer/use-explorer-selection";
import { useQuickLook } from "@/hooks/use-quick-look";
import { useExplorerViewState } from "@/hooks/explorer/use-explorer-view-state";
import type {
  LocationItem,
  FolderListing,
  ExplorerItem,
  ExplorerViewMode,
} from "@/types/explorer";

interface ExplorerContextType {
  // State
  listing: FolderListing;
  selectedPaths: Record<string, ExplorerItem>;
  selectedEntries: ExplorerItem[];
  selectedCount: number;
  lastClickedPath: string | null;
  focusedPath: string | null;
  isPreviewActive: boolean;
  viewMode: ExplorerViewMode;
  folderId: string | null;
  locations: LocationItem[];

  // Actions
  ensureListing: (path: string) => void;
  getListingForPath: (path: string) => FolderListing | undefined;
  selectItem: (item: ExplorerItem) => void;
  selectMultiple: (
    items: ExplorerItem[],
    options?: { additive?: boolean },
  ) => void;
  selectRange: (
    start: ExplorerItem,
    end: ExplorerItem,
    allItems: ExplorerItem[],
  ) => void;
  toggleSelection: (item: ExplorerItem) => void;
  removeSelection: (path: string) => void;
  clearSelections: () => void;
  updateLastClickedItem: (item: ExplorerItem) => void;
  clearLastClickedItem: () => void;
  focusItem: (item: ExplorerItem) => void;
  clearFocus: () => void;
  togglePreview: (path: string) => void;
  closePreview: () => void;
  setViewMode: (mode: ExplorerViewMode) => void;
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(
  undefined,
);

export const useExplorerContext = () => {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error(
      "useExplorerContext must be used within an ExplorerProvider",
    );
  }
  return context;
};

interface ExplorerProviderProps {
  children: ReactNode;
  folderId: string | null;
  locations: LocationItem[];
  focusItemPath?: string;
}

export const ExplorerProvider = ({
  children,
  folderId,
  locations,
  focusItemPath,
}: ExplorerProviderProps) => {
  const { listing, ensureListing, getListingForPath } = useFolderListing(
    folderId,
    locations,
  );
  const {
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
    updateLastClickedItem,
    clearLastClickedItem,
    focusItem,
    clearFocus,
  } = useExplorerSelection();
  const { isPreviewActive, togglePreview, closePreview } = useQuickLook({
    focusedPath,
  });
  const { viewMode, setViewMode } = useExplorerViewState({
    initialViewMode: "list",
  });
  useEffect(() => {
    if (viewMode === "column") return;
    clearLastClickedItem();
    clearFocus();
  }, [folderId, viewMode, clearLastClickedItem, clearFocus]);

  useEffect(() => {
    if (!focusItemPath || listing.isLoading || listing.error) return;
    // We need to convert the FileRow to an ExplorerItem to focus it
    // Or we find it in the listing which is composed of FileRow/FolderRow
    // listing.files contains FileRows. FileRow is compatible with ExplorerItem (as ExplorerFileItem if we add kind)
    // But listing.files elements might NOT have 'kind' property if they come from useFolderListing directly?
    // Let's check useFolderListing.

    // Assuming listing.files are FileRows.
    // If FileRow doesn't have 'kind', we can't pass it to focusItem (expects ExplorerItem).
    // We might need to cast or map.

    const fileToFocus = listing.files.find((f) => f.path === focusItemPath);
    if (fileToFocus) {
      // In Phase 1 we updated types, but did we update useFolderListing to return ExplorerItems?
      // No, useFolderListing returns FolderListing which has files: FileRow[].
      // And FileRow has been updated in types/explorer.ts?
      // Yes, FileRow = BaseExplorerItem & { ... }.
      // But it does NOT have `kind: 'file'`.
      // ExplorerFileItem = FileRow & { kind: 'file' }.

      // So we need to construct the ExplorerItem.
      focusItem({ ...fileToFocus, kind: "file" });
    }
  }, [
    focusItemPath,
    listing.isLoading,
    listing.error,
    listing.files,
    focusItem,
  ]);

  const value = useMemo(
    () => ({
      listing,
      selectedPaths,
      selectedEntries,
      selectedCount,
      lastClickedPath,
      focusedPath,
      isPreviewActive,
      viewMode,
      folderId,
      locations,
      ensureListing,
      getListingForPath,
      selectItem,
      selectMultiple,
      selectRange,
      toggleSelection,
      removeSelection,
      clearSelections,
      updateLastClickedItem,
      clearLastClickedItem,
      focusItem,
      clearFocus,
      togglePreview,
      closePreview,
      setViewMode,
    }),
    [
      listing,
      selectedPaths,
      selectedEntries,
      selectedCount,
      lastClickedPath,
      focusedPath,
      isPreviewActive,
      viewMode,
      folderId,
      locations,
      ensureListing,
      getListingForPath,
      selectItem,
      selectMultiple,
      selectRange,
      toggleSelection,
      removeSelection,
      clearSelections,
      updateLastClickedItem,
      clearLastClickedItem,
      focusItem,
      clearFocus,
      togglePreview,
      closePreview,
      setViewMode,
    ],
  );

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
};
