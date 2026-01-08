import React, { useState } from "react";
import { FolderPlus, Plus, Loader2 } from "lucide-react";
import { useCollections } from "../hooks/use-collections";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CollectionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (collectionId: number) => Promise<void>;
  title: string;
  description: string;
  excludeCollectionId?: number;
}

export const CollectionPicker: React.FC<CollectionPickerProps> = ({
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
    ? collections.filter((c) => c.id !== excludeCollectionId)
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
