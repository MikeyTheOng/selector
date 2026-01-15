import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useExportResolution } from "../use-export-resolution";
import type { ExplorerItem } from "@/types/explorer";

const createFile = (path: string, extension = "txt"): ExplorerItem => ({
  path,
  name: path.split("/").pop() ?? "",
  kind: "file",
  status: "available",
  extension,
  sizeLabel: "0 B",
  dateModified: new Date(),
  dateModifiedLabel: "Today",
  kindLabel: "File",
});

const createFolder = (path: string): ExplorerItem => ({
  path,
  name: path.split("/").pop() ?? "",
  kind: "folder",
  status: "available",
  dateModified: new Date(),
  dateModifiedLabel: "Today",
  kindLabel: "Folder",
});

describe("useExportResolution", () => {
  it("starts with no resolution selected", () => {
    const items = [createFile("/path/to/file.txt")];
    const { result } = renderHook(() => useExportResolution(items));

    expect(result.current.resolutionStrategy).toBe(null);
    expect(result.current.resolvedPaths).toEqual([]);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("updates resolved paths when a resolution strategy is selected", async () => {
    const items = [
      createFile("/path/to/file.txt"),
      createFolder("/path/to/folder"),
    ];
    const { result } = renderHook(() => useExportResolution(items));

    act(() => {
      result.current.setResolutionStrategy("files-only");
    });

    await waitFor(() => {
      expect(result.current.resolvedPaths).toEqual(["/path/to/file.txt"]);
    });
  });

  it("filters resolved items by file kind toggles", async () => {
    const items = [
      createFile("/path/to/image.jpg", "jpg"),
      createFile("/path/to/video.mp4", "mp4"),
    ];
    const { result } = renderHook(() => useExportResolution(items));

    act(() => {
      result.current.setResolutionStrategy("files-only");
    });

    await waitFor(() => {
      expect(result.current.resolvedPaths).toHaveLength(2);
    });

    act(() => {
      result.current.toggleFileKind("image");
    });

    expect(result.current.resolvedPaths).toEqual(["/path/to/video.mp4"]);
  });

  it("flags empty results when resolution yields no items", async () => {
    const items = [createFolder("/path/to/folder")];
    const { result } = renderHook(() => useExportResolution(items));

    act(() => {
      result.current.setResolutionStrategy("files-only");
    });

    await waitFor(() => {
      expect(result.current.isEmpty).toBe(true);
    });
  });

  it("computes file kind counts correctly", async () => {
    const items = [
      createFile("/path/to/image.jpg", "jpg"),
      createFile("/path/to/video.mp4", "mp4"),
      createFile("/path/to/doc.pdf", "pdf"),
    ];
    const { result } = renderHook(() => useExportResolution(items));

    act(() => {
      result.current.setResolutionStrategy("files-only");
    });

    await waitFor(() => {
      expect(result.current.fileKindCounts).toEqual({
        image: 1,
        video: 1,
        document: 1,
      });
    });
  });
});
