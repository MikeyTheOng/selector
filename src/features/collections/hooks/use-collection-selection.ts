import { useCallback, useRef } from "react";
import { useExplorerSelection } from "@/hooks/explorer/useExplorerSelection";
import { getPathBaseName } from "@/lib/path-utils";
import { formatDateTime } from "@/lib/formatters";
import type { ExplorerItem } from "@/types/explorer";
import type { CollectionItemWithStatus } from "../types";

/**
 * Converts a CollectionItem to an ExplorerItem
 */
export function collectionItemToExplorerItem(item: CollectionItemWithStatus): ExplorerItem {
  const name = getPathBaseName(item.path);
  return {
    id: item.path, // Using path as ID for consistency with file-explorer logic
    path: item.path,
    name: name,
    kind: item.item_type,
    status: item.status,
    dateModified: new Date(item.added_at),
    dateModifiedLabel: formatDateTime(new Date(item.added_at)),
    kindLabel: item.item_type === "folder" ? "Folder" : "File",
    extension: item.item_type === "file" ? name.split(".").pop() || "" : undefined,
  };
}

export const useCollectionSelection = () => {
  const selection = useExplorerSelection();
  const { selectItem, selectMultiple, toggleSelection } = selection;

  // Cache original items to maintain referential identity
  const itemCache = useRef<Record<string, CollectionItemWithStatus>>({});

  const selectCollectionItem = useCallback((item: CollectionItemWithStatus, options?: { additive?: boolean }) => {
    itemCache.current[item.path] = item;
    selectItem(collectionItemToExplorerItem(item), options);
  }, [selectItem]);

  const selectMultipleCollectionItems = useCallback((items: CollectionItemWithStatus[], options?: { additive?: boolean }) => {
    items.forEach(i => {
      itemCache.current[i.path] = i;
    });
    selectMultiple(items.map(collectionItemToExplorerItem), options);
  }, [selectMultiple]);

  const toggleCollectionItemSelection = useCallback((item: CollectionItemWithStatus) => {
    if (!selection.selectedItems[item.path]) {
      itemCache.current[item.path] = item;
    }
    toggleSelection(collectionItemToExplorerItem(item));
  }, [toggleSelection, selection.selectedItems]);

  return {
    ...selection,
    selectCollectionItem,
    selectMultipleCollectionItems,
    toggleCollectionItemSelection,
    // Add helpers to get back original items from cache if needed
    getCachedItem: (path: string) => itemCache.current[path],
  };
};
