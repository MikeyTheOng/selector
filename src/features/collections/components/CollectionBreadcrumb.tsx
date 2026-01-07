import React from "react";
import { ChevronRight, FolderHeart } from "lucide-react";
import { useCollections } from "../hooks/use-collections";

interface CollectionBreadcrumbProps {
  collectionId: number;
}

export const CollectionBreadcrumb: React.FC<CollectionBreadcrumbProps> = ({
  collectionId,
}) => {
  const { collections } = useCollections();
  const collection = collections.find((c) => c.id === collectionId);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
        <FolderHeart className="h-4 w-4" />
        <span>Collections</span>
      </div>
      
      <ChevronRight className="h-4 w-4 opacity-50" />
      
      <div className="font-medium text-foreground cursor-default">
        {collection ? collection.name : "Loading..."}
      </div>
    </div>
  );
};
