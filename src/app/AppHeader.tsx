import { useNavigation } from "@/hooks/use-navigation.tsx";
import { ExplorerToolbar } from "@/components/explorer/ExplorerToolbar";
import { CollectionToolbar } from "@/features/collections/components/CollectionToolbar";

/**
 * App-level header that renders the appropriate toolbar based on the current route
 */
export function AppHeader() {
  const { currentRoute } = useNavigation();

  if (currentRoute.type === "collection") {
    return <CollectionToolbar />;
  }

  // Default to Explorer toolbar
  // TODO: Pass proper props from navigation/view state in Phase 3
  return (
    <ExplorerToolbar
      viewMode="list"
      onViewModeChange={() => {}}
      fileCount={0}
      folderCount={0}
      selectedCount={0}
      isSelectionOpen={false}
      onToggleSelection={() => {}}
    />
  );
}
