import { describe, it, expect } from "vitest";
import { getFileKind, getKindLabel } from "../file-types";

describe("file-types", () => {
  describe("getFileKind", () => {
    it("classifies image extensions", () => {
      expect(getFileKind("jpg")).toBe("image");
      expect(getFileKind(".png")).toBe("image");
    });

    it("classifies video extensions", () => {
      expect(getFileKind("mp4")).toBe("video");
      expect(getFileKind(".mov")).toBe("video");
    });

    it("defaults to document for unknown extensions", () => {
      expect(getFileKind("xyz")).toBe("document");
      expect(getFileKind("")).toBe("document");
    });
  });

  describe("getKindLabel", () => {
    it("returns \"File\" for empty extension", () => {
      expect(getKindLabel("")).toBe("File");
    });

    it("returns specific label for known extensions", () => {
      expect(getKindLabel("pdf")).toBe("PDF document");
      expect(getKindLabel("jpg")).toBe("JPEG image");
    });

    it("returns uppercase extension for unknown extensions", () => {
      expect(getKindLabel("xyz")).toBe("XYZ");
    });
  });
});
