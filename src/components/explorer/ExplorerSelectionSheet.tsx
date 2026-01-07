import { useCallback, useState } from "react";
import { Loader2, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ExplorerItem } from "@/types/explorer";

export interface ExplorerSelectionSheetProps {
  isOpen: boolean;
  entries: ExplorerItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Optional slot for injecting external action UI (e.g., Collections widget) */
  renderActions?: (entries: ExplorerItem[]) => React.ReactNode;
  /** Optional label for the main action button */
  actionLabel?: string;
  /** Optional callback for the main action button */
  onAction?: (entries: ExplorerItem[]) => Promise<void>;
  /** Optional additional class names */
  className?: string;
}

export const ExplorerSelectionSheet = ({
  isOpen,
  entries,
  onClose,
  onRemove,
  onClear,
  renderActions,
  actionLabel = "Import to LrC",
  onAction,
}: ExplorerSelectionSheetProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = useCallback(async () => {
    if (entries.length === 0) return;
    setIsProcessing(true);
    
    try {
      if (onAction) {
        await onAction(entries);
      } else {
        // Fallback to default LrC import if no action provided (maintaining current behavior)
        const paths = entries.map((entry) => entry.path);
        await invoke("import_to_lrc", { files: paths });
      }
    } catch (err) {
      console.error("SelectionSheet action failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [entries, onAction]);

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
            <p className="text-sm text-muted-foreground">No items selected yet.</p>
          ) : (
            <div className="grid gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
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
                      onRemove(entry.id);
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
          {/* External actions slot (e.g., Collections widget) */}
          {renderActions?.(entries)}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAction}
            disabled={entries.length === 0 || isProcessing}
            className={`w-full ${isProcessing ? "cursor-wait" : "cursor-pointer"}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              actionLabel
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
