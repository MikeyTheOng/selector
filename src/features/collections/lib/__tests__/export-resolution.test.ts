import { describe, it, expect } from "vitest";
import { detectAmbiguity } from "../export-resolution";
import type { ExplorerItem } from "@/types/explorer";

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
