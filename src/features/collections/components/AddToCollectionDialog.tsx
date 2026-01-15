import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getFilename } from "../hooks/use-collection-items";
import { useCollections } from "../hooks/use-collections";
import * as collectionsService from "../lib/collections-service";
import { DuplicateItemError } from "../errors";
import { FolderPlus, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExplorerItem } from "@/types/explorer";

interface AddToCollectionDialogProps {
  entries: ExplorerItem[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const AddToCollectionDialog: React.FC<AddToCollectionDialogProps> = ({
  entries,
  isOpen,
  onOpenChange,
}) => {
  const { collections, createCollection, isLoading } = useCollections();
  const [isProcessing, setIsProcessing] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const handleSelectTarget = async (targetId: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const { added, errors } = await collectionsService.addItemsToCollection(
        targetId,
        entries.map((entry) => ({
          path: entry.path,
          item_type: entry.kind === "folder" ? "folder" : "file",
        })),
      );

      const duplicateCount = errors.filter(
        ({ error }) => error instanceof DuplicateItemError,
      ).length;
      const failureCount = errors.length - duplicateCount;

      for (const { input, error } of errors) {
        let errorMsg = "Failed to add item.";
        if (error instanceof DuplicateItemError) {
          const filename = getFilename(input.path);
          errorMsg = `'${filename}' is already in '${error.collectionName || "this collection"}'`;
        }
        toast.error(errorMsg);
      }

      if (added.length > 0) {
        const targetCollection = collections.find((c) => c.id === targetId);
        const summaryParts: string[] = [];
        if (duplicateCount > 0) {
          summaryParts.push(
            `skipped ${duplicateCount} duplicate${duplicateCount !== 1 ? "s" : ""}`,
          );
        }
        if (failureCount > 0) {
          summaryParts.push(
            `failed to add ${failureCount} item${failureCount !== 1 ? "s" : ""}`,
          );
        }
        const summarySuffix =
          summaryParts.length > 0 ? ` (${summaryParts.join(", ")})` : "";
        toast.success(
          `Added ${added.length} item${added.length !== 1 ? "s" : ""} to '${targetCollection?.name || "collection"}'${summarySuffix}`,
        );
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to add items to collection:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAndSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const newColl = await createCollection({ name: newCollectionName });
      await handleSelectTarget(newColl.id);
      setNewCollectionName("");
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const title = "Add to Collection";
  const description = `Add ${entries.length} item${entries.length !== 1 ? "s" : ""} to a collection.`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <p className="px-1 text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground/70">
              Existing Collections
            </p>
            <ScrollArea className="h-50 rounded-md border p-1">
              <div className="flex flex-col gap-1">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : collections.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No collections found. Create one above.
                  </p>
                ) : (
                  collections.map((coll) => (
                    <Button
                      key={coll.id}
                      variant="ghost"
                      size="sm"
                      className="h-9 w-full justify-start rounded-lg px-3 font-medium transition-colors hover:bg-muted/80"
                      onClick={() => handleSelectTarget(coll.id)}
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
