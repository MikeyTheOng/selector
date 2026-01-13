import { useMemo } from "react";
import {
  ExplorerPathBar,
  type PathSegment as GenericPathSegment,
} from "@/components/explorer/ExplorerPathBar";
import type { LocationItem } from "@/types/explorer";
import { getPathBaseName } from "@/lib/path-utils";

type PathBarProps = {
  selectedFolder: string | null;
  locations: LocationItem[];
  onSelectFolder: (path: string) => void;
};

export const PathBar = ({
  selectedFolder,
  locations,
  onSelectFolder,
}: PathBarProps) => {
  const segments = useMemo(() => {
    if (!selectedFolder) {
      return [] as GenericPathSegment[];
    }

    // Find the matching root location (longest matching prefix)
    const sortedLocations = [...locations]
      .filter(
        (loc) =>
          selectedFolder === loc.path ||
          selectedFolder.startsWith(loc.path.endsWith("/") ? loc.path : `${loc.path}/`),
      )
      .sort((a, b) => b.path.length - a.path.length);

    const rootLocation = sortedLocations[0];
    const rootPath = rootLocation?.path ?? selectedFolder;
    const rootName = rootLocation?.name ?? getPathBaseName(rootPath);

    // Start with root segment
    const result: GenericPathSegment[] = [
      { id: rootPath, path: rootPath, name: rootName, isRoot: true },
    ];

    // If selected folder is deeper than root, parse remaining segments
    if (selectedFolder !== rootPath) {
      const relative = selectedFolder.slice(rootPath.length);
      const parts = relative.split("/").filter(Boolean);

      let currentPath = rootPath;
      for (const part of parts) {
        currentPath = currentPath.endsWith("/")
          ? `${currentPath}${part}`
          : `${currentPath}/${part}`;
        result.push({ id: currentPath, path: currentPath, name: part, isRoot: false });
      }
    }

    return result;
  }, [selectedFolder, locations]);

  if (segments.length === 0) {
    return null;
  }

  return (
    <ExplorerPathBar
      segments={segments}
      onNavigate={(segment) => onSelectFolder(segment.path)}
    />
  );
};