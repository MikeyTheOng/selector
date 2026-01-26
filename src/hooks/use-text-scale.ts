import { createContext, useContext } from "react";
import {
  DEFAULT_USER_PREFERENCES,
  normalizeTextScale as normalizeUserTextScale,
  readUserPreferences,
} from "@/lib/user-preferences";

const TEXT_SCALE_CSS_VAR = "--app-text-scale";

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

export const applyTextScale = (scale: number) => {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.style.setProperty(TEXT_SCALE_CSS_VAR, scale.toString());
};

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
