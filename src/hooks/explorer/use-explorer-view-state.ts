import { useState, useCallback } from "react";
import type { ExplorerViewMode } from "@/types/explorer";

export interface ExplorerViewStateOptions {
  initialViewMode?: ExplorerViewMode;
  initialSortField?: string;
  initialSortDirection?: "asc" | "desc";
}

export const useExplorerViewState = (options: ExplorerViewStateOptions = {}) => {
  const [viewMode, setViewMode] = useState<ExplorerViewMode>(
    options.initialViewMode ?? "list"
  );
  const [sortField, setSortField] = useState<string>(
    options.initialSortField ?? "name"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    options.initialSortDirection ?? "asc"
  );

  const setSort = useCallback(
    (field: string, direction?: "asc" | "desc") => {
      if (direction) {
        setSortField(field);
        setSortDirection(direction);
      } else if (field === sortField) {
        // Toggle direction if same field
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        // Default to asc for new field
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  return {
    viewMode,
    setViewMode,
    sortField,
    sortDirection,
    setSort,
  };
};