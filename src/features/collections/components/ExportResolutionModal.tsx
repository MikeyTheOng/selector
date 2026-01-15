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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ExplorerItem } from "@/types/explorer";
import {
  useExportResolution,
  type ExportResolutionStrategy,
} from "../hooks/use-export-resolution";
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

  const resolutionOptions: Array<{
    id: string;
    value: ExportResolutionStrategy;
    title: string;
    description: string;
  }> = [
    {
      id: "export-resolution-files-only",
      value: "files-only",
      title: "Files only",
      description: "Include top-level files and ignore folders.",
    },
    {
      id: "export-resolution-folders-only",
      value: "folders-only",
      title: "Folders only",
      description: "Export folder references only.",
    },
    {
      id: "export-resolution-expand-folders",
      value: "expand-folders",
      title: "Expand folders",
      description: "Recursively include all files inside folders.",
    },
  ];

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
            {resolutionOptions.map((option) => (
              <label
                key={option.value}
                htmlFor={option.id}
                className="block text-left"
              >
                <Card
                  className={[
                    "cursor-pointer py-0 transition-colors",
                    resolutionStrategy === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:bg-muted/30",
                  ].join(" ")}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem id={option.id} value={option.value} />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{option.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </label>
            ))}
          </RadioGroup>

          {showKindFilters && (
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Include file types
              </p>
              <div className="grid gap-2 md:grid-cols-3">
                {kindOptions.map((option) => (
                  <label
                    key={option.kind}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Checkbox
                      checked={fileKindSelection[option.kind]}
                      onCheckedChange={() => toggleFileKind(option.kind)}
                    />
                    {option.label}
                    <span className="text-xs text-muted-foreground">
                      ({option.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md border border-border/60 p-3 text-xs text-muted-foreground">
            {isLoading
              ? "Resolving files..."
              : `${resolvedCountLabel} selected`}
          </div>

          {isEmpty && (
            <Alert variant="destructive">
              <AlertTitle>No files selected to export</AlertTitle>
              <AlertDescription>
                Your current filters exclude all files. Adjust the resolution
                option (Files only / Folders only / Expand folders) or re-enable
                file types above, then click “Open with…” to export to another
                app.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
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
