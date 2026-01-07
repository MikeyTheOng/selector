import React from "react";
import { CollectionToolbar } from "./CollectionToolbar";
import { CollectionsView } from "./CollectionsView";

interface CollectionsPageProps {
  collectionId: string;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  collectionId,
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <CollectionToolbar collectionId={collectionId} />
      <CollectionsView collectionId={collectionId} />
    </div>
  );
};
