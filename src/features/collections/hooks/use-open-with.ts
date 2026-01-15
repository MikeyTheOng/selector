import { useCallback, useState } from "react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import type { ExplorerItem } from "@/types/explorer";
import { detectAmbiguity } from "../lib/export-resolution";
import { getExtension } from "@/lib/formatters";
import { addRecentApp } from "@/lib/recent-apps";

const getExtensionForPaths = (paths: string[]) => {
  for (const path of paths) {
    const name = path.split("/").filter(Boolean).pop() ?? path;
    const extension = getExtension(name);
    if (extension) {
      return extension;
    }
  }
  return undefined;
};

export const useOpenWith = (entries: ExplorerItem[]) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [pickerExtension, setPickerExtension] = useState<string>("");
  const [pickerFilePaths, setPickerFilePaths] = useState<string[]>([]);
  const [pendingAppName, setPendingAppName] = useState<string>("");
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const isOpenWithDisabled = entries.length === 0 || isProcessing;

  const openAppPicker = useCallback((paths: string[], extension?: string) => {
    if (paths.length === 0) {
      toast.error("No files selected");
      return;
    }

    const resolvedExtension = extension ?? getExtensionForPaths(paths) ?? "folder";
    setPickerExtension(resolvedExtension);
    setPickerFilePaths(paths);
    setShowAppPicker(true);
  }, []);

  const handleOpenWith = useCallback(() => {
    if (detectAmbiguity(entries).isAmbiguous) {
      setShowResolutionModal(true);
      return;
    }

    openAppPicker(entries.map((file) => file.path));
  }, [entries, openAppPicker]);

  const handleResolutionProceed = useCallback(
    (resolvedPaths: string[]) => {
      setShowResolutionModal(false);
      openAppPicker(resolvedPaths);
    },
    [openAppPicker],
  );

  const handleResolutionClose = useCallback(() => {
    setShowResolutionModal(false);
  }, []);

  const handleAppSelected = useCallback(
    async (appPath: string, appName: string, bundleId?: string) => {
      setShowAppPicker(false);
      setIsProcessing(true);
      setPendingAppName(appName);

      try {
        const targetApp = bundleId || appPath;

        await invoke("open_files_with_app", {
          filePaths: pickerFilePaths,
          appPath: targetApp,
        });

        addRecentApp(pickerExtension, {
          name: appName,
          path: appPath,
          bundleId,
        });

        toast.success(
          `Opened ${pickerFilePaths.length} file${pickerFilePaths.length === 1 ? "" : "s"} with ${appName}`,
        );
      } catch (err) {
        console.error("Failed to open files:", err);
        toast.error(`Failed to open files with ${appName}`);
      } finally {
        setIsProcessing(false);
        setPendingAppName("");
      }
    },
    [pickerFilePaths, pickerExtension],
  );

  const handleAppPickerClose = useCallback(() => {
    setShowAppPicker(false);
  }, []);

  return {
    handleOpenWith,
    handleResolutionProceed,
    handleResolutionClose,
    handleAppSelected,
    handleAppPickerClose,
    isProcessing,
    pendingAppName,
    isOpenWithDisabled,
    showAppPicker,
    pickerExtension,
    pickerFilePaths,
    showResolutionModal,
  };
};
