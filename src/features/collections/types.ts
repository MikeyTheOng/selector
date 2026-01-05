/**
 * Types for the Collections feature
 * Collections allow users to organize files/folders into virtual groups
 * without modifying the underlying filesystem.
 */

/**
 * Represents a collection in the database
 */
export interface Collection {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new collection
 */
export interface CreateCollectionInput {
  name: string;
}

/**
 * Input for updating a collection
 */
export interface UpdateCollectionInput {
  id: number;
  name: string;
}

/**
 * Type of item that can be added to a collection
 */
export type CollectionItemType = "file" | "folder";

/**
 * Status of an item in a collection
 */
export type CollectionItemStatus = "available" | "missing" | "offline";

/**
 * Represents an item within a collection
 */
export interface CollectionItem {
  id: number;
  collection_id: number;
  path: string;
  item_type: CollectionItemType;
  volume_id: string | null;
  added_at: string;
}

/**
 * Extended collection item with computed status
 */
export interface CollectionItemWithStatus extends CollectionItem {
  status: CollectionItemStatus;
}

/**
 * Input for adding an item to a collection
 */
export interface AddCollectionItemInput {
  collection_id: number;
  path: string;
  item_type: CollectionItemType;
  volume_id?: string | null;
}
