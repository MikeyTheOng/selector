import { useMemo } from "react";
import { Folder, HardDrive } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import type { LocationItem } from "@/types/fs";
import { getPathBaseName } from "@/lib/path-utils";

type PathSegment = {
  path: string;
  name: string;
  isRoot: boolean;
};

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
      return [] as PathSegment[];
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
    const result: PathSegment[] = [{ path: rootPath, name: rootName, isRoot: true }];

    // If selected folder is deeper than root, parse remaining segments
    if (selectedFolder !== rootPath) {
      const relative = selectedFolder.slice(rootPath.length);
      const parts = relative.split("/").filter(Boolean);

      let currentPath = rootPath;
      for (const part of parts) {
        currentPath = currentPath.endsWith("/")
          ? `${currentPath}${part}`
          : `${currentPath}/${part}`;
        result.push({ path: currentPath, name: part, isRoot: false });
      }
    }

    return result;
  }, [selectedFolder, locations]);

  if (segments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="cursor-default select-none overflow-x-auto border-t border-border/60 bg-background/50 px-4 py-2">
      <BreadcrumbList className="flex-nowrap gap-1 text-xs">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const Icon = segment.isRoot ? HardDrive : Folder;

          return (
            <BreadcrumbItem key={segment.path}>
              {isLast ? (
                <BreadcrumbPage className="inline-flex items-center gap-1.5 text-xs">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      segment.isRoot ? "text-muted-foreground" : "text-primary",
                    )}
                  />
                  <span className="truncate">{segment.name}</span>
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <button
                      type="button"
                      onClick={() => onSelectFolder(segment.path)}
                      className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-muted/60"
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          segment.isRoot ? "text-muted-foreground" : "text-primary",
                        )}
                      />
                      <span className="truncate">{segment.name}</span>
                    </button>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
