import React, { useState } from "react";
import { useCollectionItems } from "../hooks/use-collection-items";
import * as collectionsService from "../lib/collections-repository";
import { CollectionPicker } from "./CollectionPicker";
import type { ExplorerItem } from "@/types/explorer";

type MoveCopyMode = "move" | "copy";

interface CollectionMoveCopyDialogProps {
  collectionId: number;
  entries: ExplorerItem[];
  mode: MoveCopyMode;
  isOpen: boolean;
  onClose: () => void;
}

export const CollectionMoveCopyDialog: React.FC<CollectionMoveCopyDialogProps> = ({
  collectionId,
  entries,
  mode,
  isOpen,
  onClose,
}) => {
  const { removeItemByPath } = useCollectionItems(collectionId);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectTarget = async (targetId: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      for (const entry of entries) {
        await collectionsService.addItemToCollection({
          collection_id: targetId,
          path: entry.path,
          item_type: entry.kind === "folder" ? "folder" : "file",
        });
      }

      if (mode === "move") {
        for (const entry of entries) {
          await removeItemByPath(entry.path);
        }
      }
      onClose();
    } catch (err) {
      console.error(`Failed to ${mode} items:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const title = mode === "move" ? "Move to Collection" : "Copy to Collection";
  const description = `${mode === "move" ? "Move" : "Copy"} ${entries.length} items to another collection.`;

  return (
    <CollectionPicker
      isOpen={isOpen}
      onClose={onClose}
      onSelect={handleSelectTarget}
      title={title}
      description={description}
      excludeCollectionId={mode === "move" ? collectionId : undefined}
    />
  );
};
