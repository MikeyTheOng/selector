import { useCallback, useEffect, useMemo, useState } from "react";
import type { FileKind } from "@/lib/file-types";
import { getFileKind } from "@/lib/file-types";
import type { ExplorerItem } from "@/types/explorer";
import {
  deduplicateByPath,
  getFileKindCounts,
  resolveExpandFolders,
  resolveFilesOnly,
  resolveFoldersOnly,
} from "../lib/export-resolution";

export type ExportResolutionStrategy = "files-only" | "folders-only" | "expand-folders";

type FileKindSelection = Record<FileKind, boolean>;

const allKinds: FileKind[] = ["image", "video", "document"];

const createSelectionFromCounts = (
  counts: Record<FileKind, number>,
): FileKindSelection => ({
  image: counts.image > 0,
  video: counts.video > 0,
  document: counts.document > 0,
});

export const useExportResolution = (items: ExplorerItem[]) => {
  const [resolutionStrategy, setResolutionStrategy] =
    useState<ExportResolutionStrategy | null>(null);
  const [resolvedItems, setResolvedItems] = useState<ExplorerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileKindSelection, setFileKindSelection] = useState<FileKindSelection>({
    image: false,
    video: false,
    document: false,
  });

  useEffect(() => {
    let isActive = true;

    const resolve = async () => {
      if (!resolutionStrategy) {
        setResolvedItems([]);
        setIsLoading(false);
        return;
      }

      if (resolutionStrategy === "expand-folders") {
        setIsLoading(true);
        try {
          const expanded = await resolveExpandFolders(items);
          if (!isActive) return;
          setResolvedItems(deduplicateByPath(expanded));
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
        return;
      }

      setIsLoading(false);
      const resolved =
        resolutionStrategy === "files-only"
          ? resolveFilesOnly(items)
          : resolveFoldersOnly(items);
      setResolvedItems(deduplicateByPath(resolved));
    };

    void resolve();

    return () => {
      isActive = false;
    };
  }, [items, resolutionStrategy]);

  const fileKindCounts = useMemo(
    () => getFileKindCounts(resolvedItems),
    [resolvedItems],
  );

  useEffect(() => {
    if (!resolutionStrategy) return;
    setFileKindSelection(createSelectionFromCounts(fileKindCounts));
  }, [fileKindCounts, resolutionStrategy]);

  const toggleFileKind = useCallback((kind: FileKind) => {
    setFileKindSelection((prev) => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  const resolvedPaths = useMemo(() => {
    if (!resolutionStrategy) {
      return [];
    }
    const activeKinds = new Set(
      allKinds.filter((kind) => fileKindSelection[kind]),
    );
    return resolvedItems
      .filter((item) => {
        if (item.kind === "folder") return true;
        return activeKinds.has(getFileKind(item.extension));
      })
      .map((item) => item.path);
  }, [fileKindSelection, resolutionStrategy, resolvedItems]);

  const isEmpty = Boolean(resolutionStrategy) && !isLoading && resolvedPaths.length === 0;

  return {
    resolutionStrategy,
    setResolutionStrategy,
    fileKindSelection,
    toggleFileKind,
    resolvedPaths,
    fileKindCounts,
    isEmpty,
    isLoading,
  };
};
