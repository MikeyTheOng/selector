import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { ExplorerItem, ExplorerViewMode } from "@/types/explorer";

interface QuickLookEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

type KeyEvent =
  | KeyboardEvent
  | {
      key: string;
      preventDefault: () => void;
      metaKey?: boolean;
      ctrlKey?: boolean;
      shiftKey?: boolean;
    };

type UseExplorerShortcutsOptions = {
  getCurrentViewItems: () => ExplorerItem[];
  selectMultiple: (
    items: ExplorerItem[],
    options?: { additive?: boolean },
  ) => void;
  clearSelections: () => void;
  clearFocus: () => void;
  focusedPath: string | null;
  viewMode: ExplorerViewMode;
  folderId: string | null;
  onSelectFolder: (path: string) => void;
  focusItem: (item: ExplorerItem) => void;
  toggleSelection: (item: ExplorerItem) => void;
  selectRange: (
    from: ExplorerItem,
    to: ExplorerItem,
    allItems: ExplorerItem[],
  ) => void;
  lastClickedPath: string | null;
  isPreviewActive: boolean;
  togglePreview: (path: string) => void;
  closePreview: () => void;
};

export const useExplorerShortcuts = ({
  getCurrentViewItems,
  selectMultiple,
  clearSelections,
  clearFocus,
  focusedPath,
  viewMode,
  folderId,
  onSelectFolder,
  focusItem,
  toggleSelection,
  selectRange,
  lastClickedPath,
  isPreviewActive,
  togglePreview,
  closePreview,
}: UseExplorerShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyEvent) => {
      if ("target" in event && event.target instanceof Element) {
        const target = event.target;
        const isEditable =
          target.closest(
            'input, textarea, select, [contenteditable="true"], [role="textbox"]',
          ) !== null;
        const isInsideDialog = target.closest('[role="dialog"]') !== null;
        if (isEditable || isInsideDialog) {
          return;
        }
      }

      // ESC key
      if (event.key === "Escape") {
        event.preventDefault();
        if (isPreviewActive) {
          closePreview();
        } else {
          clearSelections();
          clearFocus();
        }
        return;
      }

      // Space key
      if (event.key === " " && focusedPath) {
        event.preventDefault();
        togglePreview(focusedPath);
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const currentItems = getCurrentViewItems();

      // Cmd/Ctrl+Enter: Toggle selection of focused item
      if (isMod && event.key === "Enter") {
        event.preventDefault();
        if (focusedPath) {
          const item = currentItems.find((i) => i.path === focusedPath);
          if (item) {
            toggleSelection(item);
          }
        }
        return;
      }

      // Cmd/Ctrl+A: Select all items
      if (isMod && event.key.toLowerCase() === "a") {
        event.preventDefault();
        if (currentItems.length > 0) {
          selectMultiple(currentItems, { additive: true });
        }
        return;
      }

      // Navigation Logic
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(
          event.key,
        )
      ) {
        if (currentItems.length === 0 && viewMode === "list") return;

        if (viewMode === "list") {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            let nextIndex = -1;

            if (!focusedPath) {
              nextIndex = event.key === "ArrowUp" ? currentItems.length - 1 : 0;
            } else {
              const currentIndex = currentItems.findIndex(
                (i) => i.path === focusedPath,
              );
              if (event.key === "ArrowUp") {
                nextIndex = Math.max(0, currentIndex - 1);
              } else {
                nextIndex = Math.min(currentItems.length - 1, currentIndex + 1);
              }
            }

            if (nextIndex !== -1) {
              const nextItem = currentItems[nextIndex];
              if (isShift && lastClickedPath) {
                // Find anchor in current items
                const anchorItem = currentItems.find(
                  (i) => i.path === lastClickedPath,
                );
                if (anchorItem) {
                  selectRange(anchorItem, nextItem, currentItems);
                }
                focusItem(nextItem);
              } else {
                focusItem(nextItem);
              }
            }
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (focusedPath) {
              const item = currentItems.find((i) => i.path === focusedPath);
              if (item && item.kind === "folder") {
                onSelectFolder(item.path);
              }
            }
          }
        } else if (viewMode === "column") {
          // Column View keyboard navigation
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            // Go up to parent folder
            if (folderId) {
              const segments = folderId.split("/").filter(Boolean);
              if (segments.length > 1) {
                const parentPath = "/" + segments.slice(0, -1).join("/");
                onSelectFolder(parentPath);
              } else if (segments.length === 1) {
                // Volume root -> root
                onSelectFolder("/");
              }
            }
          } else if (event.key === "ArrowRight" || event.key === "Enter") {
            event.preventDefault();
            if (focusedPath) {
              const item = currentItems.find((i) => i.path === focusedPath);
              if (item && item.kind === "folder") {
                onSelectFolder(item.path);
              }
            }
          } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();

            if (currentItems.length === 0) return;

            let nextIndex = -1;
            // Check if focused item is in current list (active column)
            // If focusedPath is set but not in currentItems, it means focus is in another column.
            // In that case, we should probably start from 0 or keep focus there?
            // Standard Finder behavior: up/down moves in active column.

            const currentIndex = focusedPath
              ? currentItems.findIndex((i) => i.path === focusedPath)
              : -1;

            if (currentIndex === -1) {
              // Focus not in current column, start fresh
              nextIndex = event.key === "ArrowUp" ? currentItems.length - 1 : 0;
            } else {
              if (event.key === "ArrowUp") {
                nextIndex = Math.max(0, currentIndex - 1);
              } else {
                nextIndex = Math.min(currentItems.length - 1, currentIndex + 1);
              }
            }

            if (nextIndex !== -1) {
              const nextItem = currentItems[nextIndex];
              if (isShift && lastClickedPath) {
                const anchorItem = currentItems.find(
                  (i) => i.path === lastClickedPath,
                );
                if (anchorItem) {
                  selectRange(anchorItem, nextItem, currentItems);
                }
                focusItem(nextItem);
              } else {
                focusItem(nextItem);
              }
            }
          }
        }
        return;
      }
    };

    const setupListeners = async () => {
      const unlisten = await listen<QuickLookEvent>(
        "quicklook://navigate",
        (event) => {
          const { key: rawKey, metaKey, ctrlKey, shiftKey } = event.payload;
          const key = rawKey === "Space" ? " " : rawKey;
          handleKeyDown({
            key,
            preventDefault: () => {},
            metaKey,
            ctrlKey,
            shiftKey,
          });
        },
      );
      return unlisten;
    };

    const unlistenPromise = setupListeners();

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unlistenPromise.then((fn) => fn());
    };
  }, [
    getCurrentViewItems,
    selectMultiple,
    clearSelections,
    clearFocus,
    focusedPath,
    viewMode,
    folderId,
    onSelectFolder,
    focusItem,
    toggleSelection,
    selectRange,
    lastClickedPath,
    isPreviewActive,
    togglePreview,
    closePreview,
  ]);
};
