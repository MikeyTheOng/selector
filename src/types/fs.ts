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

export type FileRow = {
  path: string;
  name: string;
  extension: string;
  kindLabel: string;
  size?: number;
  sizeLabel: string;
  dateModified: Date | null;
  dateModifiedLabel: string;
};

export type FolderRow = {
  path: string;
  name: string;
  dateModified: Date | null;
  dateModifiedLabel: string;
};

export type FolderListing = {
  folders: FolderRow[];
  files: FileRow[];
  isLoading: boolean;
  error?: string;
  fileCount: number;
  folderCount: number;
  isTruncated: boolean;
};
