import { ExplorerProvider } from "../context/ExplorerContext";
import type { ComponentType } from "react";
import { FileExplorerView } from "./FileExplorerView";
import type { ExplorerItem, LocationItem } from "@/types/explorer";
import type { ExplorerSelectionPanelProps } from "@/components/explorer/ExplorerSelectionPanel";
import type { FavoriteLocationItem } from "../types";

type FileExplorerPageProps = {
  locations: LocationItem[];
  favorites: FavoriteLocationItem[];
  folderId: string | null;
  focusItemPath?: string;
  onSelectFolder: (path: string) => void;
  onAddFavorite: (path: string) => void;
  onRemoveFavorite: (path: string) => void;
  onQuickAdd: (entries: ExplorerItem[]) => void | Promise<void>;
  SelectionPanel: ComponentType<ExplorerSelectionPanelProps>;
};

export const FileExplorerPage = ({
  locations,
  favorites,
  folderId,
  focusItemPath,
  onSelectFolder,
  onAddFavorite,
  onRemoveFavorite,
  onQuickAdd,
  SelectionPanel,
}: FileExplorerPageProps) => {
  return (
    <ExplorerProvider folderId={folderId} locations={locations} focusItemPath={focusItemPath}>
      <FileExplorerView
        locations={locations}
        favorites={favorites}
        folderId={folderId}
        onSelectFolder={onSelectFolder}
        onAddFavorite={onAddFavorite}
        onRemoveFavorite={onRemoveFavorite}
        onQuickAdd={onQuickAdd}
        SelectionPanel={SelectionPanel}
      />
    </ExplorerProvider>
  );
};
