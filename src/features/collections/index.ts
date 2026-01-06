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
  relinkFolderItems,
} from "./lib/collections-repository";

// Hooks
export { useCollections } from "./hooks/use-collections";
export { useCollectionItems } from "./hooks/use-collection-items";

// Components
export { AddToCollectionWidget } from "./components/AddToCollectionWidget";
export { CollectionsSidebarSection } from "./components/CollectionsSidebarSection";
export { CollectionsView } from "./components/CollectionsView";
