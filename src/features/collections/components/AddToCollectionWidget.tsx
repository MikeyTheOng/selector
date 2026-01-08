import React, { useState, useEffect } from "react";
import { Plus, FolderPlus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useCollections } from "../hooks/use-collections";
import { useCollectionItems } from "../hooks/use-collection-items";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { FileRow } from "@/types/fs";

interface AddToCollectionWidgetProps {
  selectedEntries: FileRow[];
}

const formSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const AddToCollectionWidget: React.FC<AddToCollectionWidgetProps> = ({
  selectedEntries,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { collections, createCollection, isLoading: isCollectionsLoading } =
    useCollections();
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<number | null>(
    null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setTargetCollectionId(null);
      setIsProcessing(false);
    }
  }, [isOpen, form]);

  const handleCreateAndAdd = async (data: FormValues) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const newColl = await createCollection({ name: data.name });
      setTargetCollectionId(newColl.id);
      form.reset();
      console.log("Collection created with ID:", newColl.id);
    } catch (error) {
      console.error("Failed to create collection:", error);
      setIsProcessing(false);
    }
  };

  const handleAddToExisting = (id: number) => {
    if (isProcessing) return;
    setTargetCollectionId(id);
    setIsProcessing(true);
  };

  const onAddComplete = () => {
    setTargetCollectionId(null);
    setIsProcessing(false);
    setIsOpen(false);
  };

  if (selectedEntries.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          Add to Collection...
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Add {selectedEntries.length} items to a new or existing collection.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <form
            onSubmit={form.handleSubmit(handleCreateAndAdd)}
            className="flex gap-2"
          >
            <Input
              placeholder="New collection name..."
              {...form.register("name")}
              disabled={isProcessing}
            />
            <Button
              size="icon"
              variant="secondary"
              type="submit"
              className="h-9 w-9 shrink-0"
              disabled={!form.formState.isValid || isProcessing}
              aria-label="Create new collection"
            >
              {isProcessing && targetCollectionId === null ? (
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
                {isCollectionsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : collections.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    No collections yet.
                  </p>
                ) : (
                  collections.map((coll) => (
                    <Button
                      key={coll.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start font-medium h-9 px-3 rounded-lg hover:bg-muted/80 transition-colors w-full",
                        targetCollectionId === coll.id && "bg-muted animate-pulse"
                      )}
                      onClick={() => handleAddToExisting(coll.id)}
                      disabled={isProcessing}
                    >
                      <FolderPlus className="mr-2.5 h-4 w-4 text-primary/70" />
                      <span className="truncate">{coll.name}</span>
                      {targetCollectionId === coll.id && (
                        <Loader2 className="ml-auto h-3 w-3 animate-spin" />
                      )}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {targetCollectionId !== null && (
          <CollectionItemAdder
            collectionId={targetCollectionId}
            selectedEntries={selectedEntries}
            onComplete={onAddComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Internal component to handle the side-effect of adding items using the useCollectionItems hook
 */
const CollectionItemAdder: React.FC<{
  collectionId: number;
  selectedEntries: FileRow[];
  onComplete: () => void;
}> = ({ collectionId, selectedEntries, onComplete }) => {
  const { addItem } = useCollectionItems(collectionId);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    setStarted(true);

    const addAll = async () => {
      try {
        for (const entry of selectedEntries) {
          await addItem({
            collection_id: collectionId,
            path: entry.path,
            item_type: entry.kindLabel === "Folder" ? "folder" : "file",
          });
        }
      } catch (error) {
        console.error("Failed to add items to collection:", error);
      } finally {
        onComplete();
      }
    };

    addAll();
  }, [collectionId, selectedEntries, addItem, onComplete, started]);

  return null;
};
