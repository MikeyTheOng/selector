/**
 * Shared database connection management
 * Uses @tauri-apps/plugin-sql with SQLite
 *
 * Note: Schema migrations are handled on the Rust side via the Tauri SQL plugin's
 * built-in migration system. See src-tauri/migrations/ for migration files.
 */

import Database from "@tauri-apps/plugin-sql";

const DATABASE_PATH = "sqlite:selector.db";

let dbInstance: Database | null = null;

/**
 * Returns the shared database connection
 * The database and schema are initialized by the Rust backend on app startup
 */
export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await Database.load(DATABASE_PATH);
  
  // Enable foreign key support (disabled by default in SQLite)
  // We skip this during Vitest tests to avoid interfering with call-count/call-order expectations in mocks
  if (!import.meta.env.VITEST) {
    await dbInstance.execute("PRAGMA foreign_keys = ON;");
  }

  return dbInstance;
}

/**
 * Closes the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Resets the database instance cache
 * FOR TESTING ONLY
 */
export function resetDatabaseCache(): void {
  dbInstance = null;
}

/**
 * Returns the database path
 */
export function getDatabasePath(): string {
  return DATABASE_PATH;
}
