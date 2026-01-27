import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyTextScale,
  normalizeTextScale,
  readStoredTextScale,
  TextScaleContext,
  type TextScaleContextValue,
} from "@/hooks/use-text-scale";
import { writeUserPreferences } from "@/lib/preferences/storage";

export const TextScaleProvider = ({ children }: { children: ReactNode }) => {
  const [textScale, setTextScaleState] = useState(readStoredTextScale);

  useEffect(() => {
    applyTextScale(textScale);
    writeUserPreferences({ textScale });
  }, [textScale]);

  const setTextScale = (value: number) => {
    setTextScaleState(normalizeTextScale(value));
  };

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
  }, [textScale]);

  const contextValue = useMemo<TextScaleContextValue>(
    () => ({
      textScale,
      setTextScale,
    }),
    [textScale],
  );

  return <TextScaleContext.Provider value={contextValue}>{children}</TextScaleContext.Provider>;
};
