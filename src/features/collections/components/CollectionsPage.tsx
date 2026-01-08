import React, { useState } from "react";
import { useCollectionSelection } from "../hooks/use-collection-selection";
import { CollectionToolbar } from "./CollectionToolbar";
import { CollectionsView } from "./CollectionsView";

interface CollectionsPageProps {
  collectionId: string;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  collectionId,
}) => {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const selection = useCollectionSelection();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CollectionToolbar 
        collectionId={collectionId} 
        isSelectionOpen={isSelectionOpen}
        onToggleSelection={() => setIsSelectionOpen(!isSelectionOpen)}
        selection={selection}
      />
      <CollectionsView 
        collectionId={collectionId}
        isSelectionOpen={isSelectionOpen}
        setIsSelectionOpen={setIsSelectionOpen}
        selection={selection}
      />
    </div>
  );
};
