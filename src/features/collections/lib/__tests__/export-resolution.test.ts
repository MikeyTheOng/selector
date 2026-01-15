import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectAmbiguity,
  resolveFilesOnly,
  resolveFoldersOnly,
  resolveExpandFolders,
} from "../export-resolution";
import type { ExplorerItem } from "@/types/explorer";
import { fsModule } from "@/lib/tauri/fs";

const createFile = (path: string): ExplorerItem => ({
  path,
  name: path.split("/").pop() ?? "",
  kind: "file",
  status: "available",
  extension: "txt",
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
  it("returns false for files-only selection", () => {
    const result = detectAmbiguity([createFile("/path/to/file.txt")]);
    expect(result.isAmbiguous).toBe(false);
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
