import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useFolderListing } from "../hooks/use-folder-listing";
import { useFileSelection } from "../hooks/use-file-selection";
import { useQuickLook } from "../hooks/use-quick-look";
import { useExplorerViewState } from "@/hooks/explorer/use-explorer-view-state";
import type { LocationItem, FolderListing, FileRow } from "@/types/fs";
import type { ExplorerViewMode } from "@/types/explorer";

interface ExplorerContextType {
  // State
  listing: FolderListing;
  selectedFiles: Record<string, FileRow>;
  selectedEntries: FileRow[];
  selectedCount: number;
  lastClickedFile: { file: FileRow; columnPath?: string } | null;
  focusedFile: { file: FileRow; columnPath?: string } | null;
  isPreviewActive: boolean;
  viewMode: ExplorerViewMode;
  folderId: string | null;
  locations: LocationItem[];

  // Actions
  ensureListing: (path: string) => void;
  getListingForPath: (path: string) => FolderListing | undefined;
  selectFile: (row: FileRow) => void;
  selectMultiple: (rows: FileRow[], options?: { additive?: boolean }) => void;
  selectRange: (start: FileRow, end: FileRow, allRows: FileRow[]) => void;
  toggleFileSelection: (row: FileRow) => void;
  removeSelection: (path: string) => void;
  clearSelections: () => void;
  updateLastClickedFile: (file: FileRow, columnPath?: string) => void;
  clearLastClickedFile: () => void;
  focusFile: (row: FileRow, columnPath?: string) => void;
  clearFocus: () => void;
  togglePreview: (path: string) => void;
  updatePreview: (path: string) => void;
  closePreview: () => void;
  setViewMode: (mode: ExplorerViewMode) => void;
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(undefined);

export const useExplorerContext = () => {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error("useExplorerContext must be used within an ExplorerProvider");
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
  const { listing, ensureListing, getListingForPath } = useFolderListing(folderId, locations);
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
    updateLastClickedFile,
    clearLastClickedFile,
    focusFile,
    clearFocus,
  } = useFileSelection();
  const { isPreviewActive, togglePreview, updatePreview, closePreview } = useQuickLook();
  const { viewMode, setViewMode } = useExplorerViewState({ initialViewMode: "list" });
  useEffect(() => {
    if (viewMode === "column") return;
    clearLastClickedFile();
    clearFocus();
  }, [folderId, viewMode, clearLastClickedFile, clearFocus]);

  useEffect(() => {
    if (!focusItemPath || listing.isLoading || listing.error) return;
    const fileToFocus = listing.files.find(f => f.path === focusItemPath);
    if (fileToFocus) {
      focusFile(fileToFocus);
    }
  }, [focusItemPath, listing.isLoading, listing.error, listing.files, focusFile]);

  const value = useMemo(
    () => ({
      listing,
      selectedFiles,
      selectedEntries,
      selectedCount,
      lastClickedFile,
      focusedFile,
      isPreviewActive,
      viewMode,
      folderId,
      locations,
      ensureListing,
      getListingForPath,
      selectFile,
      selectMultiple,
      selectRange,
      toggleFileSelection,
      removeSelection,
      clearSelections,
      updateLastClickedFile,
      clearLastClickedFile,
      focusFile,
      clearFocus,
      togglePreview,
      updatePreview,
      closePreview,
      setViewMode,
    }),
    [
      listing,
      selectedFiles,
      selectedEntries,
      selectedCount,
      lastClickedFile,
      focusedFile,
      isPreviewActive,
      viewMode,
      folderId,
      locations,
      ensureListing,
      getListingForPath,
      selectFile,
      selectMultiple,
      selectRange,
      toggleFileSelection,
      removeSelection,
      clearSelections,
      updateLastClickedFile,
      clearLastClickedFile,
      focusFile,
      clearFocus,
      togglePreview,
      updatePreview,
      closePreview,
      setViewMode,
    ],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
};
