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
