// src/lib/storage.ts

/**
 * Remove all localStorage entries that belong to a user. Keys are prefixed with the user's email.
 */
export function clearUserLocalStorage(email: string): void {
  const prefix = `${email}_`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

