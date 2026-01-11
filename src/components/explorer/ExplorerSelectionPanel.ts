import type { ExplorerItem } from "@/types/explorer";

export type ExplorerSelectionPanelProps = {
  selectedCount: number;
  entries: ExplorerItem[];
  onRemoveSelection: (id: string) => void;
  onClearAllSelections: () => void;
};
