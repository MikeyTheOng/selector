import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExportResolutionModal } from "./ExportResolutionModal";
import { detectAmbiguity } from "@/features/collections/lib/export-resolution";
import { getExtension } from "@/lib/formatters";
import {
  getFileCountLabel,
  getFirstExtension,
  groupFilesByMediaType,
} from "@/lib/file-groups";
import { addRecentApp } from "@/lib/recent-apps";
import type { ExplorerItem } from "@/types/explorer";
import { invoke } from "@tauri-apps/api/core";
import { ChevronUp, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { RecentAppsPicker } from "./RecentAppsPicker";

const getExtensionForPaths = (paths: string[]) => {
  for (const path of paths) {
    const name = path.split("/").filter(Boolean).pop() ?? path;
    const extension = getExtension(name);
    if (extension) {
      return extension;
    }
  }
  return undefined;
};

export interface ExplorerSelectionSheetProps {
  isOpen: boolean;
  entries: ExplorerItem[];
  onClose: () => void;
  onRemove: (path: string) => void;
  onClear: () => void;
  /** Optional slot for injecting external action UI (e.g., Collections widget) */
  renderActions?: (entries: ExplorerItem[]) => React.ReactNode;
  /** Optional additional class names */
  className?: string;
}

type OpenWithMode = "all" | "images" | "videos";

export const ExplorerSelectionSheet = ({
  isOpen,
  entries,
  onClose,
  onRemove,
  onClear,
  renderActions,
}: ExplorerSelectionSheetProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [pickerExtension, setPickerExtension] = useState<string>("");
  const [pickerFilePaths, setPickerFilePaths] = useState<string[]>([]);
  const [pendingAppName, setPendingAppName] = useState<string>("");
  const [showResolutionModal, setShowResolutionModal] = useState(false);

  const grouped = groupFilesByMediaType(entries);

  const openAppPicker = useCallback((paths: string[], extension?: string) => {
    if (paths.length === 0) {
      toast.error("No files selected");
      return;
    }

    const resolvedExtension = extension ?? getExtensionForPaths(paths) ?? "folder";
    setPickerExtension(resolvedExtension);
    setPickerFilePaths(paths);
    setShowAppPicker(true);
  }, []);

  const handleOpenWith = useCallback(
    async (mode: OpenWithMode) => {
      let filesToOpen: ExplorerItem[] = [];
      let extension: string | undefined;

      switch (mode) {
        case "all":
          if (detectAmbiguity(entries).isAmbiguous) {
            setShowResolutionModal(true);
            return;
          }
          filesToOpen = entries;
          extension = getFirstExtension(entries);
          break;
        case "images":
          filesToOpen = grouped.images.files;
          extension = Array.from(grouped.images.extensions)[0];
          break;
        case "videos":
          filesToOpen = grouped.videos.files;
          extension = Array.from(grouped.videos.extensions)[0];
          break;
      }

      openAppPicker(
        filesToOpen.map((file) => file.path),
        extension,
      );
    },
    [entries, grouped, openAppPicker],
  );

  const handleResolutionProceed = useCallback(
    (resolvedPaths: string[]) => {
      setShowResolutionModal(false);
      openAppPicker(resolvedPaths);
    },
    [openAppPicker],
  );

  const handleResolutionClose = useCallback(() => {
    setShowResolutionModal(false);
  }, []);

  const handleAppSelected = useCallback(
    async (appPath: string, appName: string, bundleId?: string) => {
      setShowAppPicker(false);
      setIsProcessing(true);
      setPendingAppName(appName);

      try {
        const targetApp = bundleId || appPath;

        await invoke("open_files_with_app", {
          filePaths: pickerFilePaths,
          appPath: targetApp,
        });

        addRecentApp(pickerExtension, {
          name: appName,
          path: appPath,
          bundleId,
        });

        toast.success(
          `Opened ${pickerFilePaths.length} file${pickerFilePaths.length === 1 ? "" : "s"} with ${appName}`,
        );
      } catch (err) {
        console.error("Failed to open files:", err);
        toast.error(`Failed to open files with ${appName}`);
      } finally {
        setIsProcessing(false);
        setPendingAppName("");
      }
    },
    [pickerFilePaths, pickerExtension],
  );

  const handleAppPickerClose = useCallback(() => {
    setShowAppPicker(false);
  }, []);

  const showDropdown = grouped.hasMultipleTypes;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="flex min-h-0 w-1/3 flex-col md:max-w-none"
        >
          <SheetHeader className="cursor-default select-none border-b border-border/60 pb-3 text-left">
            <SheetTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Selection
            </SheetTitle>
            <SheetDescription className="sr-only">
              Manage your selected items
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="mt-4 min-h-0 flex-1 pr-3">
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No items selected yet.
              </p>
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
            {renderActions?.(entries)}

            {showDropdown ? (
              <ButtonGroup className="w-full">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenWith("all")}
                  disabled={entries.length === 0 || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening{pendingAppName ? ` with ${pendingAppName}` : ""}
                      ...
                    </>
                  ) : (
                    `Open All with...`
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={entries.length === 0 || isProcessing}
                      className="w-auto px-2"
                    >
                      <ChevronUp className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {grouped.hasImages && (
                      <DropdownMenuItem
                        onClick={() => handleOpenWith("images")}
                      >
                        Open Photos with... (
                        {getFileCountLabel(
                          grouped.images.files.length,
                          "image",
                        )}
                        )
                      </DropdownMenuItem>
                    )}
                    {grouped.hasVideos && (
                      <DropdownMenuItem
                        onClick={() => handleOpenWith("videos")}
                      >
                        Open Videos with... (
                        {getFileCountLabel(
                          grouped.videos.files.length,
                          "video",
                        )}
                        )
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleOpenWith("all")}
                disabled={entries.length === 0 || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening{pendingAppName ? ` with ${pendingAppName}` : ""}...
                  </>
                ) : (
                  "Open All with..."
                )}
              </Button>
            )}

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

      <RecentAppsPicker
        isOpen={showAppPicker}
        extension={pickerExtension}
        filePaths={pickerFilePaths}
        onAppSelected={handleAppSelected}
        onClose={handleAppPickerClose}
      />

      <ExportResolutionModal
        isOpen={showResolutionModal}
        entries={entries}
        onProceed={handleResolutionProceed}
        onClose={handleResolutionClose}
      />
    </>
  );
};
