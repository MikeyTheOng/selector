import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppInfo } from "@/lib/recent-apps";
import { getRecentApps } from "@/lib/recent-apps";
import { invoke } from "@tauri-apps/api/core";
import { FolderOpen, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface RecentAppsPickerProps {
  isOpen: boolean;
  extension: string;
  filePaths: string[];
  onAppSelected: (appPath: string, appName: string, bundleId?: string) => void;
  onClose: () => void;
}

export const RecentAppsPicker = ({
  isOpen,
  extension,
  filePaths,
  onAppSelected,
  onClose,
}: RecentAppsPickerProps) => {
  const [recentApps, setRecentApps] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);

  useEffect(() => {
    if (isOpen && extension) {
      loadRecentApps();
    }
  }, [isOpen, extension]);

  const loadRecentApps = useCallback(async () => {
    setIsLoading(true);
    try {
      const apps = await getRecentApps(extension);
      setRecentApps(apps);
    } catch (error) {
      console.error("Failed to load recent apps:", error);
      setRecentApps([]);
    } finally {
      setIsLoading(false);
    }
  }, [extension]);

  const handleAppClick = useCallback(
    (app: AppInfo) => {
      onAppSelected(app.path, app.name, app.bundleId);
    },
    [onAppSelected],
  );

  const handleBrowse = useCallback(async () => {
    setIsBrowsing(true);
    try {
      const result = await invoke<{
        name: string;
        path: string;
        bundle_id?: string;
      }>("open_with_picker", {
        filePaths,
      });
      onAppSelected(result.path, result.name, result.bundle_id);
    } catch (error) {
      console.error("App picker error:", error);
      if (error && typeof error === "string" && error.includes("cancelled")) {
        onClose();
      }
    } finally {
      setIsBrowsing(false);
    }
  }, [filePaths, onAppSelected, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Open With</DialogTitle>
          <DialogDescription>
            Choose an application to open{" "}
            {filePaths.length === 1 ? "this file" : "these files"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {recentApps.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Recent Apps
                </p>
                <ScrollArea className="max-h-75">
                  <div className="space-y-1">
                    {recentApps.map((app) => (
                      <Button
                        key={app.path}
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start px-3 py-2.5 text-left"
                        onClick={() => handleAppClick(app)}
                      >
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">
                            {app.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {app.path}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No recent apps for .{extension} files
              </div>
            )}

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="default"
                className="w-full"
                onClick={handleBrowse}
                disabled={isBrowsing}
              >
                {isBrowsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening picker...
                  </>
                ) : (
                  <>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Browse for Application...
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
