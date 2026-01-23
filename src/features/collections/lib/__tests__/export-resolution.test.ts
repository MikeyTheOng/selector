import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  classifyByFileKind,
  detectAmbiguity,
  getFileKindCounts,
  resolveFilesOnly,
  resolveFoldersOnly,
  deduplicateByPath,
  resolveExpandFolders,
} from "../export-resolution";
import type { ExplorerItem } from "@/types/explorer";
import { fsModule } from "@/lib/tauri/fs";

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

describe("detectAmbiguity", () => {
  it("returns false for single-kind files-only selection", () => {
    const result = detectAmbiguity([createFile("/path/to/file.txt")]);
    expect(result.isAmbiguous).toBe(false);
  });

  it("returns true for files of multiple kinds", () => {
    const result = detectAmbiguity([
      createFile("/path/to/photo.jpg", "jpg"),
      createFile("/path/to/video.mp4", "mp4"),
    ]);
    expect(result.isAmbiguous).toBe(true);
  });

  it("returns true for folders-only selection", () => {
    const result = detectAmbiguity([createFolder("/path/to/folder")]);
    expect(result.isAmbiguous).toBe(true);
  });

  it("returns true for mixed files and folders selection", () => {
    const result = detectAmbiguity([
      createFile("/path/to/file.txt"),
      createFolder("/path/to/folder"),
    ]);
    expect(result.isAmbiguous).toBe(true);
  });

  it("returns false for empty selection", () => {
    const result = detectAmbiguity([]);
    expect(result.isAmbiguous).toBe(false);
  });
});

describe("resolveFilesOnly", () => {
  it("filters out folders and keeps files", () => {
    const result = resolveFilesOnly([
      createFile("/path/to/file.txt"),
      createFolder("/path/to/folder"),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe("file");
  });

  it("returns empty array when no files exist", () => {
    const result = resolveFilesOnly([createFolder("/path/to/folder")]);
    expect(result).toEqual([]);
  });
});

describe("resolveFoldersOnly", () => {
  it("filters out files and keeps folders", () => {
    const result = resolveFoldersOnly([
      createFile("/path/to/file.txt"),
      createFolder("/path/to/folder"),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe("folder");
  });

  it("returns empty array when no folders exist", () => {
    const result = resolveFoldersOnly([createFile("/path/to/file.txt")]);
    expect(result).toEqual([]);
  });
});

describe("resolveExpandFolders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expands folder contents recursively", async () => {
    vi.mocked(fsModule.readDir).mockResolvedValue([
      { path: "/path/to/folder/nested.jpg", name: "nested.jpg", isFile: true },
      { path: "/path/to/folder/inner", name: "inner", isDirectory: true },
      { path: "/path/to/folder/inner/deep.txt", name: "deep.txt", isFile: true },
    ]);

    const result = await resolveExpandFolders([createFolder("/path/to/folder")]);

    expect(fsModule.readDir).toHaveBeenCalledWith("/path/to/folder", { recursive: true });
    expect(result.every((item) => item.kind === "file")).toBe(true);
    expect(result.map((item) => item.path).sort()).toEqual(
      ["/path/to/folder/nested.jpg", "/path/to/folder/inner/deep.txt"].sort(),
    );
  });

  it("ignores .DS_Store entries", async () => {
    vi.mocked(fsModule.readDir).mockResolvedValue([
      { path: "/path/to/folder/.DS_Store", name: ".DS_Store", isFile: true },
      { path: "/path/to/folder/photo.jpg", name: "photo.jpg", isFile: true },
    ]);

    const result = await resolveExpandFolders([createFolder("/path/to/folder")]);

    expect(result.map((item) => item.path)).toEqual(["/path/to/folder/photo.jpg"]);
  });

  it("includes top-level files", async () => {
    vi.mocked(fsModule.readDir).mockResolvedValue([]);

    const result = await resolveExpandFolders([
      createFile("/path/to/file.txt"),
      createFolder("/path/to/folder"),
    ]);

    expect(result.map((item) => item.path)).toContain("/path/to/file.txt");
  });

  it("handles nested folders", async () => {
    vi.mocked(fsModule.readDir).mockResolvedValue([
      { path: "/path/to/folder/inner/deep.txt", name: "deep.txt", isFile: true },
    ]);

    const result = await resolveExpandFolders([createFolder("/path/to/folder")]);

    expect(result.map((item) => item.path)).toContain("/path/to/folder/inner/deep.txt");
  });
});

describe("deduplicateByPath", () => {
  it("removes duplicate paths", () => {
    const file = createFile("/path/to/file.txt");
    const result = deduplicateByPath([file, file]);
    expect(result).toHaveLength(1);
  });

  it("removes overlapping parent/child folder paths", () => {
    const folder = createFolder("/path/to/folder");
    const child = createFolder("/path/to/folder/nested");
    const result = deduplicateByPath([folder, child]);

    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("/path/to/folder");
  });

  it("preserves order of first occurrence", () => {
    const first = createFile("/path/to/first.txt");
    const second = createFile("/path/to/second.txt");
    const duplicateFirst = createFile("/path/to/first.txt");

    const result = deduplicateByPath([first, second, duplicateFirst]);
    expect(result.map((item) => item.path)).toEqual([
      "/path/to/first.txt",
      "/path/to/second.txt",
    ]);
  });
});

describe("classifyByFileKind", () => {
  it("groups items by file kind", () => {
    const items = [
      createFile("/path/to/image.jpg", "jpg"),
      createFile("/path/to/video.mp4", "mp4"),
      createFile("/path/to/doc.pdf", "pdf"),
    ];

    const grouped = classifyByFileKind(items);

    expect(grouped.get("image")).toHaveLength(1);
    expect(grouped.get("video")).toHaveLength(1);
    expect(grouped.get("document")).toHaveLength(1);
  });

  it("handles empty input", () => {
    const grouped = classifyByFileKind([]);
    expect(grouped.get("image")).toEqual([]);
    expect(grouped.get("video")).toEqual([]);
    expect(grouped.get("document")).toEqual([]);
  });
});

describe("getFileKindCounts", () => {
  it("returns accurate counts per kind", () => {
    const items = [
      createFile("/path/to/image.jpg", "jpg"),
      createFile("/path/to/second.jpg", "jpg"),
      createFile("/path/to/video.mp4", "mp4"),
      createFile("/path/to/doc.pdf", "pdf"),
    ];

    expect(getFileKindCounts(items)).toEqual({
      image: 2,
      video: 1,
      document: 1,
    });
  });

  it("handles empty input", () => {
    expect(getFileKindCounts([])).toEqual({
      image: 0,
      video: 0,
      document: 0,
    });
  });
});
