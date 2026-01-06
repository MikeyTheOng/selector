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
  } catch (error) {
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

  const loadItems = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
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

  const addItem = useCallback(
    async (input: AddCollectionItemInput): Promise<CollectionItem> => {
      const item = await collectionsService.addItemToCollection(input);
      await loadItems(); // Refresh the list
      return item;
    },
    [loadItems]
  );

  const removeItem = useCallback(
    async (itemId: number): Promise<void> => {
      await collectionsService.removeItemFromCollection(itemId);
      await loadItems(); // Refresh the list
    },
    [loadItems]
  );

  const refetch = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

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
    refetch,
    relinkItem,
    relinkFolder,
  };
};
