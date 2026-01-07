import { CollectionBreadcrumb } from "./CollectionBreadcrumb";

interface CollectionToolbarProps {
  collectionId?: string;
}

/**
 * Toolbar for Collections view with breadcrumbs and view controls
 */
export function CollectionToolbar({ collectionId }: CollectionToolbarProps) {
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
        {/* Placeholder for future view controls similar to ExplorerToolbar */}
        <div className="h-7 w-24 rounded-full bg-muted/30 animate-pulse" />
      </div>
    </div>
  );
}
