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
  addItemsToCollection,
  removeItemFromCollection,
  getCollectionItems,
  relinkItem,
  updateItemPath,
  relinkFolderItems,
} from "./lib/collections-service";

// Hooks
export { useCollections } from "./hooks/use-collections";
export { useCollectionItems } from "./hooks/use-collection-items";

// Components
export { CollectionsSidebarSection } from "./components/CollectionsSidebarSection";
export { CollectionsView } from "./components/CollectionsView";
export { CollectionsPage } from "./components/CollectionsPage";
export { AddToCollectionDialog } from "./components/AddToCollectionDialog";
