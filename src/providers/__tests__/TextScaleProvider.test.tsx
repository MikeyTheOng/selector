import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { TextScaleProvider } from "../TextScaleProvider";
import { useTextScale } from "@/hooks/use-text-scale";
import { USER_PREFERENCES_STORAGE_KEY } from "@/lib/user-preferences";

describe("TextScaleProvider", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TextScaleProvider>{children}</TextScaleProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--app-text-scale");
  });

  it("initializes from stored preferences and applies text scale", async () => {
    localStorage.setItem(
      USER_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ textScale: 1.1, theme: "dark" }),
    );

    renderHook(() => useTextScale(), { wrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--app-text-scale")).toBe("1.1");
    });
  });

  it("persists text scale updates to preferences", async () => {
    const { result } = renderHook(() => useTextScale(), { wrapper });

    act(() => {
      result.current.setTextScale(1.2);
    });

    await waitFor(() => {
      const raw = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string)).toEqual({ textScale: 1.2, theme: "system" });
    });
  });
});
