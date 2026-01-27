import { createContext, useContext } from "react";
import { DEFAULT_USER_PREFERENCES, readUserPreferences } from "@/lib/preferences/storage";
import { applyTextScale, normalizeTextScale as normalizeUserTextScale } from "@/lib/preferences/text";

export const normalizeTextScale = (value: number) => normalizeUserTextScale(value);

export const readStoredTextScale = () => {
  if (typeof window === "undefined") {
    return DEFAULT_USER_PREFERENCES.textScale;
  }

  try {
    return readUserPreferences().textScale;
  } catch {
    return DEFAULT_USER_PREFERENCES.textScale;
  }
};

export { applyTextScale };

export const initializeTextScale = () => {
  applyTextScale(readStoredTextScale());
};

export type TextScaleContextValue = {
  textScale: number;
  setTextScale: (value: number) => void;
};

export const TextScaleContext = createContext<TextScaleContextValue | undefined>(undefined);

export const useTextScale = () => {
  const context = useContext(TextScaleContext);
  if (!context) {
    throw new Error("useTextScale must be used within a TextScaleProvider");
  }
  return context;
};
