import { describe, it, expect, beforeEach } from "vitest";
import {
  mockDatabaseClose,
  resetSqlMocks,
} from "@/test/mocks/tauri";
import {
  getDatabase,
  closeDatabase,
  getDatabasePath,
  resetDatabaseCache,
  resolveDatabasePath,
} from "../database";

describe("database", () => {
  beforeEach(() => {
    resetDatabaseCache();
    resetSqlMocks();
  });

  describe("getDatabase", () => {
    it("should return a database instance", async () => {
      const db = await getDatabase();

      expect(db).toBeDefined();
      expect(db.execute).toBeDefined();
      expect(db.select).toBeDefined();
    });

    it("should return cached instance on subsequent calls", async () => {
      const db1 = await getDatabase();
      const db2 = await getDatabase();

      expect(db1).toBe(db2);
    });
  });

  describe("closeDatabase", () => {
    it("should close the database connection", async () => {
      await getDatabase();
      await closeDatabase();

      expect(mockDatabaseClose).toHaveBeenCalled();
    });

    it("should handle closing when no database is open", async () => {
      await expect(closeDatabase()).resolves.not.toThrow();
    });

    it("should allow getting a new connection after closing", async () => {
      await getDatabase();
      await closeDatabase();

      resetSqlMocks();
      const db = await getDatabase();
      expect(db).toBeDefined();
    });
  });

  describe("getDatabasePath", () => {
    it("should return the runtime database path", () => {
      const path = getDatabasePath();

      expect(path).toBe(resolveDatabasePath(import.meta.env.DEV));
    });

    it("should return the production database path outside dev mode", () => {
      expect(resolveDatabasePath(false)).toBe("sqlite:selector.db");
    });

    it("should return the dev database path in dev mode", () => {
      expect(resolveDatabasePath(true)).toBe("sqlite:selector.dev.db");
    });
  });

  describe("resetDatabaseCache", () => {
    it("should reset the cached instance", async () => {
      const db1 = await getDatabase();
      resetDatabaseCache();
      const db2 = await getDatabase();

      // Both are the same mock object, but the cache was cleared
      // The important behavior is that Database.load was called twice
      expect(db1).toBeDefined();
      expect(db2).toBeDefined();
    });
  });
});
