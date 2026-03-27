/**
 * Shared database connection management
 * Uses @tauri-apps/plugin-sql with SQLite
 *
 * Note: Schema migrations are handled on the Rust side via the Tauri SQL plugin's
 * built-in migration system. See src-tauri/migrations/ for migration files.
 */

import Database from "@tauri-apps/plugin-sql";

const DEV_DATABASE_PATH = "sqlite:selector.dev.db";
const PROD_DATABASE_PATH = "sqlite:selector.db";

export function resolveDatabasePath(
  isDev = import.meta.env.DEV,
): string {
  return isDev ? DEV_DATABASE_PATH : PROD_DATABASE_PATH;
}

const DATABASE_PATH = resolveDatabasePath();

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
  await dbInstance.execute("PRAGMA foreign_keys = ON;");

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
