import React from "react";
import { FolderPlus } from "lucide-react";
import { useCollections } from "../hooks/use-collections";
import { useNavigation } from "@/hooks/use-navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CollectionsSidebarSection: React.FC = () => {
  const { collections, isLoading, error } = useCollections();
  const { currentRoute, navigateToCollection } = useNavigation();

  const selectedCollectionId = currentRoute.type === "collection" 
    ? parseInt(currentRoute.collectionId, 10) 
    : null;

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-xs text-muted-foreground animate-pulse">
        Loading collections...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-xs text-destructive">
        Error loading collections
      </div>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="cursor-default select-none px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Collections
      </p>
      <div className="flex flex-col gap-0.5">
        {collections.map((collection) => (
          <Button
            key={collection.id}
            type="button"
            variant="ghost"
            onClick={() => navigateToCollection(collection.id.toString())}
            className={cn(
              "h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:text-foreground",
              selectedCollectionId === collection.id
                ? "bg-accent/70 text-foreground"
                : "text-foreground hover:bg-muted/50"
            )}
          >
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
            <span className="truncate font-medium">{collection.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
