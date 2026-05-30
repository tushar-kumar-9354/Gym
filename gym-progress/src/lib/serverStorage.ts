import db from "./db";

/**
 * Reset all user data by deleting everything from the SQLite database.
 */
export async function resetAllUserData(): Promise<void> {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM sync_data').run();
    db.prepare('DELETE FROM users').run();
  });
  
  transaction();
}
