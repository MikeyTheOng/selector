import React from "react";
import { ExplorerSelectionSheet } from "@/components/explorer/ExplorerSelectionSheet";
import { fileRowToExplorerItem } from "@/lib/explorer-utils";
import type { FileRow } from "@/types/fs";

type SelectionSheetProps = {
  isOpen: boolean;
  entries: FileRow[];
  onClose: () => void;
  onRemove: (path: string) => void;
  onClear: () => void;
  /** Optional slot for injecting external action UI (e.g., Collections widget) */
  renderActions?: (entries: FileRow[]) => React.ReactNode;
};

export const SelectionSheet = ({
  isOpen,
  entries,
  onClose,
  onRemove,
  onClear,
  renderActions,
}: SelectionSheetProps) => {
  return (
    <ExplorerSelectionSheet
      isOpen={isOpen}
      entries={entries.map(fileRowToExplorerItem)}
      onClose={onClose}
      onRemove={onRemove}
      onClear={onClear}
      renderActions={renderActions ? () => renderActions(entries) : undefined}
    />
  );
};
