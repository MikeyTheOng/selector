import * as fs from "@tauri-apps/plugin-fs";

type FsDirEntry = {
  name?: string | null;
  path: string;
  isDirectory?: boolean;
  isFile?: boolean;
};

type FsMetadata = {
  size?: number;
  mtime?: Date | null;
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
  kindLabel: string;
  size?: number;
  sizeLabel: string;
  dateModified: Date | null;
  dateModifiedLabel: string;
};

type FolderRow = {
  path: string;
  name: string;
  dateModified: Date | null;
  dateModifiedLabel: string;
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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const formatDateTime = (value?: Date | null) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "-";
  }
  return `${dateFormatter.format(value)} at ${timeFormatter.format(value)}`;
};

const getExtension = (name: string) => {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === name.length - 1) {
    return "";
  }
  return name.slice(lastDot + 1).toLowerCase();
};

const kindLabels: Record<string, string> = {
  pdf: "PDF document",
  json: "JSON",
  zip: "ZIP archive",
  jpg: "JPEG image",
  jpeg: "JPEG image",
  png: "PNG image",
  gif: "GIF image",
  heic: "HEIC image",
  heif: "HEIF image",
  tif: "TIFF image",
  tiff: "TIFF image",
  bmp: "BMP image",
  webp: "WEBP image",
  mp3: "MP3 audio",
  wav: "WAV audio",
  flac: "FLAC audio",
  m4a: "M4A audio",
  mp4: "MPEG-4 movie",
  mov: "QuickTime movie",
  avi: "AVI movie",
  mkv: "MKV movie",
  txt: "Text document",
  csv: "CSV document",
  md: "Markdown document",
  html: "HTML document",
  js: "JavaScript file",
  ts: "TypeScript file",
  tsx: "TypeScript React file",
  jsx: "JavaScript React file",
};

const getKindLabel = (extension: string) => {
  if (!extension) {
    return "File";
  }
  return kindLabels[extension] ?? extension.toUpperCase();
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

const getPathHierarchy = (path: string, locations: LocationItem[]): string[] => {
  const sortedLocations = [...locations]
    .filter(
      (loc) =>
        path === loc.path ||
        path.startsWith(loc.path.endsWith("/") ? loc.path : `${loc.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length);

  const rootPath = sortedLocations[0]?.path ?? path;

  if (path === rootPath) {
    return [rootPath];
  }

  const relative = path.slice(rootPath.length);
  const segments = relative.split("/").filter(Boolean);
  const paths = [rootPath];
  let currentPath = rootPath;

  for (const segment of segments) {
    currentPath = currentPath.endsWith("/")
      ? `${currentPath}${segment}`
      : `${currentPath}/${segment}`;
    paths.push(currentPath);
  }

  return paths;
};

export type { FileRow, FolderListing, FolderRow, FsDirEntry, FsMetadata, FsModule, LocationItem };
export {
  formatSize,
  formatDateTime,
  fsModule,
  getErrorMessage,
  getExtension,
  getKindLabel,
  getPathBaseName,
  getPathHierarchy,
  isHiddenName,
  resolveEntry,
};
