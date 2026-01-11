import { useState, useCallback, useMemo } from "react";
import type { ExplorerItem } from "@/types/explorer";

export interface ExplorerSelectionItem {
  item: ExplorerItem;
  /** Optional context (e.g., the folder path in a column view) */
  context?: string;
}

export const useExplorerSelection = () => {
  const [selectedItems, setSelectedItems] = useState<Record<string, ExplorerItem>>({});
  const [lastClickedItem, setLastClickedItem] = useState<ExplorerSelectionItem | null>(null);
  const [focusedItem, setFocusedItem] = useState<ExplorerSelectionItem | null>(null);

  const selectedEntries = useMemo(
    () => Object.values(selectedItems).sort((a, b) => a.name.localeCompare(b.name)),
    [selectedItems],
  );
  
  const selectedCount = selectedEntries.length;

  const selectItem = useCallback((item: ExplorerItem, options?: { additive?: boolean }) => {
    setSelectedItems((prev) => {
      if (options?.additive) {
        if (prev[item.id]) {
          return prev;
        }
        return { ...prev, [item.id]: item };
      }
      return { [item.id]: item };
    });
  }, []);

  const selectMultiple = useCallback((items: ExplorerItem[], options?: { additive?: boolean }) => {
    setSelectedItems((prev) => {
      if (options?.additive) {
        const next = { ...prev };
        items.forEach((item) => {
          next[item.id] = item;
        });
        return next;
      }
      return Object.fromEntries(items.map((item) => [item.id, item] as const));
    });
  }, []);

  const toggleSelection = useCallback((item: ExplorerItem) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  }, []);

  const removeSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedItems({});
    setLastClickedItem(null);
  }, []);

  const selectRange = useCallback(
    (from: ExplorerItem, to: ExplorerItem, allItems: ExplorerItem[]) => {
      const fromIndex = allItems.findIndex((i) => i.id === from.id);
      const toIndex = allItems.findIndex((i) => i.id === to.id);
      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangeItems = allItems.slice(start, end + 1);

      setSelectedItems((prev) => {
        const next = { ...prev };
        rangeItems.forEach((item) => {
          next[item.id] = item;
        });
        return next;
      });
    },
    [],
  );

  const updateLastClickedItem = useCallback((item: ExplorerItem, context?: string) => {
    setLastClickedItem({ item, context });
  }, []);

  const clearLastClickedItem = useCallback(() => {
    setLastClickedItem(null);
  }, []);

  const focusItem = useCallback((item: ExplorerItem, context?: string) => {
    const selectionItem = { item, context };
    setFocusedItem(selectionItem);
    setLastClickedItem(selectionItem);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedItem(null);
  }, []);

  return {
    selectedItems,
    selectedEntries,
    selectedCount,
    lastClickedItem,
    focusedItem,
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
  };
};