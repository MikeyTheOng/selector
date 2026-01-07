/**
 * Shared types for explorer-like interfaces (File Explorer, Collections, etc.)
 */

export type ExplorerItemKind = "file" | "folder";

export type ExplorerItemStatus = "available" | "missing" | "offline";

/**
 * Generic item that can be displayed in an Explorer view
 */
export interface ExplorerItem {
  /** Unique identifier for the item (e.g., file path or database ID) */
  id: string;
  /** The actual filesystem path or resource locator */
  path: string;
  /** Display name of the item */
  name: string;
  /** Whether it's a file or a folder */
  kind: ExplorerItemKind;
  /** Current availability status */
  status: ExplorerItemStatus;
  /** Optional date modified */
  dateModified?: Date | null;
  /** Formatted date modified string */
  dateModifiedLabel?: string;
  /** Optional file size in bytes */
  size?: number;
  /** Formatted size string (e.g., "1.2 MB") */
  sizeLabel?: string;
  /** Display label for the kind (e.g., "Folder", "PDF Document") */
  kindLabel?: string;
  /** File extension without the dot (e.g., "png", "txt") */
  extension?: string;
}

/**
 * View modes supported by explorer components
 */
export type ExplorerViewMode = "grid" | "list" | "column";

/**
 * Generic listing state for explorer views
 */
export interface ExplorerListing {
  /** All items in the current view */
  items: ExplorerItem[];
  /** Loading state */
  isLoading: boolean;
  /** Optional error message */
  error?: string | null;
  /** Total count of file items */
  fileCount: number;
  /** Total count of folder items */
  folderCount: number;
  /** Whether the results are truncated (e.g., due to performance limits) */
  isTruncated: boolean;
}

/**
 * Current selection state in an explorer view
 */
export interface ExplorerSelection {
  /** Map of selected item IDs to their item data */
  selectedIds: Record<string, ExplorerItem>;
  /** The item that was most recently clicked (used for range selection) */
  lastClickedId: string | null;
  /** The item that currently has focus (e.g., for keyboard navigation) */
  focusedId: string | null;
}
