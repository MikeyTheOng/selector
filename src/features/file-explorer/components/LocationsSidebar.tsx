import { Folder, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { LocationItem } from "@/types/fs";

type LocationsSidebarProps = {
  locations: LocationItem[];
  locationsError: string | null;
  selectedFolder: string | null;
  onSelectFolder: (path: string) => void;
};

export const LocationsSidebar = ({
  locations,
  locationsError,
  selectedFolder,
  onSelectFolder,
}: LocationsSidebarProps) => {
  const homeLocation = locations.find((node) => node.kind === "home") ?? null;
  const locationNodes = locations.filter((node) => node.kind === "volume");

  return (
    <aside className="flex-col min-w-0 w-full sm:w-1/6 border-border/60 border-b lg:border-b-0 lg:border-r">
      <ScrollArea className="flex-1 px-2 py-3">
        {locationsError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {locationsError}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {homeLocation ? (
              <div>
                <p className="cursor-default select-none px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Favorites
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectFolder(homeLocation.path)}
                  className={cn(
                    "h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:text-foreground",
                    selectedFolder === homeLocation.path
                      ? "bg-accent/70 text-foreground"
                      : "text-foreground hover:bg-muted/50",
                  )}
                >
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate font-medium">{homeLocation.name}</span>
                </Button>
              </div>
            ) : null}
            <div>
              <p className="cursor-default select-none px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Locations
              </p>
              {locationNodes.length === 0 ? (
                <div className="px-2 text-xs text-muted-foreground">
                  No mounted locations found.
                </div>
              ) : (
                locationNodes.map((node) => (
                  <Button
                    key={node.path}
                    type="button"
                    variant="ghost"
                    onClick={() => onSelectFolder(node.path)}
                    className={cn(
                      "h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:text-foreground",
                      selectedFolder === node.path
                        ? "bg-accent/70 text-foreground"
                        : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-medium">{node.name}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
};
