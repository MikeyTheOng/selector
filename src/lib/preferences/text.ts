const TEXT_SCALE_CSS_VAR = "--app-text-scale";

export const DEFAULT_TEXT_SCALE = 1;

export const normalizeTextScale = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_TEXT_SCALE;
  }
  return value;
};

export const applyTextScale = (scale: number) => {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.style.setProperty(TEXT_SCALE_CSS_VAR, scale.toString());
};
