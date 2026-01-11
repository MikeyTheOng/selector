import { CheckSquare } from "lucide-react";
import { CollectionBreadcrumb } from "./CollectionBreadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCollectionSelection } from "../hooks/use-collection-selection";

interface CollectionToolbarProps {
  collectionId?: string;
  isSelectionOpen: boolean;
  onToggleSelection: () => void;
  selection: ReturnType<typeof useCollectionSelection>;
}

/**
 * Toolbar for Collections view with breadcrumbs and view controls
 */
export function CollectionToolbar({ 
  collectionId, 
  isSelectionOpen,
  onToggleSelection,
  selection
}: CollectionToolbarProps) {
  const { selectedEntries } = selection;
  const selectedCount = selectedEntries.length;

  return (
    <div className="flex h-12 items-center justify-between border-b border-border/50 bg-background/40 px-4">
      <div className="flex items-center gap-3">
        {collectionId ? (
          <CollectionBreadcrumb collectionId={parseInt(collectionId, 10)} />
        ) : (
          <div className="text-sm font-medium text-muted-foreground">
            Collections
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={isSelectionOpen ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-2 px-2"
          onClick={onToggleSelection}
          disabled={selectedCount === 0}
          aria-label="Selection"
        >
          <CheckSquare className="h-4 w-4" />
          {selectedCount > 0 && (
            <Badge 
              variant="secondary" 
              className="h-5 min-w-5 justify-center px-1 text-[10px]"
            >
              {selectedCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
