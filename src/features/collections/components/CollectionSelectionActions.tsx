import React, { useState } from "react";
import { Copy, Move, Trash2, Loader2 } from "lucide-react";
import { useCollectionItems } from "../hooks/use-collection-items";
import { Button } from "@/components/ui/button";
import type { ExplorerItem } from "@/types/explorer";

interface CollectionSelectionActionsProps {
  collectionId: number;
  entries: ExplorerItem[];
  onRequestMove?: (entries: ExplorerItem[]) => void;
  onRequestCopy?: (entries: ExplorerItem[]) => void;
}

export const CollectionSelectionActions: React.FC<CollectionSelectionActionsProps> = ({
  collectionId,
  entries,
  onRequestMove,
  onRequestCopy,
}) => {
  const { removeItemByPath } = useCollectionItems(collectionId);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      for (const entry of entries) {
        await removeItemByPath(entry.path);
      }
    } catch (err) {
      console.error("Failed to remove items:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  const hasEntries = entries.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={() => onRequestCopy?.(entries)}
          disabled={!hasEntries || !onRequestCopy}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy to...
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={() => onRequestMove?.(entries)}
          disabled={!hasEntries || !onRequestMove}
        >
          <Move className="h-3.5 w-3.5" />
          Move to...
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleRemove}
        disabled={!hasEntries || isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Remove from Collection
      </Button>
    </div>
  );
};
