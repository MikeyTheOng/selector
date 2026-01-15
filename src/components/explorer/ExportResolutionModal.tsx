import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { ExplorerItem } from "@/types/explorer";
import {
  useExportResolution,
  type ExportResolutionStrategy,
} from "@/features/collections/hooks/use-export-resolution";
import type { FileKind } from "@/lib/file-types";

interface ExportResolutionModalProps {
  isOpen: boolean;
  entries: ExplorerItem[];
  onProceed: (resolvedPaths: string[]) => void;
  onClose: () => void;
}

const kindLabels: Record<FileKind, string> = {
  image: "Images",
  video: "Videos",
  document: "Documents",
};

export const ExportResolutionModal = ({
  isOpen,
  entries,
  onProceed,
  onClose,
}: ExportResolutionModalProps) => {
  const {
    resolutionStrategy,
    setResolutionStrategy,
    fileKindSelection,
    toggleFileKind,
    resolvedPaths,
    fileKindCounts,
    isEmpty,
    isLoading,
  } = useExportResolution(entries);

  const kindOptions = useMemo(
    () =>
      (Object.keys(kindLabels) as FileKind[])
        .map((kind) => ({
          kind,
          label: kindLabels[kind],
          count: fileKindCounts[kind],
        }))
        .filter((option) => option.count > 0),
    [fileKindCounts],
  );

  const showKindFilters = kindOptions.length > 1;
  const resolvedCountLabel = `${resolvedPaths.length} item${resolvedPaths.length === 1 ? "" : "s"}`;
  const isProceedDisabled =
    !resolutionStrategy || isLoading || resolvedPaths.length === 0;

  const handleResolutionChange = (value: string) => {
    if (!value) return;
    setResolutionStrategy(value as ExportResolutionStrategy);
  };

  const handleProceed = () => {
    if (isProceedDisabled) return;
    onProceed(resolvedPaths);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve selection</DialogTitle>
          <DialogDescription>
            Choose how you want to export mixed files and folders.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <RadioGroup
            value={resolutionStrategy ?? ""}
            onValueChange={handleResolutionChange}
            className="gap-2"
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 p-3 text-left">
              <RadioGroupItem value="files-only" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Files only</p>
                <p className="text-xs text-muted-foreground">
                  Include top-level files and ignore folders.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 p-3 text-left">
              <RadioGroupItem value="folders-only" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Folders only</p>
                <p className="text-xs text-muted-foreground">
                  Export folder references only.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 p-3 text-left">
              <RadioGroupItem value="expand-folders" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Expand folders</p>
                <p className="text-xs text-muted-foreground">
                  Recursively include all files inside folders.
                </p>
              </div>
            </label>
          </RadioGroup>

          {showKindFilters && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Filter by kind
              </p>
              <div className="flex flex-wrap gap-3">
                {kindOptions.map((option) => (
                  <label
                    key={option.kind}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={fileKindSelection[option.kind]}
                      onCheckedChange={() => toggleFileKind(option.kind)}
                    />
                    <span>
                      {option.label} ({option.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{resolvedCountLabel}</span>
            {isLoading && <span>Resolving...</span>}
          </div>

          {isEmpty && (
            <p className="text-sm text-destructive">
              No files match your selection
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleProceed}
            disabled={isProceedDisabled}
          >
            Open with...
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
