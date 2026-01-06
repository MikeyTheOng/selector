import React, { useState, useEffect } from "react";
import { Plus, FolderPlus, Loader2 } from "lucide-react";
import { useCollections } from "../hooks/use-collections";
import { useCollectionItems } from "../hooks/use-collection-items";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { FileRow } from "@/types/fs";

interface AddToCollectionWidgetProps {
  selectedFiles: Record<string, FileRow>;
}

export const AddToCollectionWidget: React.FC<AddToCollectionWidgetProps> = ({
  selectedFiles,
}) => {
  const { collections, createCollection, isLoading: isCollectionsLoading } =
    useCollections();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<number | null>(
    null
  );

  const handleCreateAndAdd = async () => {
    const name = newCollectionName.trim();
    if (!name || isProcessing) return;

    setIsProcessing(true);
    try {
      const newColl = await createCollection({ name });
      setTargetCollectionId(newColl.id);
      setNewCollectionName("");
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
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold tracking-tight">Add to Collection</h3>
        <p className="text-[0.625rem] text-muted-foreground">
          {Object.keys(selectedFiles).length} items selected
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New collection name..."
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !isProcessing && handleCreateAndAdd()
          }
          disabled={isProcessing}
        />
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 shrink-0"
          onClick={handleCreateAndAdd}
          disabled={!newCollectionName.trim() || isProcessing}
          aria-label="Create new collection"
        >
          {isProcessing && targetCollectionId === null ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground/70 px-1">
          Existing Collections
        </p>
        <ScrollArea className="h-[140px] -mx-1 px-1">
          <div className="flex flex-col gap-1">
            {isCollectionsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : collections.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center bg-muted/30 rounded-lg border border-dashed">
                No collections yet.
              </p>
            ) : (
              collections.map((coll) => (
                <Button
                  key={coll.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "justify-start font-medium h-9 px-3 rounded-lg hover:bg-muted/80 transition-colors",
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

      {targetCollectionId !== null && (
        <CollectionItemAdder
          collectionId={targetCollectionId}
          selectedFiles={selectedFiles}
          onComplete={onAddComplete}
        />
      )}
    </div>
  );
};

/**
 * Internal component to handle the side-effect of adding items using the useCollectionItems hook
 */
const CollectionItemAdder: React.FC<{
  collectionId: number;
  selectedFiles: Record<string, FileRow>;
  onComplete: () => void;
}> = ({ collectionId, selectedFiles, onComplete }) => {
  const { addItem } = useCollectionItems(collectionId);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    setStarted(true);

    const addAll = async () => {
      try {
        const entries = Object.values(selectedFiles);
        for (const entry of entries) {
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
  }, [collectionId, selectedFiles, addItem, onComplete, started]);

  return null;
};
