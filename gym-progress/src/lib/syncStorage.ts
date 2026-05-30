import * as fs from "fs";
import * as path from "path";

const dataDir = path.resolve(process.cwd(), "data");
const syncDataFile = path.join(dataDir, "syncData.json");

export interface SyncData {
  [email: string]: {
    [key: string]: string;
  };
}

/**
 * Ensures the data directory and sync file exist.
 */
function ensureSyncDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(syncDataFile)) {
    fs.writeFileSync(syncDataFile, JSON.stringify({}, null, 2), "utf8");
  }
}

/**
 * Reads all sync data.
 */
export async function readSyncData(): Promise<SyncData> {
  ensureSyncDataFile();
  try {
    const raw = fs.readFileSync(syncDataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read syncData.json", error);
    return {};
  }
}

/**
 * Writes all sync data.
 */
export async function writeSyncData(data: SyncData): Promise<void> {
  ensureSyncDataFile();
  try {
    fs.writeFileSync(syncDataFile, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write syncData.json", error);
  }
}

/**
 * Gets sync data for a specific user.
 */
export async function getUserSyncData(email: string): Promise<{ [key: string]: string }> {
  const allData = await readSyncData();
  const normalizedEmail = email.toLowerCase().trim();
  return allData[normalizedEmail] || {};
}

/**
 * Updates sync data for a specific user.
 */
export async function updateUserSyncData(
  email: string,
  updates: { [key: string]: string },
  removals: string[]
): Promise<void> {
  const allData = await readSyncData();
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!allData[normalizedEmail]) {
    allData[normalizedEmail] = {};
  }

  // Apply removals
  if (removals && Array.isArray(removals)) {
    for (const key of removals) {
      delete allData[normalizedEmail][key];
    }
  }

  // Apply updates
  if (updates && typeof updates === "object") {
    for (const [key, value] of Object.entries(updates)) {
      allData[normalizedEmail][key] = value;
    }
  }

  await writeSyncData(allData);
}
