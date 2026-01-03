import { useCallback, useEffect, useState } from "react";
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
  const [dragIconPath, setDragIconPath] = useState<string | null>(null);

  // Resolve the drag icon path once on mount
  useEffect(() => {
    resolveResource("icons/32x32.png")
      .then((path) => {
        console.log("Drag icon resolved to:", path);
        setDragIconPath(path);
      })
      .catch((err) => console.error("Failed to resolve drag icon:", err));
  }, []);

  const handleDragToLightroom = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || entries.length === 0) return;

      if (!dragIconPath) {
        console.error("Drag icon not loaded yet");
        return;
      }

      const paths = entries.map((entry) => entry.path);
      startDrag({
        item: paths,
        icon: dragIconPath,
      }).catch((err) => {
        console.error("Drag failed:", err);
      });
    },
    [entries, dragIconPath]
  );

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
              {entries.map((entry) => (
                <div
                  key={entry.path}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-border/60 bg-card/70 px-3 py-2 transition-colors hover:bg-card"
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
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-3">
          <Button
            type="button"
            variant="default"
            size="sm"
            onMouseDown={handleDragToLightroom}
            disabled={entries.length === 0}
            className="w-full cursor-grab active:cursor-grabbing"
          >
            Drag to Import
          </Button>
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className="rounded-full border border-border/50 bg-background/70 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {entries.length} items
            </Badge>
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
