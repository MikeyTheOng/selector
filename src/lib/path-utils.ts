import type { FsDirEntry, LocationItem } from "@/types/explorer";

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

const getParentPath = (path: string): string => {
  const normalized = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash <= 0) {
    return "/";
  }
  return normalized.slice(0, lastSlash);
};

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

  const rootPath = sortedLocations[0]?.path ?? "/";

  if (path === rootPath) {
    return [rootPath];
  }

  const relative = rootPath === "/" ? path : path.slice(rootPath.length);
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

export {
  getErrorMessage,
  getPathBaseName,
  getParentPath,
  resolveEntry,
  isHiddenName,
  getPathHierarchy,
};
