import { useEffect } from "react";
import { FileExplorerView } from "./components/file-explorer/FileExplorerView";
import { useLocations } from "./hooks/use-locations";
import { useNavigation } from "./hooks/use-navigation";

function App() {
  const { locations, error: locationsError, homePath } = useLocations();
  const { selectedFolder, navigateTo, canGoBack, canGoForward, goBack, goForward } =
    useNavigation(homePath);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(76,138,255,0.18),transparent_55%),linear-gradient(135deg,rgba(248,250,255,0.9),rgba(236,240,247,0.9))] text-foreground">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur">
        <FileExplorerView
          locations={locations}
          locationsError={locationsError}
          selectedFolder={selectedFolder}
          onSelectFolder={navigateTo}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={goBack}
          onForward={goForward}
        />
      </div>
    </main>
  );
}

export default App;
