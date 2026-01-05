import { useCallback, useMemo, useState } from "react";
import type { FileRow } from "@/types/fs";

export type LastClickedFile = {
  file: FileRow;
  columnPath?: string;
};

export const useFileSelection = () => {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, FileRow>>({});
  const [lastClickedFile, setLastClickedFile] = useState<LastClickedFile | null>(null);
  const [focusedFile, setFocusedFile] = useState<LastClickedFile | null>(null);

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
    setLastClickedFile(null);
  }, []);

  const selectRange = useCallback(
    (from: FileRow, to: FileRow, allFiles: FileRow[]) => {
      const fromIndex = allFiles.findIndex((f) => f.path === from.path);
      const toIndex = allFiles.findIndex((f) => f.path === to.path);
      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangeFiles = allFiles.slice(start, end + 1);

      setSelectedFiles((prev) => {
        const next = { ...prev };
        rangeFiles.forEach((file) => {
          next[file.path] = file;
        });
        return next;
      });
    },
    [],
  );

  const updateLastClickedFile = useCallback((file: FileRow, columnPath?: string) => {
    setLastClickedFile({ file, columnPath });
  }, []);

  const clearLastClickedFile = useCallback(() => {
    setLastClickedFile(null);
  }, []);

  const focusFile = useCallback((file: FileRow, columnPath?: string) => {
    const item = { file, columnPath };
    setFocusedFile(item);
    setLastClickedFile(item);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedFile(null);
  }, []);

  return {
    selectedFiles,
    selectedEntries,
    selectedCount,
    lastClickedFile,
    focusedFile,
    selectFile,
    selectMultiple,
    selectRange,
    toggleFileSelection,
    removeSelection,
    clearSelections,
    updateLastClickedFile,
    clearLastClickedFile,
    focusFile,
    clearFocus,
  };
};
