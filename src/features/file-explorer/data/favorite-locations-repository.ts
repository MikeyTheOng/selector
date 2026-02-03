import { getDatabase } from "@/lib/tauri/database";

type FavoriteLocationRow = {
  id: number;
  path: string;
  created_at: string;
};

export async function getFavoriteLocations(): Promise<FavoriteLocationRow[]> {
  const db = await getDatabase();
  const rows = await db.select<FavoriteLocationRow[]>(
    "SELECT * FROM favorite_locations ORDER BY created_at ASC, id ASC",
  );
  return rows;
}

export async function addFavoriteLocation(path: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("INSERT OR IGNORE INTO favorite_locations (path) VALUES (?)", [path]);
}

export async function removeFavoriteLocation(path: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM favorite_locations WHERE path = ?", [path]);
}
