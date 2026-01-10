import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExplorerViewState } from "../use-explorer-view-state";

describe("useExplorerViewState", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useExplorerViewState());

    expect(result.current.viewMode).toBe("list");
    expect(result.current.sortField).toBe("name");
    expect(result.current.sortDirection).toBe("asc");
  });

  it("should allow custom initial values", () => {
    const { result } = renderHook(() =>
      useExplorerViewState({
        initialViewMode: "column",
        initialSortField: "dateModified",
        initialSortDirection: "desc",
      })
    );

    expect(result.current.viewMode).toBe("column");
    expect(result.current.sortField).toBe("dateModified");
    expect(result.current.sortDirection).toBe("desc");
  });

  it("should update view mode", () => {
    const { result } = renderHook(() => useExplorerViewState());

    act(() => {
      result.current.setViewMode("column");
    });

    expect(result.current.viewMode).toBe("column");
  });

  it("should update sort field and direction", () => {
    const { result } = renderHook(() => useExplorerViewState());

    act(() => {
      result.current.setSort("size", "desc");
    });

    expect(result.current.sortField).toBe("size");
    expect(result.current.sortDirection).toBe("desc");
  });

  it("should toggle direction when setting the same sort field", () => {
    const { result } = renderHook(() => useExplorerViewState());

    // First click on name (already asc, should stay asc if we pass it, but if we don't pass direction it should toggle)
    act(() => {
      result.current.setSort("name");
    });
    expect(result.current.sortField).toBe("name");
    expect(result.current.sortDirection).toBe("desc");

    // Second click on name
    act(() => {
      result.current.setSort("name");
    });
    expect(result.current.sortField).toBe("name");
    expect(result.current.sortDirection).toBe("asc");
  });

  it("should default to asc when switching to a new sort field", () => {
    const { result } = renderHook(() => useExplorerViewState());

    act(() => {
      result.current.setSort("size");
    });

    expect(result.current.sortField).toBe("size");
    expect(result.current.sortDirection).toBe("asc");
  });
});
