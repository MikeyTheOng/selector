import { describe, it, expect } from "vitest";
import type { AppRoute, ExplorerRoute, CollectionRoute } from "../navigation";

describe("navigation types", () => {
  describe("AppRoute", () => {
    it("accepts valid explorer route", () => {
      const route: AppRoute = {
        type: "explorer",
        folderId: "/path/to/folder",
      };
      expect(route.type).toBe("explorer");
    });

    it("accepts explorer route with null folderId", () => {
      const route: AppRoute = {
        type: "explorer",
        folderId: null,
      };
      expect(route.type).toBe("explorer");
      expect(route.folderId).toBeNull();
    });

    it("accepts valid collection route", () => {
      const route: AppRoute = {
        type: "collection",
        collectionId: "collection-123",
      };
      expect(route.type).toBe("collection");
    });

    it("discriminates between route types using type property", () => {
      const explorerRoute: AppRoute = {
        type: "explorer",
        folderId: "/some/path",
      };
      const collectionRoute: AppRoute = {
        type: "collection",
        collectionId: "abc",
      };

      if (explorerRoute.type === "explorer") {
        // TypeScript should allow accessing folderId here
        expect(explorerRoute.folderId).toBe("/some/path");
      }

      if (collectionRoute.type === "collection") {
        // TypeScript should allow accessing collectionId here
        expect(collectionRoute.collectionId).toBe("abc");
      }
    });
  });

  describe("ExplorerRoute", () => {
    it("creates valid explorer route object", () => {
      const route: ExplorerRoute = {
        type: "explorer",
        folderId: "/test/path",
      };
      expect(route.type).toBe("explorer");
      expect(route.folderId).toBe("/test/path");
    });
  });

  describe("CollectionRoute", () => {
    it("creates valid collection route object", () => {
      const route: CollectionRoute = {
        type: "collection",
        collectionId: "test-id",
      };
      expect(route.type).toBe("collection");
      expect(route.collectionId).toBe("test-id");
    });
  });
});
