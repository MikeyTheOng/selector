import { Toaster } from "@/components/ui/sonner";
import {
    AddToCollectionSelectionPanel,
    CollectionsPage,
    CollectionsSidebarSection,
} from "@/features/collections";
import { FileExplorerPage, useLocations } from "@/features/file-explorer";
import { LocationsSidebar } from "@/features/file-explorer/components/LocationsSidebar";
import { NavigationProvider, useNavigation } from "@/hooks/use-navigation";
import { UserPreferencesProvider } from "@/providers/UserPreferencesProvider";
import { MainLayout } from "./MainLayout";
import { useAppMenu } from "./setupAppMenu";

function AppInner() {
  useAppMenu();
  const { locations, error: locationsError } = useLocations();
  const { currentRoute, navigateToExplorer } = useNavigation();

  const sidebar = (
    <LocationsSidebar
      locations={locations}
      locationsError={locationsError}
      renderCollections={() => <CollectionsSidebarSection />}
    />
  );

  const renderContent = () => {
    switch (currentRoute.type) {
      case "explorer":
        return (
          <FileExplorerPage
            locations={locations}
            folderId={currentRoute.folderId}
            focusItemPath={currentRoute.focusItemPath}
            onSelectFolder={navigateToExplorer}
            SelectionPanel={AddToCollectionSelectionPanel}
          />
        );
      case "collection":
        return <CollectionsPage collectionId={currentRoute.collectionId} />;
      default:
        return null;
    }
  };

  return (
    <MainLayout sidebar={sidebar}>
      {renderContent()}
    </MainLayout>
  );
}

function App() {
  return (
    <main className="app-background flex h-screen min-h-0 flex-col overflow-hidden text-foreground">
      <UserPreferencesProvider>
        <NavigationProvider>
          <Toaster
            className="pointer-events-auto"
            closeButton
            position="top-right"
            richColors
            visibleToasts={1}
          />
          <AppInner />
        </NavigationProvider>
      </UserPreferencesProvider>
    </main>
  );
}

export default App;
