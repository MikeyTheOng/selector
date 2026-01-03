import { useCallback, useMemo, useState } from "react";
import { FileRow } from "../lib/fs";

export const useFileSelection = () => {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, FileRow>>({});

  const selectedEntries = useMemo(
    () => Object.values(selectedFiles).sort((a, b) => a.name.localeCompare(b.name)),
    [selectedFiles],
  );
  const selectedCount = selectedEntries.length;

  const selectFile = useCallback((row: FileRow, options?: { additive?: boolean }) => {
    setSelectedFiles((prev) => {
      if (options?.additive) {
        if (prev[row.path]) {
          return prev;
        }
        return { ...prev, [row.path]: row };
      }
      return { [row.path]: row };
    });
  }, []);

  const selectMultiple = useCallback((rows: FileRow[], options?: { additive?: boolean }) => {
    setSelectedFiles((prev) => {
      if (options?.additive) {
        const next = { ...prev };
        rows.forEach((row) => {
          next[row.path] = row;
        });
        return next;
      }
      return Object.fromEntries(rows.map((row) => [row.path, row] as const));
    });
  }, []);

  const toggleFileSelection = useCallback((row: FileRow) => {
    setSelectedFiles((prev) => {
      const next = { ...prev };
      if (next[row.path]) {
        delete next[row.path];
      } else {
        next[row.path] = row;
      }
      return next;
    });
  }, []);

  const removeSelection = useCallback((path: string) => {
    setSelectedFiles((prev) => {
      if (!prev[path]) {
        return prev;
      }
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedFiles({});
  }, []);

  return {
    selectedFiles,
    selectedEntries,
    selectedCount,
    selectFile,
    selectMultiple,
    toggleFileSelection,
    removeSelection,
    clearSelections,
  };
};
