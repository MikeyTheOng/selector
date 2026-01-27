import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { UserPreferencesProvider, useUserPreferences } from "../UserPreferencesProvider";
import { USER_PREFERENCES_STORAGE_KEY } from "@/lib/preferences/storage";

describe("UserPreferencesProvider", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <UserPreferencesProvider>{children}</UserPreferencesProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--app-text-scale");
    document.documentElement.classList.remove("dark");
  });

  it("initializes from stored preferences and applies them", async () => {
    localStorage.setItem(
      USER_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ textScale: 1.1, theme: "dark" }),
    );

    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    expect(result.current.textScale).toBe(1.1);
    expect(result.current.theme).toBe("dark");

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--app-text-scale")).toBe("1.1");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("updates combined preferences and persists them", async () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    act(() => {
      result.current.updatePreferences({ textScale: 1.2, theme: "light" });
    });

    await waitFor(() => {
      expect(result.current.textScale).toBe(1.2);
      expect(result.current.theme).toBe("light");
      expect(document.documentElement.style.getPropertyValue("--app-text-scale")).toBe("1.2");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      const raw = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string)).toEqual({ textScale: 1.2, theme: "light" });
    });
  });

  it("updates text scale via keyboard shortcuts", async () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "+",
          metaKey: true,
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.textScale).toBe(1.1);
      const raw = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string)).toEqual({ textScale: 1.1, theme: "system" });
    });
  });
});
