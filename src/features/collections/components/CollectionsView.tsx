import { useMemo } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useCollections } from "../hooks/use-collections";
import { useCollectionItems, getFilename } from "../hooks/use-collection-items";
import { DuplicateItemError } from "../errors";
import { collectionItemToExplorerItem } from "../lib/utils";
import { useExplorerViewState } from "@/hooks/explorer/use-explorer-view-state";
import { useExplorerSelection } from "@/hooks/explorer/use-explorer-selection";
import { useNavigation } from "@/hooks/use-navigation";
import { getParentPath } from "@/lib/path-utils";
import { ExplorerListView } from "@/components/explorer/ExplorerListView";
import { CollectionRowLabel } from "./CollectionRowLabel";
import { useExplorerContextMenu } from "@/components/explorer/ExplorerContextMenu";
import { CollectionSelectionSheet } from "./CollectionSelectionSheet";
import { CollectionMoveCopyDialog } from "./CollectionMoveCopyDialog";
import { useMoveCopyDialog } from "@/features/collections/hooks/use-move-copy-dialog";
import type { ExplorerItem, ExplorerItemStatus } from "@/types/explorer";

interface CollectionsViewProps {
  collectionId: string;
  isSelectionOpen: boolean;
  setIsSelectionOpen: (isOpen: boolean) => void;
  selection: ReturnType<typeof useExplorerSelection>;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collectionId,
  isSelectionOpen,
  setIsSelectionOpen,
  selection,
}) => {
  const parsedId = parseInt(collectionId, 10);
  const { collections } = useCollections();
  const { items, isLoading, removeItem, relinkItem, relinkFolder } = useCollectionItems(parsedId);
  const {
    selectedPaths,
    selectedEntries,
    focusedPath,
    lastClickedPath,
    selectItem,
    selectMultiple,
    toggleSelection,
    focusItem,
    removeSelection,
    clearSelections
  } = selection;
  const { viewMode } = useExplorerViewState({ initialViewMode: "list" });
  const { navigateToExplorer } = useNavigation();
  const { showContextMenu } = useExplorerContextMenu();
  const {
    moveCopyState,
    openMoveCopyDialog,
    openMoveDialog,
    openCopyDialog,
    closeMoveCopyDialog,
  } = useMoveCopyDialog();

  const collection = collections.find((c) => c.id === parsedId);

  const handleActivateItem = async (item: ExplorerItem) => {
    if (item.status === "available") {
      if (item.kind === "folder") {
        navigateToExplorer(item.path);
      } else {
        navigateToExplorer(getParentPath(item.path), { focusItemPath: item.path });
      }
      return;
    }

    // For missing/offline items, open the relink dialog
    try {
      const selected = await open({
        multiple: false,
        directory: item.kind === "folder",
        title: `Relink ${item.kind === "folder" ? "Folder" : "File"}: ${item.name}`,
      });

      if (selected && typeof selected === "string") {
        try {
          if (item.kind === "folder") {
            await relinkFolder(item.path, selected);
          } else {
            await relinkItem(item.path, selected);
          }
        } catch (error) {
          let errorMsg = "Failed to relink item.";
          if (error instanceof DuplicateItemError) {
            const filename = getFilename(selected);
            errorMsg = `'${filename}' is already in the target collection.`;
          } 
          toast.error(errorMsg);
        }
      }
    } catch (err) {
      console.error("Failed to relink item:", err);
    }
  };

  const explorerItems = useMemo(() =>
    items.map(collectionItemToExplorerItem),
    [items]);

  const handleItemClick = (item: ExplorerItem, event: React.MouseEvent) => {
    // Find original item logic is mostly needed if we need domain fields not in ExplorerItem
    // But we just need to pass ExplorerItem to selection hooks.
    
    // However, if we needed the original item for some reason, we could find it:
    // const originalItem = items.find(i => i.path === item.path);
    
    // For selection, we just use the item (ExplorerItem) we already have.

    if (event.shiftKey && lastClickedPath) {
      const fromIndex = explorerItems.findIndex(i => i.path === lastClickedPath);
      const toIndex = explorerItems.findIndex(i => i.path === item.path);
      if (fromIndex !== -1 && toIndex !== -1) {
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        // We can just slice from explorerItems since we already have them converted
        const range = explorerItems.slice(start, end + 1);
        selectMultiple(range, { additive: true });
      }
    } else if (event.metaKey || event.ctrlKey) {
      toggleSelection(item);
    } else {
      selectItem(item);
    }
    focusItem(item);
  };

  const handleRemoveItem = async (item: ExplorerItem) => {
    const originalItem = items.find(i => i.path === item.path);
    if (originalItem) {
      await removeItem(originalItem.id);
    }
  };

  const getContextMenuItems = (item: ExplorerItem) => [
    {
      type: "item" as const,
      id: "reveal",
      text: "Reveal in Explorer",
      enabled: item.status === "available",
      action: () => {
        console.log("Reveal in Explorer:", item.path);
        if (item.kind === "folder") {
          navigateToExplorer(item.path);
        } else {
          navigateToExplorer(getParentPath(item.path), { focusItemPath: item.path });
        }
      },
    },
    {
      type: "separator" as const,
    },
    {
      type: "item" as const,
      id: "move",
      text: "Move to...",
      enabled: item.status === "available",
      action: () => openMoveDialog([item]),
    },
    {
      type: "item" as const,
      id: "copy",
      text: "Copy to...",
      enabled: item.status === "available",
      action: () => openCopyDialog([item]),
    },
    {
      type: "item" as const,
      id: "remove",
      text: "Remove from Collection",
      action: () => handleRemoveItem(item),
    },
    {
      type: "separator" as const,
    },
    {
      type: "item" as const,
      id: "import",
      text: "Import to Lightroom",
      enabled: false,
      action: () => { },
    },
  ];

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
      <CollectionSelectionSheet
        collectionId={parsedId}
        isOpen={isSelectionOpen}
        entries={selectedEntries}
        onClose={() => setIsSelectionOpen(false)}
        onRemove={removeSelection}
        onClear={clearSelections}
        onRequestCopy={(entries) => openMoveCopyDialog("copy", entries)}
        onRequestMove={(entries) => openMoveCopyDialog("move", entries)}
      />

      <CollectionMoveCopyDialog
        collectionId={parsedId}
        entries={moveCopyState?.entries ?? []}
        mode={moveCopyState?.mode ?? "copy"}
        isOpen={moveCopyState !== null}
        onClose={closeMoveCopyDialog}
      />

      <div className="flex-1 overflow-auto">
        <ExplorerListView
          items={explorerItems}
          viewMode={viewMode}
          // Mapping back to what ExplorerListView (currently broken) expects
          // selectedIds expects Record<string, ExplorerItem> -> selectedPaths fits this signature!
          selectedIds={selectedPaths} 
          // focusedId expects string -> focusedPath fits
          focusedId={focusedPath}
          // lastClickedId expects string -> lastClickedPath fits
          lastClickedId={lastClickedPath}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleActivateItem}
          emptyMessage="No items found in this collection."
          onItemContextMenu={(item) => {
            showContextMenu(getContextMenuItems(item));
          }}
          onContextMenu={(e) => e.preventDefault()}
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