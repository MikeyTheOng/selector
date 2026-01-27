import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useThemePreference } from "../use-theme-preference";

vi.mock("@/lib/preferences/theme", () => ({
  applyThemePreference: vi.fn(),
  listenToSystemThemeChanges: vi.fn(() => vi.fn()),
}));

vi.mock("@/lib/preferences/storage", () => ({
  readUserPreferences: vi.fn(() => ({ textScale: 1, theme: "system" as const })),
}));

const themeModule = await import("@/lib/preferences/theme");
const prefsModule = await import("@/lib/preferences/storage");

const applyThemePreference = vi.mocked(themeModule.applyThemePreference);
const listenToSystemThemeChanges = vi.mocked(themeModule.listenToSystemThemeChanges);
const readUserPreferences = vi.mocked(prefsModule.readUserPreferences);

describe("useThemePreference", () => {
  beforeEach(() => {
    applyThemePreference.mockClear();
    listenToSystemThemeChanges.mockClear();
    readUserPreferences.mockClear();
  });

  it("applies theme and starts listener when preference is system", () => {
    readUserPreferences.mockReturnValue({ textScale: 1, theme: "system" });
    const cleanup = vi.fn();
    listenToSystemThemeChanges.mockReturnValue(cleanup);
    const { unmount } = renderHook(() => useThemePreference());

    expect(applyThemePreference).toHaveBeenCalledWith("system");
    expect(listenToSystemThemeChanges).toHaveBeenCalledTimes(1);

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("applies theme without listener when preference is explicit", () => {
    readUserPreferences.mockReturnValue({ textScale: 1, theme: "dark" });
    renderHook(() => useThemePreference());

    expect(applyThemePreference).toHaveBeenCalledWith("dark");
    expect(listenToSystemThemeChanges).not.toHaveBeenCalled();
  });
});
