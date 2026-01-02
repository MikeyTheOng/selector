import * as fs from "@tauri-apps/plugin-fs";

type FsDirEntry = {
  name?: string | null;
  path: string;
  isDirectory?: boolean;
  isFile?: boolean;
};

type FsMetadata = {
  size?: number;
};

type FsModule = {
  readDir: (path: string, options?: { recursive?: boolean }) => Promise<FsDirEntry[]>;
  metadata?: (path: string) => Promise<FsMetadata>;
  stat?: (path: string) => Promise<FsMetadata>;
};

type LocationItem = {
  path: string;
  name: string;
  kind: "home" | "volume";
};

type FileRow = {
  path: string;
  name: string;
  extension: string;
  size?: number;
  sizeLabel: string;
};

type FolderRow = {
  path: string;
  name: string;
};

type FolderListing = {
  folders: FolderRow[];
  files: FileRow[];
  isLoading: boolean;
  error?: string;
  fileCount: number;
  folderCount: number;
  isTruncated: boolean;
};

const fsModule = fs as unknown as FsModule;

const formatSize = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"] as const;
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const getExtension = (name: string) => {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === name.length - 1) {
    return "";
  }
  return name.slice(lastDot + 1).toLowerCase();
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong while reading this folder.";
};

const getPathBaseName = (path: string) => path.split("/").filter(Boolean).pop() ?? path;

const getEntryName = (entry: FsDirEntry) => {
  if (entry.name) {
    return entry.name;
  }
  if (entry.path) {
    return getPathBaseName(entry.path);
  }
  return "";
};

const getEntryPath = (entry: FsDirEntry, parentPath: string) => {
  if (entry.path) {
    return entry.path;
  }
  if (entry.name) {
    const base = parentPath.endsWith("/") ? parentPath.slice(0, -1) : parentPath;
    return base ? `${base}/${entry.name}` : `/${entry.name}`;
  }
  return "";
};

const resolveEntry = (entry: FsDirEntry, parentPath: string) => {
  const name = getEntryName(entry);
  const path = getEntryPath(entry, parentPath);
  if (!name || !path) {
    return null;
  }
  return { name, path };
};

const isHiddenName = (name: string) => name.startsWith(".");

export type { FileRow, FolderListing, FolderRow, FsDirEntry, FsMetadata, FsModule, LocationItem };
export {
  formatSize,
  fsModule,
  getErrorMessage,
  getExtension,
  getPathBaseName,
  isHiddenName,
  resolveEntry,
};
