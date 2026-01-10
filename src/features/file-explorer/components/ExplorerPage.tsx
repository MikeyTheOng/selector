import { ExplorerProvider } from "../context/ExplorerContext";
import type { ComponentType } from "react";
import { FileExplorerView } from "./FileExplorerView";
import type { LocationItem } from "@/types/fs";
import type { ExplorerSelectionPanelProps } from "@/components/explorer/ExplorerSelectionPanel";

type ExplorerPageProps = {
  locations: LocationItem[];
  folderId: string | null;
  focusItemPath?: string;
  onSelectFolder: (path: string) => void;
  SelectionPanel: ComponentType<ExplorerSelectionPanelProps>;
};

export const ExplorerPage = ({
  locations,
  folderId,
  focusItemPath,
  onSelectFolder,
  SelectionPanel,
}: ExplorerPageProps) => {
  return (
    <ExplorerProvider folderId={folderId} locations={locations} focusItemPath={focusItemPath}>
      <FileExplorerView
        locations={locations}
        folderId={folderId}
        onSelectFolder={onSelectFolder}
        SelectionPanel={SelectionPanel}
      />
    </ExplorerProvider>
  );
};
