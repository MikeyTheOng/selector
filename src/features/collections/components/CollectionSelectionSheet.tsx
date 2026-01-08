import React from "react";
import { ExplorerSelectionSheet } from "@/components/explorer/ExplorerSelectionSheet";
import { CollectionSelectionActions } from "./CollectionSelectionActions";
import type { ExplorerItem } from "@/types/explorer";

interface CollectionSelectionSheetProps {
  collectionId: number;
  isOpen: boolean;
  entries: ExplorerItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onRequestMove?: (entries: ExplorerItem[]) => void;
  onRequestCopy?: (entries: ExplorerItem[]) => void;
}

export const CollectionSelectionSheet: React.FC<CollectionSelectionSheetProps> = ({
  collectionId,
  isOpen,
  entries,
  onClose,
  onRemove,
  onClear,
  onRequestMove,
  onRequestCopy,
}) => {
  return (
    <ExplorerSelectionSheet
      isOpen={isOpen}
      entries={entries}
      onClose={onClose}
      onRemove={onRemove}
      onClear={onClear}
      renderActions={(sheetEntries) => (
        <CollectionSelectionActions
          collectionId={collectionId}
          entries={sheetEntries}
          onRequestMove={onRequestMove}
          onRequestCopy={onRequestCopy}
        />
      )}
    />
  );
};
