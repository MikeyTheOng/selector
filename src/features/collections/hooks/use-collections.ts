import { useCallback, useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
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

const COLLECTIONS_UPDATED_EVENT = "collections-updated";

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

  // Load collections on mount and listen for updates
  useEffect(() => {
    loadCollections();

    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listen(COLLECTIONS_UPDATED_EVENT, () => {
        loadCollections();
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [loadCollections]);

  const notifyUpdate = async () => {
    await emit(COLLECTIONS_UPDATED_EVENT);
  };

  const createCollection = useCallback(
    async (input: CreateCollectionInput): Promise<Collection> => {
      const collection = await collectionsService.createCollection(input);
      await notifyUpdate();
      return collection;
    },
    []
  );

  const updateCollection = useCallback(
    async (input: UpdateCollectionInput): Promise<Collection> => {
      const collection = await collectionsService.updateCollection(input);
      await notifyUpdate();
      return collection;
    },
    []
  );

  const deleteCollection = useCallback(
    async (id: number): Promise<void> => {
      await collectionsService.deleteCollection(id);
      await notifyUpdate();
    },
    []
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

