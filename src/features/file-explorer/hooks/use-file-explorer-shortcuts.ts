import { useEffect } from "react";
import type { ExplorerItem } from "@/types/explorer";

type UseFileExplorerShortcutsOptions = {
  selectedEntries: ExplorerItem[];
  onQuickAdd: (entries: ExplorerItem[]) => void | Promise<void>;
};

export const useFileExplorerShortcuts = ({
  selectedEntries,
  onQuickAdd,
}: UseFileExplorerShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element) {
        const isEditable =
          target.closest(
            'input, textarea, select, [contenteditable="true"], [role="textbox"]',
          ) !== null;
        const isInsideDialog = target.closest('[role="dialog"]') !== null;
        if (isEditable || isInsideDialog) {
          return;
        }
      }

      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod || event.key.toLowerCase() !== "p") {
        return;
      }

      event.preventDefault();
      if (selectedEntries.length === 0) {
        return;
      }

      void onQuickAdd(selectedEntries);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onQuickAdd, selectedEntries]);
};
