import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import { AddToCollectionDialog } from "./AddToCollectionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExplorerSelectionPanelProps } from "@/components/explorer/ExplorerSelectionPanel";

export const AddToCollectionSelectionPanel = ({
  selectedCount,
  entries,
}: ExplorerSelectionPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedCount === 0) {
      setIsOpen(false);
    }
  }, [selectedCount]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={selectedCount === 0}
        className="h-8 gap-2 border-border/50 px-3 py-1 text-xs font-semibold"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        Add to Collection
        {selectedCount > 0 && (
          <Badge
            variant="secondary"
            className="h-5 min-w-5 justify-center px-1 text-[10px]"
          >
            {selectedCount}
          </Badge>
        )}
      </Button>
      <AddToCollectionDialog
        entries={entries}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
};
