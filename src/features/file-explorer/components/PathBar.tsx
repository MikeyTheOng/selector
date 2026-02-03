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

    const volumeLocations = locations.filter((loc) => loc.kind === "volume");
    let rootPath = "/";
    let rootName = "/";

    if (selectedFolder.startsWith("/Volumes/")) {
      const segments = selectedFolder.split("/").filter(Boolean);
      const volumeName = segments[1];
      rootPath = volumeName ? `/Volumes/${volumeName}` : "/Volumes";
      const rootLocation = volumeLocations.find((loc) => loc.path === rootPath);
      rootName = rootLocation?.name ?? volumeName ?? getPathBaseName(rootPath);
    } else {
      const macVolume = volumeLocations.find((loc) => loc.name === "Macintosh HD");
      const defaultVolume = macVolume ?? volumeLocations[0];
      rootName = defaultVolume?.name ?? "/";
      rootPath = "/";
    }

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
