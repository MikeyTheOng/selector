import React, { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useCollections } from "../hooks/use-collections";
import { useCollectionItems } from "../hooks/use-collection-items";
import { useCollectionSelection, collectionItemToExplorerItem } from "../hooks/use-collection-selection";
import { useExplorerViewState } from "@/hooks/explorer/useExplorerViewState";
import { ExplorerListView } from "@/components/explorer/ExplorerListView";
import { ExplorerToolbar } from "@/components/explorer/ExplorerToolbar";
import { ExplorerSelectionSheet } from "@/components/explorer/ExplorerSelectionSheet";
import { CollectionRowLabel } from "./CollectionRowLabel";
import type { ExplorerItem, ExplorerItemStatus } from "@/types/explorer";

interface CollectionsViewProps {
  collectionId: number;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collectionId,
}) => {
  const { collections } = useCollections();
  const { items, isLoading, relinkItem, relinkFolder } = useCollectionItems(collectionId);
  const { 
    selectedItems, 
    selectedCount,
    selectedEntries,
    focusedItem,
    lastClickedItem,
    selectCollectionItem,
    selectMultipleCollectionItems,
    toggleCollectionItemSelection,
    focusItem,
    removeSelection,
    clearSelections
  } = useCollectionSelection();
  const { viewMode, setViewMode } = useExplorerViewState({ initialViewMode: "list" });
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const collection = collections.find((c) => c.id === collectionId);

  const handleActivateItem = async (item: ExplorerItem) => {
    // Only handle missing/offline items for relinking
    if (item.status !== "missing" && item.status !== "offline") {
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        directory: item.kind === "folder",
        title: `Relink ${item.kind === "folder" ? "Folder" : "File"}: ${item.name}`,
      });

      if (selected && typeof selected === "string") {
        if (item.kind === "folder") {
          await relinkFolder(item.path, selected);
        } else {
          await relinkItem(item.path, selected);
        }
      }
    } catch (err) {
      console.error("Failed to relink item:", err);
    }
  };

  const explorerItems = useMemo(() => 
    items.map(collectionItemToExplorerItem), 
  [items]);

  const fileCount = useMemo(() => items.filter(i => i.item_type === "file").length, [items]);
  const folderCount = useMemo(() => items.filter(i => i.item_type === "folder").length, [items]);

  const handleItemClick = (item: ExplorerItem, event: React.MouseEvent) => {
    const originalItem = items.find(i => i.path === item.id);
    if (!originalItem) return;

    if (event.shiftKey && lastClickedItem) {
      const fromIndex = explorerItems.findIndex(i => i.id === lastClickedItem.item.id);
      const toIndex = explorerItems.findIndex(i => i.id === item.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        const range = items.slice(start, end + 1);
        selectMultipleCollectionItems(range, { additive: true });
      }
    } else if (event.metaKey || event.ctrlKey) {
      toggleCollectionItemSelection(originalItem);
    } else {
      selectCollectionItem(originalItem);
    }
    focusItem(item);
  };

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
      <ExplorerToolbar
        title={collection.name}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fileCount={fileCount}
        folderCount={folderCount}
        selectedCount={selectedCount}
        isSelectionOpen={isSelectionOpen}
        onToggleSelection={() => setIsSelectionOpen(!isSelectionOpen)}
        disabledViewModes={["column", "grid"]}
      />

      <ExplorerSelectionSheet
        isOpen={isSelectionOpen}
        entries={selectedEntries}
        onClose={() => setIsSelectionOpen(false)}
        onRemove={removeSelection}
        onClear={clearSelections}
      />

      <div className="flex-1 overflow-auto">
        <ExplorerListView
          items={explorerItems}
          viewMode={viewMode}
          selectedIds={selectedItems}
          focusedId={focusedItem?.item.id}
          lastClickedId={lastClickedItem?.item.id}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleActivateItem}
          emptyMessage="No items found in this collection."
          renderItemLabel={({ item, isSelected }) => (
            <CollectionRowLabel
              name={item.name}
              type={item.kind as "file" | "folder"}
              status={item.status as ExplorerItemStatus}
              iconClassName={item.kind === "folder" 
                ? isSelected ? "text-primary-foreground" : "text-primary"
                : isSelected ? "text-primary-foreground" : "text-muted-foreground"
              }
              labelClassName={isSelected ? "text-primary-foreground" : "text-foreground"}
            />
          )}
        />
      </div>
    </div>
  );
};