import { useCallback, useMemo, useRef } from "react";
import type { FileRow, LastClickedFile } from "@/types/fs";
import { useExplorerSelection } from "@/hooks/explorer/use-explorer-selection";
import { fileRowToExplorerItem } from "@/lib/explorer-utils";

export const useFileSelection = () => {
  const {
    selectedItems,
    selectedCount,
    lastClickedItem,
    focusedItem,
    selectItem,
    selectMultiple: genericSelectMultiple,
    selectRange: genericSelectRange,
    toggleSelection,
    removeSelection,
    clearSelections: genericClearSelections,
    updateLastClickedItem: genericUpdateLastClickedItem,
    clearLastClickedItem: clearLastClickedFile,
    focusItem: genericFocusItem,
    clearFocus,
  } = useExplorerSelection();

  // Keep a cache of original FileRow objects to maintain referential identity
  const fileRowCache = useRef<Record<string, FileRow>>({});

  // Sync cache with selectedItems and prune old entries
  const selectedFiles = useMemo(() => {
    const result: Record<string, FileRow> = {};
    Object.keys(selectedItems).forEach((id) => {
      if (fileRowCache.current[id]) {
        result[id] = fileRowCache.current[id];
      } else {
        // Fallback reconstruction if not in cache (should be rare if using selectFile)
        const item = selectedItems[id];
        result[id] = {
          path: item.path,
          name: item.name,
          extension: item.extension || "",
          kindLabel: item.kindLabel || (item.kind === "folder" ? "Folder" : "File"),
          size: item.size,
          sizeLabel: item.sizeLabel || "",
          dateModified: item.dateModified || null,
          dateModifiedLabel: item.dateModifiedLabel || "",
          status: item.status as FileRow["status"],
        };
      }
    });
    
    // Prune cache to only selected items + focused/last clicked to prevent memory leaks
    const newCache: Record<string, FileRow> = {};
    Object.keys(result).forEach(id => {
      newCache[id] = result[id];
    });
    if (lastClickedItem && fileRowCache.current[lastClickedItem.item.id]) {
      newCache[lastClickedItem.item.id] = fileRowCache.current[lastClickedItem.item.id];
    }
    if (focusedItem && fileRowCache.current[focusedItem.item.id]) {
      newCache[focusedItem.item.id] = fileRowCache.current[focusedItem.item.id];
    }
    fileRowCache.current = newCache;
    
    return result;
  }, [selectedItems, lastClickedItem, focusedItem]);

  const selectedEntries = useMemo(
    () => Object.values(selectedFiles).sort((a, b) => a.name.localeCompare(b.name)),
    [selectedFiles],
  );

  const lastClickedFile = useMemo(() => {
    if (!lastClickedItem) return null;
    return {
      file: fileRowCache.current[lastClickedItem.item.id] || {
        path: lastClickedItem.item.path,
        name: lastClickedItem.item.name,
        extension: lastClickedItem.item.extension || "",
        kindLabel: lastClickedItem.item.kindLabel || "",
        sizeLabel: lastClickedItem.item.sizeLabel || "",
        dateModified: lastClickedItem.item.dateModified || null,
        dateModifiedLabel: lastClickedItem.item.dateModifiedLabel || "",
      },
      columnPath: lastClickedItem.context,
    };
  }, [lastClickedItem]);

  const focusedFile = useMemo(() => {
    if (!focusedItem) return null;
    return {
      file: fileRowCache.current[focusedItem.item.id] || {
        path: focusedItem.item.path,
        name: focusedItem.item.name,
        extension: focusedItem.item.extension || "",
        kindLabel: focusedItem.item.kindLabel || "",
        sizeLabel: focusedItem.item.sizeLabel || "",
        dateModified: focusedItem.item.dateModified || null,
        dateModifiedLabel: focusedItem.item.dateModifiedLabel || "",
      },
      columnPath: focusedItem.context,
    };
  }, [focusedItem]);

  const selectFile = useCallback((row: FileRow, options?: { additive?: boolean }) => {
    fileRowCache.current[row.path] = row;
    selectItem(fileRowToExplorerItem(row), options);
  }, [selectItem]);

  const selectMultiple = useCallback((rows: FileRow[], options?: { additive?: boolean }) => {
    rows.forEach(row => {
      fileRowCache.current[row.path] = row;
    });
    genericSelectMultiple(rows.map(fileRowToExplorerItem), options);
  }, [genericSelectMultiple]);

  const toggleFileSelection = useCallback((row: FileRow) => {
    if (!selectedItems[row.path]) {
      fileRowCache.current[row.path] = row;
    }
    toggleSelection(fileRowToExplorerItem(row));
  }, [toggleSelection, selectedItems]);

  const selectRange = useCallback(
    (from: FileRow, to: FileRow, allFiles: FileRow[]) => {
      allFiles.forEach(row => {
        fileRowCache.current[row.path] = row;
      });
      genericSelectRange(
        fileRowToExplorerItem(from),
        fileRowToExplorerItem(to),
        allFiles.map(fileRowToExplorerItem)
      );
    },
    [genericSelectRange],
  );

  const clearSelections = useCallback(() => {
    fileRowCache.current = {};
    genericClearSelections();
  }, [genericClearSelections]);

  const updateLastClickedFile = useCallback((file: FileRow, columnPath?: string) => {
    fileRowCache.current[file.path] = file;
    genericUpdateLastClickedItem(fileRowToExplorerItem(file), columnPath);
  }, [genericUpdateLastClickedItem]);

  const focusFile = useCallback((file: FileRow, columnPath?: string) => {
    fileRowCache.current[file.path] = file;
    genericFocusItem(fileRowToExplorerItem(file), columnPath);
  }, [genericFocusItem]);

  return {
    selectedFiles,
    selectedEntries,
    selectedCount,
    lastClickedFile: lastClickedFile as LastClickedFile | null,
    focusedFile: focusedFile as LastClickedFile | null,
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
  };
};
