import { FileExplorerView, useLocations } from "@/features/file-explorer";
import { CollectionsSidebarSection, CollectionsView } from "@/features/collections";
import { useNavigation, NavigationProvider } from "@/hooks/use-navigation";
import { MainLayout } from "./MainLayout";
import { AppHeader } from "./AppHeader";
import { LocationsSidebar } from "@/features/file-explorer/components/LocationsSidebar";
import { TextScaleProvider } from "@/providers/TextScaleProvider";

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
          <FileExplorerView
            locations={locations}
            folderId={currentRoute.folderId}
            onSelectFolder={navigateToExplorer}
          />
        );
      case "collection":
        return <CollectionsView collectionId={currentRoute.collectionId} />;
      default:
        return null;
    }
  };

  return (
    <MainLayout sidebar={sidebar} header={<AppHeader />}>
      {renderContent()}
    </MainLayout>
  );
}

function App() {
  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(76,138,255,0.18),transparent_55%),linear-gradient(135deg,rgba(248,250,255,0.9),rgba(236,240,247,0.9))] text-foreground">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur">
        <TextScaleProvider>
          <NavigationProvider>
            <AppInner />
          </NavigationProvider>
        </TextScaleProvider>
      </div>
    </main>
  );
}

export default App;