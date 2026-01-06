/**
 * Collections Service
 * Provides CRUD operations for collections and collection items
 */

import { getDatabase } from "@/lib/tauri/database";
import type {
  Collection,
  CollectionItem,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddCollectionItemInput,
} from "../types";

/**
 * Creates a new collection
 * @param input - The collection name
 * @returns The created collection
 * @throws Error if name is empty
 */
export async function createCollection(
  input: CreateCollectionInput
): Promise<Collection> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Collection name cannot be empty");
  }

  const db = await getDatabase();

  await db.execute("INSERT INTO collections (name) VALUES (?)", [name]);

  // Get the created collection
  const collections = await db.select<Collection[]>(
    "SELECT * FROM collections WHERE name = ? ORDER BY id DESC LIMIT 1",
    [name]
  );

  return collections[0];
}

/**
 * Gets all collections ordered by creation date (newest first)
 * @returns Array of all collections
 */
export async function getCollections(): Promise<Collection[]> {
  const db = await getDatabase();

  const collections = await db.select<Collection[]>(
    "SELECT * FROM collections ORDER BY created_at DESC"
  );

  return collections;
}

/**
 * Gets a collection by its ID
 * @param id - The collection ID
 * @returns The collection or null if not found
 */
export async function getCollectionById(id: number): Promise<Collection | null> {
  const db = await getDatabase();

  const collections = await db.select<Collection[]>(
    "SELECT * FROM collections WHERE id = ?",
    [id]
  );

  return collections[0] ?? null;
}

/**
 * Updates a collection's name
 * @param input - The collection ID and new name
 * @returns The updated collection
 * @throws Error if name is empty
 */
export async function updateCollection(
  input: UpdateCollectionInput
): Promise<Collection> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Collection name cannot be empty");
  }

  const db = await getDatabase();

  await db.execute(
    "UPDATE collections SET name = ?, updated_at = datetime('now') WHERE id = ?",
    [name, input.id]
  );

  // Get the updated collection
  const collections = await db.select<Collection[]>(
    "SELECT * FROM collections WHERE id = ?",
    [input.id]
  );

  return collections[0];
}

/**
 * Deletes a collection by its ID
 * Note: This will also delete all items in the collection due to CASCADE
 * @param id - The collection ID
 */
export async function deleteCollection(id: number): Promise<void> {
  const db = await getDatabase();

  await db.execute("DELETE FROM collections WHERE id = ?", [id]);
}

/**
 * Adds an item (file or folder) to a collection
 * @param input - The item details
 * @returns The created collection item
 */
export async function addItemToCollection(
  input: AddCollectionItemInput
): Promise<CollectionItem> {
  const db = await getDatabase();

  await db.execute(
    `INSERT INTO collection_items (collection_id, path, item_type, volume_id)
     VALUES (?, ?, ?, ?)`,
    [input.collection_id, input.path, input.item_type, input.volume_id ?? null]
  );

  // Get the created item
  const items = await db.select<CollectionItem[]>(
    `SELECT * FROM collection_items
     WHERE collection_id = ? AND path = ?
     ORDER BY id DESC LIMIT 1`,
    [input.collection_id, input.path]
  );

  return items[0];
}

/**
 * Removes an item from a collection
 * @param itemId - The collection item ID
 */
export async function removeItemFromCollection(itemId: number): Promise<void> {
  const db = await getDatabase();

  await db.execute("DELETE FROM collection_items WHERE id = ?", [itemId]);
}

/**
 * Gets all items in a collection
 * @param collectionId - The collection ID
 * @returns Array of collection items
 */
export async function getCollectionItems(
  collectionId: number
): Promise<CollectionItem[]> {
  const db = await getDatabase();

  const items = await db.select<CollectionItem[]>(
    "SELECT * FROM collection_items WHERE collection_id = ? ORDER BY added_at DESC",
    [collectionId]
  );

  return items;
}

/**
 * Updates the path of an item across ALL collections
 * This is used for relinking when a file/folder is moved
 * @param oldPath - The current/old path
 * @param newPath - The new path
 * @returns Number of items updated
 */
export async function updateItemPath(
  oldPath: string,
  newPath: string
): Promise<number> {
  const db = await getDatabase();

  const result = await db.execute(
    "UPDATE collection_items SET path = ? WHERE path = ?",
    [newPath, oldPath]
  );

  return result.rowsAffected;
}

/**
 * Relinks all items within a folder to a new location
 * This is used when a parent folder is moved, updating all contained files/folders
 * @param oldFolderPath - The old folder path
 * @param newFolderPath - The new folder path
 * @returns Number of items updated
 */
export async function relinkFolderItems(
  oldFolderPath: string,
  newFolderPath: string
): Promise<number> {
  const db = await getDatabase();

  // Normalize paths (remove trailing slashes)
  const normalizedOldPath = oldFolderPath.replace(/\/+$/, "");
  const normalizedNewPath = newFolderPath.replace(/\/+$/, "");

  // Find all items that start with the old folder path
  const items = await db.select<CollectionItem[]>(
    "SELECT * FROM collection_items WHERE path LIKE ?",
    [`${normalizedOldPath}%`]
  );

  if (items.length === 0) {
    return 0;
  }

  // Update each item's path
  let updatedCount = 0;
  for (const item of items) {
    const newPath = item.path.replace(normalizedOldPath, normalizedNewPath);
    await db.execute("UPDATE collection_items SET path = ? WHERE id = ?", [
      newPath,
      item.id,
    ]);
    updatedCount++;
  }

  return updatedCount;
}
