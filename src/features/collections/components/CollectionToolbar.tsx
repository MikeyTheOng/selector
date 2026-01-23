import { useMemo } from "react";
import { CheckSquare, ExternalLink, Loader2 } from "lucide-react";
import { CollectionBreadcrumb } from "./CollectionBreadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExplorerSelection } from "@/hooks/explorer/use-explorer-selection";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExportResolutionModal } from "./ExportResolutionModal";
import { RecentAppsPicker } from "@/components/explorer/RecentAppsPicker";
import { useCollectionItems } from "../hooks/use-collection-items";
import { collectionItemToExplorerItem } from "../lib/utils";
import { useOpenWith } from "../hooks/use-open-with";

interface CollectionToolbarProps {
  collectionId: string;
  isSelectionOpen: boolean;
  onToggleSelection: () => void;
  selection: ReturnType<typeof useExplorerSelection>;
}

export function CollectionToolbar({
  collectionId,
  isSelectionOpen,
  onToggleSelection,
  selection,
}: CollectionToolbarProps) {
  const parsedId = parseInt(collectionId, 10);
  const { items } = useCollectionItems(parsedId);
  const entries = useMemo(
    () => items.map(collectionItemToExplorerItem),
    [items],
  );
  const {
    handleOpenWith,
    handleResolutionProceed,
    handleResolutionClose,
    handleAppSelected,
    handleAppPickerClose,
    isProcessing,
    isOpenWithDisabled,
    showAppPicker,
    pickerExtension,
    pickerFilePaths,
    showResolutionModal,
  } = useOpenWith(entries);
  const { selectedEntries } = selection;
  const selectedCount = selectedEntries.length;
  const hasSelection = selectedCount > 0;

  return (
    <>
      <div className="flex h-12 items-center justify-between border-b border-border/50 bg-background/40 px-4">
        <div className="flex items-center gap-3">
          {collectionId ? (
            <CollectionBreadcrumb collectionId={parsedId} />
          ) : (
            <div className="text-sm font-medium text-muted-foreground">
              Collections
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasSelection ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isSelectionOpen ? "secondary" : "ghost"}
                  size="sm"
                  className="relative h-8 w-8 p-0"
                  onClick={onToggleSelection}
                  aria-label="Selection"
                >
                  <CheckSquare className="h-4 w-4" />
                  <Badge
                    variant="secondary"
                    className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[9px]"
                  >
                    {selectedCount}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Manage {selectedCount} selection{selectedCount === 1 ? "" : "s"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleOpenWith}
                  disabled={isOpenWithDisabled}
                  aria-label={isProcessing ? "Opening..." : "Open with..."}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Open collection in another app
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

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
}
