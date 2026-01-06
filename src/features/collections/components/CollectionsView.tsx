import React, { useMemo } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useCollections } from "../hooks/use-collections";
import { useCollectionItems } from "../hooks/use-collection-items";
import { CollectionListView } from "./CollectionListView";
import { getPathBaseName } from "@/lib/path-utils";
import type { FolderListing, FileRow, FolderRow } from "@/types/fs";

interface CollectionsViewProps {
  collectionId: number;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collectionId,
}) => {
  const { collections } = useCollections();
  const { items, isLoading, relinkItem, relinkFolder } = useCollectionItems(collectionId);

  const collection = collections.find((c) => c.id === collectionId);

  const handleActivateItem = async (row: FileRow) => {
    // Only handle missing/offline items for relinking
    if (row.status !== "missing" && row.status !== "offline") {
      return;
    }

    const originalItem = items.find((i) => i.path === row.path);
    if (!originalItem) return;

    try {
      const selected = await open({
        multiple: false,
        directory: originalItem.item_type === "folder",
        title: `Relink ${originalItem.item_type === "folder" ? "Folder" : "File"}: ${row.name}`,
        // We don't set defaultPath because the original path likely doesn't exist
      });

      if (selected && typeof selected === "string") {
        if (originalItem.item_type === "folder") {
          await relinkFolder(row.path, selected);
        } else {
          await relinkItem(row.path, selected);
        }
      }
    } catch (err) {
      console.error("Failed to relink item:", err);
    }
  };

  const listing: FolderListing = useMemo(() => {
    const folders: FolderRow[] = [];
    const files: FileRow[] = [];

    items.forEach((item) => {
      const name = getPathBaseName(item.path);
      const isMissing = item.status !== "available";
      const statusLabel = isMissing ? ` (${item.status})` : "";

      if (item.item_type === "folder") {
        folders.push({
          path: item.path,
          name: name,
          dateModified: new Date(item.added_at), // Using added_at as date for now
          dateModifiedLabel: new Date(item.added_at).toLocaleDateString(),
          status: item.status,
        });
      } else {
        files.push({
          path: item.path,
          name: name,
          extension: name.split(".").pop() || "",
          kindLabel: `File${statusLabel}`, 
          sizeLabel: "",
          dateModified: new Date(item.added_at),
          dateModifiedLabel: new Date(item.added_at).toLocaleDateString(),
          status: item.status,
        });
      }
    });

    return {
      folders,
      files,
      isLoading,
      fileCount: files.length,
      folderCount: folders.length,
      isTruncated: false,
    };
  }, [items, isLoading]);

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Collection not found
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
        Loading items...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/60">
        <h2 className="text-lg font-semibold tracking-tight">
          {collection.name}
        </h2>
        <p className="text-xs text-muted-foreground">
          {listing.fileCount} files, {listing.folderCount} folders
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        <CollectionListView
          listing={listing}
          selectedFiles={{}} // TODO: Add selection state
          lastClickedFile={null}
          focusedFile={null}
          onSelectFolder={(path) => console.log("Select folder:", path)} // TODO: Handle navigation
          onSelectFile={() => {}}
          onSelectRange={() => {}}
          onFocusFile={() => {}}
          onToggleFileSelection={() => {}}
          onActivateItem={handleActivateItem}
        />
      </div>
    </div>
  );
};
