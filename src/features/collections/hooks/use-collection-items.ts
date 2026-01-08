import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/path-utils";
import { fsModule } from "@/lib/tauri/fs";
import * as collectionsService from "../lib/collections-repository";
import type {
  CollectionItem,
  CollectionItemWithStatus,
  CollectionItemStatus,
  AddCollectionItemInput,
} from "../types";

/**
 * Detects the status of a single collection item
 * @internal
 */
async function detectItemStatus(
  item: CollectionItem
): Promise<CollectionItemStatus> {
  try {
    await fsModule.stat?.(item.path);
    return "available";
  } catch {
    // Path doesn't exist - check if it's on an external volume
    if (item.volume_id) {
      return "offline";
    }
    return "missing";
  }
}

/**
 * Detects the status of multiple collection items in parallel
 * @internal
 */
async function detectItemsStatus(
  items: CollectionItem[]
): Promise<CollectionItemWithStatus[]> {
  const statusPromises = items.map(async (item) => {
    const status = await detectItemStatus(item);
    return { ...item, status };
  });
  return Promise.all(statusPromises);
}

type CollectionItemsState = {
  items: CollectionItemWithStatus[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook for managing items within a specific collection
 * Provides operations to add/remove items and automatic loading
 *
 * @param collectionId - The ID of the collection to manage items for
 */
export const useCollectionItems = (collectionId: number) => {
  const [state, setState] = useState<CollectionItemsState>({
    items: [],
    isLoading: true,
    error: null,
  });

  const loadItems = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      if (!options.silent) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      }
      const items = await collectionsService.getCollectionItems(collectionId);
      // Detect status for each item
      const itemsWithStatus = await detectItemsStatus(items);
      setState({ items: itemsWithStatus, isLoading: false, error: null });
    } catch (error) {
      setState({
        items: [],
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  }, [collectionId]);

  // Load items on mount and when collection ID changes
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Auto-recovery: Re-check on window focus
  useEffect(() => {
    const onFocus = () => {
      loadItems({ silent: true });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadItems]);

  // Auto-recovery: Poll for missing/offline items
  useEffect(() => {
    const hasMissingOrOffline = state.items.some(
      (item) => item.status === "missing" || item.status === "offline"
    );

    if (!hasMissingOrOffline) return;

    // Poll every 5 seconds to check if volume is back or file is restored
    const interval = setInterval(() => {
      loadItems({ silent: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [state.items, loadItems]);

  const addItem = useCallback(
    async (input: AddCollectionItemInput): Promise<CollectionItem> => {
      const item = await collectionsService.addItemToCollection(input);
      await loadItems(); // Refresh the list
      return item;
    },
    [loadItems]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      try {
        await collectionsService.removeItemFromCollection(itemId);
        // Refresh items after removal
        loadItems();
      } catch (err) {
        console.error("Failed to remove item:", err);
        throw err;
      }
    },
    [loadItems]
  );

  const removeItemByPath = useCallback(
    async (path: string) => {
      const item = state.items.find((i) => i.path === path);
      if (!item) {
        throw new Error("Item not found in collection");
      }
      await removeItem(item.id);
    },
    [state.items, removeItem]
  );

  const relinkItem = useCallback(
    async (oldPath: string, newPath: string): Promise<number> => {
      const count = await collectionsService.updateItemPath(oldPath, newPath);
      await loadItems(); // Refresh the list
      return count;
    },
    [loadItems]
  );

  const relinkFolder = useCallback(
    async (oldFolderPath: string, newFolderPath: string): Promise<number> => {
      const count = await collectionsService.relinkFolderItems(
        oldFolderPath,
        newFolderPath
      );
      await loadItems(); // Refresh the list
      return count;
    },
    [loadItems]
  );

  return {
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    addItem,
    removeItem,
    removeItemByPath,
    refetch: loadItems,
    relinkItem,
    relinkFolder,
  };
};
