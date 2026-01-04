import { useCallback, useState } from "react";
import { Loader2, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { FileRow } from "@/types/fs";

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
  const [isImporting, setIsImporting] = useState(false);

  const handleImportToLrc = useCallback(async () => {
    if (entries.length === 0) return;
    setIsImporting(true);
    const paths = entries.map((entry) => entry.path);
    try {
      await invoke("import_to_lrc", { files: paths });
    } catch (err) {
      console.error("Failed to import to Lightroom Classic:", err);
    } finally {
      setIsImporting(false);
    }
  }, [entries]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex min-h-0 w-1/3 flex-col md:max-w-none"
      >
        <SheetHeader className="cursor-default select-none border-b border-border/60 pb-3 text-left">
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
                    <p className="cursor-default select-text truncate text-sm font-medium text-foreground">
                      {entry.name}
                    </p>
                    <p className="cursor-default select-text truncate text-xs text-muted-foreground">
                      {entry.path}
                    </p>
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
            onClick={handleImportToLrc}
            disabled={entries.length === 0 || isImporting}
            className={`w-full ${isImporting ? "cursor-wait" : "cursor-pointer"}`}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import to LrC"
            )}
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
