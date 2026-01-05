import { useEffect } from "react";
import { FileExplorerView, useLocations, useNavigation } from "@/features/file-explorer";
import { useTextScale } from "@/hooks/use-text-scale";

function App() {
  const { locations, error: locationsError, homePath } = useLocations();
  const { selectedFolder, navigateTo, canGoBack, canGoForward, goBack, goForward } =
    useNavigation(homePath);
  const { textScale, setTextScale } = useTextScale();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) {
        return;
      }

      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier) {
        return;
      }

      const clampScale = (value: number) =>
        Math.min(1.4, Math.max(0.8, Math.round(value * 100) / 100));

      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        return;
      }

      const increaseKeys = new Set(["+", "="]);
      const decreaseKeys = new Set(["-", "_"]);

      if (increaseKeys.has(event.key)) {
        event.preventDefault();
        setTextScale(clampScale(textScale + 0.1));
      }

      if (decreaseKeys.has(event.key)) {
        event.preventDefault();
        setTextScale(clampScale(textScale - 0.1));
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [setTextScale, textScale]);

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
