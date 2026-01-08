/**
 * Navigation types for app-level routing
 */

/**
 * Route for the file explorer view
 */
export interface ExplorerRoute {
  type: "explorer";
  /** Folder ID to display, or null for root/volumes */
  folderId: string | null;
  /** Optional path of item to focus after navigation */
  focusItemPath?: string;
}

/**
 * Route for the collection view
 */
export interface CollectionRoute {
  type: "collection";
  /** Collection ID to display */
  collectionId: string;
}

/**
 * Union type representing all possible application routes
 */
export type AppRoute = ExplorerRoute | CollectionRoute;
