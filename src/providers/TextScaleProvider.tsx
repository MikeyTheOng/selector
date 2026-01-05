import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyTextScale,
  normalizeTextScale,
  readStoredTextScale,
  TEXT_SCALE_STORAGE_KEY,
  TextScaleContext,
  type TextScaleContextValue,
} from "@/hooks/use-text-scale";

export const TextScaleProvider = ({ children }: { children: ReactNode }) => {
  const [textScale, setTextScaleState] = useState(readStoredTextScale);

  useEffect(() => {
    applyTextScale(textScale);
    try {
      window.localStorage.setItem(TEXT_SCALE_STORAGE_KEY, textScale.toString());
    } catch {
      // Ignore storage failures (private mode, disabled storage, etc).
    }
  }, [textScale]);

  const setTextScale = (value: number) => {
    setTextScaleState(normalizeTextScale(value));
  };

  const contextValue = useMemo<TextScaleContextValue>(
    () => ({
      textScale,
      setTextScale,
    }),
    [textScale],
  );

  return <TextScaleContext.Provider value={contextValue}>{children}</TextScaleContext.Provider>;
};
