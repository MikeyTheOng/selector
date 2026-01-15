import { useState, useCallback, useMemo } from "react";
import type { ExplorerItem } from "@/types/explorer";

const isIgnoredEntry = (item: ExplorerItem) => item.name.toLowerCase() === ".ds_store";

export const useExplorerSelection = () => {
  const [selectedPaths, setSelectedPaths] = useState<Record<string, ExplorerItem>>({});
  const [lastClickedPath, setLastClickedPath] = useState<string | null>(null);
  const [focusedPath, setFocusedPath] = useState<string | null>(null);

  const selectedEntries = useMemo(
    () =>
      Object.values(selectedPaths)
        .filter((item) => !isIgnoredEntry(item))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [selectedPaths],
  );

  const selectedCount = selectedEntries.length;

  const selectItem = useCallback((item: ExplorerItem, options?: { additive?: boolean }) => {
    if (isIgnoredEntry(item)) {
      return;
    }
    setSelectedPaths((prev) => {
      if (options?.additive) {
        if (prev[item.path]) {
          return prev;
        }
        return { ...prev, [item.path]: item };
      }
      return { [item.path]: item };
    });
  }, []);

  const selectMultiple = useCallback((items: ExplorerItem[], options?: { additive?: boolean }) => {
    const filteredItems = items.filter((item) => !isIgnoredEntry(item));
    if (filteredItems.length === 0) {
      return;
    }
    setSelectedPaths((prev) => {
      if (options?.additive) {
        const next = { ...prev };
        filteredItems.forEach((item) => {
          next[item.path] = item;
        });
        return next;
      }
      return Object.fromEntries(filteredItems.map((item) => [item.path, item] as const));
    });
  }, []);

  const toggleSelection = useCallback((item: ExplorerItem) => {
    if (isIgnoredEntry(item)) {
      return;
    }
    setSelectedPaths((prev) => {
      const next = { ...prev };
      if (next[item.path]) {
        delete next[item.path];
      } else {
        next[item.path] = item;
      }
      return next;
    });
  }, []);

  const removeSelection = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      if (!prev[path]) {
        return prev;
      }
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedPaths({});
    setLastClickedPath(null);
  }, []);

  const selectRange = useCallback(
    (from: ExplorerItem, to: ExplorerItem, allItems: ExplorerItem[]) => {
      const fromIndex = allItems.findIndex((i) => i.path === from.path);
      const toIndex = allItems.findIndex((i) => i.path === to.path);
      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangeItems = allItems.slice(start, end + 1).filter((item) => !isIgnoredEntry(item));
      if (rangeItems.length === 0) {
        return;
      }

      setSelectedPaths((prev) => {
        const next = { ...prev };
        rangeItems.forEach((item) => {
          next[item.path] = item;
        });
        return next;
      });
    },
    [],
  );

  const updateLastClickedItem = useCallback((item: ExplorerItem) => {
    setLastClickedPath(item.path);
  }, []);

  const clearLastClickedItem = useCallback(() => {
    setLastClickedPath(null);
  }, []);

  const focusItem = useCallback((item: ExplorerItem) => {
    setFocusedPath(item.path);
    setLastClickedPath(item.path);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedPath(null);
  }, []);

  return {
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
  };
};
