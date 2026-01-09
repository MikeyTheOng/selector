/**
 * Collections Repository
 * Infrastructure access for collections metadata.
 */

import { getDatabase } from "@/lib/tauri/database";
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from "../types";

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
