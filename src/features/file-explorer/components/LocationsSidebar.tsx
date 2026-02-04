import { AlertCircle, Folder, HardDrive, Home, Image } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigation } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";
import { useExplorerContextMenu } from "@/components/explorer/ExplorerContextMenu";
import type { LocationItem } from "@/types/explorer";
import type { FavoriteLocationItem } from "../types";

function getFavoriteIcon(favorite: FavoriteLocationItem) {
  if (favorite.status === "missing") {
    return AlertCircle;
  }
  if (favorite.status === "offline") {
    return HardDrive;
  }

  switch (favorite.favoriteType) {
    case "home":
      return Home;
    case "pictures":
      return Image;
    case "custom":
      return Folder;
    default:
      console.error(`Unexpected favoriteType: ${favorite.favoriteType}`);
      return Folder;
  }
}

type LocationsSidebarProps = {
  favorites: FavoriteLocationItem[];
  volumes: LocationItem[];
  onRemoveFavorite: (path: string) => void;
  renderCollections?: () => React.ReactNode;
};

export const LocationsSidebar = ({
  favorites,
  volumes,
  onRemoveFavorite,
  renderCollections,
}: LocationsSidebarProps) => {
  const { currentRoute, navigateToExplorer } = useNavigation();
  const { showContextMenu } = useExplorerContextMenu();
  const selectedFolder = currentRoute.type === "explorer" ? currentRoute.folderId : null;

  const handleFavoriteClick = (favorite: FavoriteLocationItem) => {
    if (favorite.status === "missing") {
      toast.error("This favorite location is missing.");
      return;
    }
    if (favorite.status === "offline") {
      toast.error("This favorite location is offline.");
      return;
    }
    navigateToExplorer(favorite.path);
  };

  const handleFavoriteContextMenu = (
    favorite: FavoriteLocationItem,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    showContextMenu([
      {
        type: "item",
        id: "remove-favorite",
        text: "Remove from Favorites",
        enabled: favorite.favoriteType === "custom",
        action: () => {
          void (async () => {
            try {
              await onRemoveFavorite(favorite.path);
            } catch {
              toast.error("Failed to remove favorite.");
            }
          })();
        },
      },
    ]);
  };

  return (
    <aside className="flex-col min-w-0 w-full sm:w-1/6 border-border/60 border-b lg:border-b-0 lg:border-r">
      <ScrollArea className="flex-1 px-2 py-3">
        <div className="flex flex-col gap-4">
          {favorites.length > 0 && (
            <div>
              <p className="cursor-default select-none px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Favorites
              </p>
              {favorites.map((fav) => {
                const IconComponent = getFavoriteIcon(fav);
                const isUnavailable = fav.status !== "available";
                return (
                  <Button
                    key={fav.path}
                    type="button"
                    variant="ghost"
                    onClick={() => handleFavoriteClick(fav)}
                    onContextMenu={(event) => handleFavoriteContextMenu(fav, event)}
                    className={cn(
                      "h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm",
                      isUnavailable
                        ? "text-muted-foreground hover:text-muted-foreground"
                        : selectedFolder === fav.path
                          ? "bg-accent/70 text-foreground"
                          : "text-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-medium">{fav.name}</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Collections Slot */}
          {renderCollections && (
            <div>
              {renderCollections()}
            </div>
          )}

          <div>
            <p className="cursor-default select-none px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Locations
            </p>
            {volumes.length === 0 ? (
              <div className="px-2 text-xs text-muted-foreground">
                No mounted locations found.
              </div>
            ) : (
              volumes.map((node) => (
                <Button
                  key={node.path}
                  type="button"
                  variant="ghost"
                  onClick={() => navigateToExplorer(node.path)}
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
      </ScrollArea>
    </aside>
  );
};
