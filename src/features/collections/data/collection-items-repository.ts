/**
 * Collection Items Repository
 * Infrastructure access for collection items.
 */

import { getDatabase } from "@/lib/tauri/database";
import type { AddCollectionItemInput, CollectionItem } from "../types";

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
 * Gets a specific item from a collection by its path
 * @param collectionId - The collection ID
 * @param path - The item path
 * @returns The collection item or null if not found
 */
export async function getItemByPath(
  collectionId: number,
  path: string
): Promise<CollectionItem | null> {
  const db = await getDatabase();

  const items = await db.select<CollectionItem[]>(
    "SELECT * FROM collection_items WHERE collection_id = ? AND path = ?",
    [collectionId, path]
  );

  return items[0] ?? null;
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
