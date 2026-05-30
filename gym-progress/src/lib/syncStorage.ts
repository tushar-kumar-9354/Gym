import db from "./db";

export interface SyncData {
  [email: string]: {
    [key: string]: string;
  };
}

/**
 * Gets sync data for a specific user.
 */
export async function getUserSyncData(email: string): Promise<{ [key: string]: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const stmt = db.prepare('SELECT key, value FROM sync_data WHERE email = ?');
  const rows = stmt.all(normalizedEmail) as { key: string, value: string }[];
  
  const result: { [key: string]: string } = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  
  return result;
}

/**
 * Updates sync data for a specific user.
 */
export async function updateUserSyncData(
  email: string,
  updates: { [key: string]: string },
  removals: string[]
): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const deleteStmt = db.prepare('DELETE FROM sync_data WHERE email = ? AND key = ?');
  const insertStmt = db.prepare(`
    INSERT INTO sync_data (email, key, value) 
    VALUES (@email, @key, @value) 
    ON CONFLICT(email, key) DO UPDATE SET value=excluded.value
  `);

  const transaction = db.transaction(() => {
    // Apply removals
    if (removals && Array.isArray(removals)) {
      for (const key of removals) {
        deleteStmt.run(normalizedEmail, key);
      }
    }

    // Apply updates
    if (updates && typeof updates === "object") {
      for (const [key, value] of Object.entries(updates)) {
        insertStmt.run({
          email: normalizedEmail,
          key: key,
          value: value
        });
      }
    }
  });

  transaction();
}
