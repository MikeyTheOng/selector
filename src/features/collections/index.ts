// Collections Feature
// Virtual file/folder organization without modifying the filesystem

// Types
export type {
  Collection,
  CollectionItem,
  CollectionItemType,
  CollectionItemStatus,
  CollectionItemWithStatus,
  CreateCollectionInput,
  UpdateCollectionInput,
  AddCollectionItemInput,
} from "./types";

// Service functions
export {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
  getCollectionItems,
  updateItemPath,
} from "./lib/collections-service";
