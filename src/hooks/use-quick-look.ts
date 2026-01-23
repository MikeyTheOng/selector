import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type UseQuickLookOptions = {
  focusedPath?: string | null;
};

export const useQuickLook = (options?: UseQuickLookOptions) => {
  const focusedPath = options?.focusedPath ?? null;
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const lastPreviewedPathRef = useRef<string | null>(null);

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
      if (visible) {
        lastPreviewedPathRef.current = path;
      }
      setIsPreviewActive(visible);
    } catch (err) {
      console.error("Failed to toggle preview:", err);
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

  useEffect(() => {
    if (!isPreviewActive || !focusedPath) return;
    if (focusedPath === lastPreviewedPathRef.current) return;

    const timer = setTimeout(() => {
      invoke("update_preview", { path: focusedPath })
        .then(() => {
          lastPreviewedPathRef.current = focusedPath;
        })
        .catch((err) => {
          console.error("Failed to update preview:", err);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [focusedPath, isPreviewActive]);

  return {
    isPreviewActive,
    togglePreview,
    closePreview,
  };
};
