/**
 * Collections Service
 * Stateless domain logic for collections and collection items.
 */

import { DuplicateItemError } from "../errors";
import type {
  AddCollectionItemInput,
  Collection,
  CollectionItem,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "../types";
import * as collectionsRepository from "../data/collections-repository";
import * as collectionItemsRepository from "../data/collection-items-repository";

type AddItemPayload = Omit<AddCollectionItemInput, "collection_id">;

export type AddItemsResult = {
  added: CollectionItem[];
  errors: Array<{ input: AddItemPayload; error: Error }>;
};

export async function createCollection(
  input: CreateCollectionInput
): Promise<Collection> {
  return collectionsRepository.createCollection(input);
}

export async function getCollections(): Promise<Collection[]> {
  return collectionsRepository.getCollections();
}

export async function getCollectionById(
  id: number
): Promise<Collection | null> {
  return collectionsRepository.getCollectionById(id);
}

export async function updateCollection(
  input: UpdateCollectionInput
): Promise<Collection> {
  return collectionsRepository.updateCollection(input);
}

export async function deleteCollection(id: number): Promise<void> {
  return collectionsRepository.deleteCollection(id);
}

export async function getCollectionItems(
  collectionId: number
): Promise<CollectionItem[]> {
  return collectionItemsRepository.getCollectionItems(collectionId);
}

export async function getItemByPath(
  collectionId: number,
  path: string
): Promise<CollectionItem | null> {
  return collectionItemsRepository.getItemByPath(collectionId, path);
}

async function assertItemNotDuplicate(
  collectionId: number,
  path: string
): Promise<void> {
  const existing = await collectionItemsRepository.getItemByPath(
    collectionId,
    path
  );

  if (!existing) return;

  const collection = await collectionsRepository.getCollectionById(
    collectionId
  );
  throw new DuplicateItemError(collection?.name);
}

export async function addItemToCollection(
  input: AddCollectionItemInput
): Promise<CollectionItem> {
  await assertItemNotDuplicate(input.collection_id, input.path);
  return collectionItemsRepository.addItemToCollection(input);
}

export async function addItemsToCollection(
  targetCollectionId: number,
  inputs: AddItemPayload[]
): Promise<AddItemsResult> {
  const added: CollectionItem[] = [];
  const errors: AddItemsResult["errors"] = [];

  for (const input of inputs) {
    try {
      const item = await addItemToCollection({
        ...input,
        collection_id: targetCollectionId,
      });
      added.push(item);
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Failed to add item.");
      errors.push({ input, error: normalizedError });
    }
  }

  return { added, errors };
}

export async function removeItemFromCollection(itemId: number): Promise<void> {
  return collectionItemsRepository.removeItemFromCollection(itemId);
}

export async function relinkItem(
  collectionId: number,
  oldPath: string,
  newPath: string
): Promise<number> {
  await assertItemNotDuplicate(collectionId, newPath);
  return collectionItemsRepository.updateItemPath(oldPath, newPath);
}

export async function updateItemPath(
  oldPath: string,
  newPath: string
): Promise<number> {
  return collectionItemsRepository.updateItemPath(oldPath, newPath);
}

export async function relinkFolderItems(
  oldFolderPath: string,
  newFolderPath: string
): Promise<number> {
  return collectionItemsRepository.relinkFolderItems(
    oldFolderPath,
    newFolderPath
  );
}
