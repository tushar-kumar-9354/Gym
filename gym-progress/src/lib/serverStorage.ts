import * as fs from "fs";
import * as path from "path";

/**
 * Delete the entire data folder on the server, removing all persisted user records.
 */
export async function resetAllUserData(): Promise<void> {
  const dataDir = path.resolve(process.cwd(), "data");
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
  // Re‑create an empty folder with an empty serverUsers.json to avoid missing file errors.
  fs.mkdirSync(dataDir, { recursive: true });
  const emptyUsersPath = path.join(dataDir, "serverUsers.json");
  fs.writeFileSync(emptyUsersPath, JSON.stringify([], null, 2));
}
