import React, { useState } from "react";
import { Copy, Move, Trash2, FolderPlus, Plus, Loader2 } from "lucide-react";
import { useCollections } from "../hooks/use-collections";
import { useCollectionItems } from "../hooks/use-collection-items";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import * as collectionsService from "../lib/collections-repository";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExplorerItem } from "@/types/explorer";

interface CollectionSelectionActionsProps {
  collectionId: number;
  entries: ExplorerItem[];
  onComplete?: () => void;
}

export const CollectionSelectionActions: React.FC<CollectionSelectionActionsProps> = ({
  collectionId,
  entries,
  onComplete,
}) => {
  const { removeItemByPath } = useCollectionItems(collectionId);
  const [pickerMode, setPickerMode] = useState<"move" | "copy" | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      for (const entry of entries) {
        await removeItemByPath(entry.path);
      }
      onComplete?.();
    } catch (err) {
      console.error("Failed to remove items:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSelectTarget = async (targetId: number) => {
    if (!pickerMode) return;
    
    try {
      // Add items to target collection
      for (const entry of entries) {
        await collectionsService.addItemToCollection({
          collection_id: targetId,
          path: entry.path,
          item_type: entry.kind === "folder" ? "folder" : "file",
        });
      }

      // If move, remove from current collection
      if (pickerMode === "move") {
        for (const entry of entries) {
          await removeItemByPath(entry.path);
        }
      }

      onComplete?.();
    } catch (err) {
      console.error(`Failed to ${pickerMode} items:`, err);
    } finally {
      setPickerMode(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={() => setPickerMode("copy")}
          disabled={entries.length === 0}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy to...
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={() => setPickerMode("move")}
          disabled={entries.length === 0}
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
        disabled={entries.length === 0 || isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Remove from Collection
      </Button>
      
      <CollectionPicker
        isOpen={pickerMode !== null}
        onClose={() => setPickerMode(null)}
        onSelect={handleSelectTarget}
        title={pickerMode === "move" ? "Move to Collection" : "Copy to Collection"}
        description={`${pickerMode === "move" ? "Move" : "Copy"} ${entries.length} items to another collection.`}
        excludeCollectionId={pickerMode === "move" ? collectionId : undefined}
      />
    </div>
  );
};

interface CollectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (collectionId: number) => Promise<void>;
  title: string;
  description: string;
  excludeCollectionId?: number;
}

const CollectionPicker: React.FC<CollectionPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  title,
  description,
  excludeCollectionId,
}) => {
  const { collections, createCollection, isLoading } = useCollections();
  const [isProcessing, setIsProcessing] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const handleCreateAndSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const newColl = await createCollection({ name: newCollectionName });
      await onSelect(newColl.id);
      setNewCollectionName("");
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCollections = excludeCollectionId 
    ? collections.filter(c => c.id !== excludeCollectionId)
    : collections;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <form onSubmit={handleCreateAndSelect} className="flex gap-2">
            <Input
              placeholder="New collection name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              disabled={isProcessing}
            />
            <Button
              size="icon"
              variant="secondary"
              type="submit"
              className="h-9 w-9 shrink-0"
              disabled={!newCollectionName.trim() || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground/70 px-1">
              Existing Collections
            </p>
            <ScrollArea className="h-50 border rounded-md p-1">
              <div className="flex flex-col gap-1">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCollections.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    No other collections found.
                  </p>
                ) : (
                  filteredCollections.map((coll) => (
                    <Button
                      key={coll.id}
                      variant="ghost"
                      size="sm"
                      className="justify-start font-medium h-9 px-3 rounded-lg hover:bg-muted/80 transition-colors w-full"
                      onClick={() => onSelect(coll.id)}
                      disabled={isProcessing}
                    >
                      <FolderPlus className="mr-2.5 h-4 w-4 text-primary/70" />
                      <span className="truncate">{coll.name}</span>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
