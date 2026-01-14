/**
 * Shared types for explorer-like interfaces (File Explorer, Collections, etc.)
 */

export type ExplorerItemKind = "file" | "folder";

export type ExplorerItemStatus = "available" | "missing" | "offline";

export type FsDirEntry = {
  name?: string | null;
  path: string;
  isDirectory?: boolean;
  isFile?: boolean;
};

export type FsMetadata = {
  size?: number;
  mtime?: Date | null;
};

export type FsModule = {
  readDir: (path: string, options?: { recursive?: boolean }) => Promise<FsDirEntry[]>;
  metadata?: (path: string) => Promise<FsMetadata>;
  stat?: (path: string) => Promise<FsMetadata>;
};

export type LocationItem = {
  path: string;
  name: string;
  kind: "home" | "volume";
};

export interface BaseExplorerItem {
  path: string;
  name: string;
  status: ExplorerItemStatus;
  dateModified: Date | null;
  dateModifiedLabel: string;
  kindLabel: string;
}

export type FileRow = BaseExplorerItem & {
  extension: string;
  size?: number;
  sizeLabel: string;
};

export type FolderRow = BaseExplorerItem;

export type FolderListing = {
  folders: FolderRow[];
  files: FileRow[];
  isLoading: boolean;
  error?: string;
  fileCount: number;
  folderCount: number;
  isTruncated: boolean;
};

export type ExplorerFileItem = FileRow & { kind: 'file' };
export type ExplorerFolderItem = FolderRow & { kind: 'folder' };

export type ExplorerItem = ExplorerFileItem | ExplorerFolderItem;

export type ExplorerViewMode = "grid" | "list" | "column";

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
  /** Map of selected item paths to their item data */
  selectedPaths: Record<string, ExplorerItem>;
  /** The item path that was most recently clicked (used for range selection) */
  lastClickedPath?: string | null;
  /** The item path that currently has focus (e.g., for keyboard navigation) */
  focusedPath?: string | null;
}