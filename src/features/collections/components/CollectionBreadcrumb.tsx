import React from "react";
import { FolderHeart } from "lucide-react";
import { useCollections } from "../hooks/use-collections";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CollectionBreadcrumbProps {
  collectionId: number;
}

export const CollectionBreadcrumb: React.FC<CollectionBreadcrumbProps> = ({
  collectionId,
}) => {
  const { collections } = useCollections();
  const collection = collections.find((c) => c.id === collectionId);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
            <FolderHeart className="h-4 w-4" />
            <span>Collections</span>
          </div>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbPage>
            {collection ? collection.name : "Loading..."}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};