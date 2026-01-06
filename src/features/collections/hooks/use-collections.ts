import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/path-utils";
import * as collectionsService from "../lib/collections-repository";
import type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "../types";

type CollectionsState = {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook for managing collections
 * Provides CRUD operations and automatic loading of collections
 */
export const useCollections = () => {
  const [state, setState] = useState<CollectionsState>({
    collections: [],
    isLoading: true,
    error: null,
  });

  const loadCollections = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const collections = await collectionsService.getCollections();
      setState({ collections, isLoading: false, error: null });
    } catch (error) {
      setState({
        collections: [],
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  }, []);

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const createCollection = useCallback(
    async (input: CreateCollectionInput): Promise<Collection> => {
      const collection = await collectionsService.createCollection(input);
      await loadCollections(); // Refresh the list
      return collection;
    },
    [loadCollections]
  );

  const updateCollection = useCallback(
    async (input: UpdateCollectionInput): Promise<Collection> => {
      const collection = await collectionsService.updateCollection(input);
      await loadCollections(); // Refresh the list
      return collection;
    },
    [loadCollections]
  );

  const deleteCollection = useCallback(
    async (id: number): Promise<void> => {
      await collectionsService.deleteCollection(id);
      await loadCollections(); // Refresh the list
    },
    [loadCollections]
  );

  const refetch = useCallback(async () => {
    await loadCollections();
  }, [loadCollections]);

  return {
    collections: state.collections,
    isLoading: state.isLoading,
    error: state.error,
    createCollection,
    updateCollection,
    deleteCollection,
    refetch,
  };
};
