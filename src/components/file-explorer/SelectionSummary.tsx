import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileRow } from "@/lib/fs";

type SelectionSummaryProps = {
  entries: FileRow[];
  onRemove: (path: string) => void;
};

export const SelectionSummary = ({ entries, onRemove }: SelectionSummaryProps) => (
  <div className="border-t border-border/60 px-4 py-3">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Selection
      </span>
      <Badge
        variant="secondary"
        className="rounded-full border border-border/50 bg-background/70 px-2.5 py-0.5 text-xs text-muted-foreground"
      >
        {entries.length} items
      </Badge>
    </div>
    {entries.length === 0 ? (
      <p className="mt-2 text-sm text-muted-foreground">No files selected yet.</p>
    ) : (
      <div className="mt-3 grid gap-2">
        {entries.slice(0, 6).map((entry) => (
          <div
            key={entry.path}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
              <p className="truncate text-xs text-muted-foreground">{entry.path}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(entry.path)}
              className="ml-3 h-7 w-7 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${entry.name}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {entries.length > 6 ? (
          <p className="text-xs text-muted-foreground">
            +{entries.length - 6} more selected files
          </p>
        ) : null}
      </div>
    )}
  </div>
);
