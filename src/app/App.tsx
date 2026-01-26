import { Toaster } from "@/components/ui/sonner";
import {
    AddToCollectionSelectionPanel,
    CollectionsPage,
    CollectionsSidebarSection,
} from "@/features/collections";
import { FileExplorerPage, useLocations } from "@/features/file-explorer";
import { LocationsSidebar } from "@/features/file-explorer/components/LocationsSidebar";
import { NavigationProvider, useNavigation } from "@/hooks/use-navigation";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { TextScaleProvider } from "@/providers/TextScaleProvider";
import { MainLayout } from "./MainLayout";

function AppInner() {
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
  useThemePreference();

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(76,138,255,0.18),transparent_55%),linear-gradient(135deg,rgba(248,250,255,0.9),rgba(236,240,247,0.9))] text-foreground">
      <TextScaleProvider>
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
      </TextScaleProvider>
    </main>
  );
}

export default App;
