import { createContext, useContext } from "react";

export const TEXT_SCALE_STORAGE_KEY = "selector:text-scale";
const TEXT_SCALE_CSS_VAR = "--app-text-scale";
const DEFAULT_TEXT_SCALE = 0.2;

export const normalizeTextScale = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : DEFAULT_TEXT_SCALE;

export const readStoredTextScale = () => {
  if (typeof window === "undefined") {
    return DEFAULT_TEXT_SCALE;
  }

  try {
    const raw = window.localStorage.getItem(TEXT_SCALE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TEXT_SCALE;
    }
    const parsed = Number(raw);
    return normalizeTextScale(parsed);
  } catch {
    return DEFAULT_TEXT_SCALE;
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
