import { ExplorerProvider } from "../context/ExplorerContext";
import { FileExplorerView } from "./FileExplorerView";
import type { LocationItem } from "@/types/fs";

type ExplorerPageProps = {
  locations: LocationItem[];
  folderId: string | null;
  focusItemPath?: string;
  onSelectFolder: (path: string) => void;
};

export const ExplorerPage = ({
  locations,
  folderId,
  focusItemPath,
  onSelectFolder,
}: ExplorerPageProps) => {
  return (
    <ExplorerProvider folderId={folderId} locations={locations} focusItemPath={focusItemPath}>
      <FileExplorerView
        locations={locations}
        folderId={folderId}
        onSelectFolder={onSelectFolder}
      />
    </ExplorerProvider>
  );
};
