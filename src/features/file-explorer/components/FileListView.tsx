import { useMemo } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { FileRowLabel } from "./FileRowLabel";
import { ExplorerListView } from "@/components/explorer/ExplorerListView";
import { useExplorerContextMenu } from "@/components/explorer/ExplorerContextMenu";
import type { ContextMenuItemDef } from "@/components/explorer/ExplorerContextMenu";
import { fileRowToExplorerItem, folderRowToExplorerItem } from "@/lib/explorer-utils";
import type { FolderListing, ExplorerItem, ExplorerViewMode } from "@/types/explorer";
import type { FavoriteLocationItem } from "../types";
import { normalizeFavoritePath } from "../lib/favorites-service";

type FileListViewProps = {
  listing: FolderListing;
  favorites: FavoriteLocationItem[];
  selectedPaths: Record<string, ExplorerItem>;
  lastClickedPath: string | null;
  focusedPath: string | null;
  viewMode?: ExplorerViewMode;
  onSelectFolder: (path: string) => void;
  onSelectItem: (item: ExplorerItem, options?: { additive?: boolean }) => void;
  onSelectRange: (from: ExplorerItem, to: ExplorerItem, allItems: ExplorerItem[]) => void;
  onFocusItem: (item: ExplorerItem) => void;
  onToggleSelection: (item: ExplorerItem) => void;
  onActivateItem?: (item: ExplorerItem) => void;
  onAddFavorite: (path: string) => void;
  onRemoveFavorite: (path: string) => void;
};

export const FileListView = ({
  listing,
  favorites,
  selectedPaths,
  lastClickedPath,
  focusedPath,
  viewMode = "list",
  onSelectFolder,
  onSelectItem,
  onSelectRange,
  onFocusItem,
  onToggleSelection,
  onActivateItem,
  onAddFavorite,
  onRemoveFavorite,
}: FileListViewProps) => {
  const { showContextMenu } = useExplorerContextMenu();

  const explorerItems = useMemo(
    () => [
      ...listing.folders.map(folderRowToExplorerItem),
      ...listing.files.map(fileRowToExplorerItem),
    ],
    [listing],
  );

  const favoritesByPath = useMemo(() => {
    const map = new Map<string, FavoriteLocationItem>();
    favorites.forEach((favorite) => {
      const normalized = normalizeFavoritePath(favorite.path);
      if (!normalized || map.has(normalized)) {
        return;
      }
      map.set(normalized, favorite);
    });
    return map;
  }, [favorites]);

  const getContextMenuItems = (item: ExplorerItem): ContextMenuItemDef[] => {
    const items: ContextMenuItemDef[] = [
      {
        type: "item" as const,
        id: "reveal-in-finder",
        text: "Reveal in Finder",
        enabled: item.status === "available",
        action: () => {
          revealItemInDir(item.path).catch((error) => {
            console.error("Failed to reveal item:", error);
          });
        },
      },
    ];

    if (item.kind === "folder") {
      const normalized = normalizeFavoritePath(item.path);
      if (normalized) {
        const favorite = favoritesByPath.get(normalized);
        items.push({ type: "separator" as const });
        if (!favorite) {
          items.push({
            type: "item" as const,
            id: "add-to-favorites",
            text: "Add to Favorites",
            enabled: item.status === "available",
            action: () => onAddFavorite(normalized),
          });
        } else {
          items.push({
            type: "item" as const,
            id: "remove-from-favorites",
            text: "Remove from Favorites",
            enabled: favorite.favoriteType === "custom",
            action: () => onRemoveFavorite(normalized),
          });
        }
      }
    }

    return items;
  };

  const handleItemClick = (item: ExplorerItem, event: React.MouseEvent) => {
    // Shift+click for range selection
    if (event.shiftKey && lastClickedPath) {
      const fromItem = explorerItems.find(i => i.path === lastClickedPath);
      if (fromItem) {
        onSelectRange(fromItem, item, explorerItems);
        onFocusItem(item);
        return;
      }
    }

    if (event.metaKey || event.ctrlKey) {
      onToggleSelection(item);
    } else {
      onSelectItem(item);
    }
    onFocusItem(item);
  };

  const handleItemDoubleClick = (item: ExplorerItem) => {
    if (item.status === "missing" || item.status === "offline") {
      onActivateItem?.(item);
      return;
    }

    if (item.kind === "folder") {
      onSelectFolder(item.path);
    } else if (onActivateItem) {
      onActivateItem(item);
    }
  };

  return (
    <ExplorerListView
      items={explorerItems}
      viewMode={viewMode}
      selectedPaths={selectedPaths}
      lastClickedPath={lastClickedPath}
      focusedPath={focusedPath}
      onItemClick={handleItemClick}
      onItemDoubleClick={handleItemDoubleClick}
      onItemContextMenu={(item) => {
        showContextMenu(getContextMenuItems(item));
      }}
      onContextMenu={(e) => e.preventDefault()}
      emptyMessage="No items found in this folder."
      renderItemLabel={({ item, isSelected }) => (
        <FileRowLabel
          name={item.name}
          type={item.kind}
          iconClassName={item.kind === "folder" 
            ? isSelected ? "text-primary-foreground" : "text-primary"
            : isSelected ? "text-primary-foreground" : "text-muted-foreground"
          }
          labelClassName={isSelected ? "text-primary-foreground" : "text-foreground"}
        />
      )}
    />
  );
};
