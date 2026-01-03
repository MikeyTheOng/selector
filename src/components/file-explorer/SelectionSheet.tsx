import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { resolveResource } from "@tauri-apps/api/path";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileRow } from "@/lib/fs";

type SelectionSheetProps = {
  isOpen: boolean;
  entries: FileRow[];
  onClose: () => void;
  onRemove: (path: string) => void;
  onClear: () => void;
};

export const SelectionSheet = ({
  isOpen,
  entries,
  onClose,
  onRemove,
  onClear,
}: SelectionSheetProps) => {
  const [highlightedPaths, setHighlightedPaths] = useState<Set<string>>(new Set());
  const [dragIconPath, setDragIconPath] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  // Resolve the drag icon path once on mount
  useEffect(() => {
    resolveResource("icons/32x32.png")
      .then((path) => {
        console.log("Drag icon resolved to:", path);
        setDragIconPath(path);
      })
      .catch((err) => console.error("Failed to resolve drag icon:", err));
  }, []);

  // Clear highlights when sheet closes or entries change
  useEffect(() => {
    if (!isOpen) {
      setHighlightedPaths(new Set());
    }
  }, [isOpen]);

  // CMD+A to select all items in the sheet
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "a") {
        e.preventDefault();
        setHighlightedPaths(new Set(entries.map((entry) => entry.path)));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, entries]);

  const toggleHighlight = useCallback((path: string, additive: boolean) => {
    setHighlightedPaths((prev) => {
      const next = new Set(prev);
      if (additive) {
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
      } else {
        // Single click without modifier - select only this item
        if (next.size === 1 && next.has(path)) {
          next.clear();
        } else {
          next.clear();
          next.add(path);
        }
      }
      return next;
    });
  }, []);

  const handleItemClick = useCallback(
    (e: React.MouseEvent, path: string) => {
      // Don't toggle if we just finished dragging
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return;
      }
      toggleHighlight(path, e.metaKey);
    },
    [toggleHighlight]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, entryPath: string) => {
      // Only handle left mouse button, ignore if clicking on remove button
      if (e.button !== 0 || (e.target as HTMLElement).closest("button")) {
        return;
      }

      if (!dragIconPath) {
        console.error("Drag icon not loaded yet");
        return;
      }

      // Determine which files to drag
      const pathsToDrag = highlightedPaths.size > 0 && highlightedPaths.has(entryPath)
        ? Array.from(highlightedPaths)
        : [entryPath];

      console.log("Starting drag with:", pathsToDrag);

      isDraggingRef.current = true;

      startDrag({
        item: pathsToDrag,
        icon: dragIconPath,
      }).catch((err) => {
        console.error("Drag failed:", err);
        isDraggingRef.current = false;
      });
    },
    [highlightedPaths, dragIconPath]
  );

  const highlightedCount = highlightedPaths.size;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex min-h-0 w-1/3 flex-col md:max-w-none"
      >
        <SheetHeader className="border-b border-border/60 pb-3 text-left">
          <SheetTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Selection
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="mt-4 min-h-0 flex-1 pr-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files selected yet.</p>
          ) : (
            <div className="grid gap-2">
              {entries.map((entry) => {
                const isHighlighted = highlightedPaths.has(entry.path);
                return (
                  <div
                    key={entry.path}
                    onClick={(e) => handleItemClick(e, entry.path)}
                    onMouseDown={(e) => handleMouseDown(e, entry.path)}
                    className={`flex min-w-0 cursor-grab items-center gap-3 rounded-lg border px-3 py-2 transition-colors select-none active:cursor-grabbing ${isHighlighted
                      ? "border-accent bg-accent/20"
                      : "border-border/60 bg-card/70 hover:bg-card"
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.path}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(entry.path);
                      }}
                      className="h-7 w-7 shrink-0 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${entry.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full border border-border/50 bg-background/70 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {entries.length} items
            </Badge>
            {highlightedCount > 0 && (
              <Badge
                variant="default"
                className="rounded-full px-2.5 py-0.5 text-xs"
              >
                {highlightedCount} selected
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
