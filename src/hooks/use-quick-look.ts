import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export const useQuickLook = () => {
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  useEffect(() => {
    const unlisten = listen("quicklook://closed", () => {
      setIsPreviewActive(false);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const togglePreview = useCallback(async (path: string) => {
    try {
      const visible = await invoke<boolean>("toggle_preview", { path });
      setIsPreviewActive(visible);
    } catch (err) {
      console.error("Failed to toggle preview:", err);
    }
  }, []);

  const updatePreview = useCallback(async (path: string) => {
    try {
      await invoke("update_preview", { path });
    } catch (err) {
      console.error("Failed to update preview:", err);
    }
  }, []);

  const closePreview = useCallback(async () => {
    if (isPreviewActive) {
      try {
        await invoke("toggle_preview", { path: "" });
        setIsPreviewActive(false);
      } catch (err) {
        console.error("Failed to close preview:", err);
      }
    }
  }, [isPreviewActive]);

  return {
    isPreviewActive,
    togglePreview,
    updatePreview,
    closePreview,
  };
};
