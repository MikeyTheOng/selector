import { describe, it, expect } from "vitest";
import { getMediaType, groupFilesByMediaType, getFileCountLabel } from "../file-groups";
import type { ExplorerItem } from "@/types/explorer";

const createFile = (path: string, extension: string): ExplorerItem => ({
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

describe("file-groups", () => {
  describe("getMediaType", () => {
    it("returns image for image extensions", () => {
      expect(getMediaType("jpg")).toBe("image");
      expect(getMediaType(".png")).toBe("image");
    });

    it("returns video for video extensions", () => {
      expect(getMediaType("mp4")).toBe("video");
      expect(getMediaType(".mov")).toBe("video");
    });

    it("returns other for unknown extensions", () => {
      expect(getMediaType("xyz")).toBe("other");
      expect(getMediaType(undefined)).toBe("other");
    });
  });

  it("groups files by media type and preserves folder entries in others", () => {
    const files = [
      createFile("/path/to/image.jpg", "jpg"),
      createFile("/path/to/video.mp4", "mp4"),
      createFolder("/path/to/folder"),
    ];

    const grouped = groupFilesByMediaType(files);
    expect(grouped.images.files).toHaveLength(1);
    expect(grouped.videos.files).toHaveLength(1);
    expect(grouped.others.files).toHaveLength(1);
    expect(grouped.hasMultipleTypes).toBe(true);
  });

  it("formats file count labels", () => {
    expect(getFileCountLabel(1, "image")).toBe("1 photo");
    expect(getFileCountLabel(2, "video")).toBe("2 videos");
    expect(getFileCountLabel(3, "other")).toBe("3 files");
  });
});
