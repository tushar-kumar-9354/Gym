"use client";

import { useEffect, useRef } from "react";

// In-memory queue for batching updates
let syncUpdates: { [key: string]: string } = {};
let syncRemovals: Set<string> = new Set();
let syncTimeout: NodeJS.Timeout | null = null;
let isSyncingFromServer = false;

function flushSyncQueue(email: string) {
  if (Object.keys(syncUpdates).length === 0 && syncRemovals.size === 0) {
    return;
  }

  const payload = {
    email,
    updates: { ...syncUpdates },
    removals: Array.from(syncRemovals),
  };

  // Reset queue immediately
  syncUpdates = {};
  syncRemovals.clear();

  fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.error("Failed to sync data to server", err);
  });
}

function queueUpdate(email: string, key: string, value: string | null) {
  if (isSyncingFromServer) return; // Prevent infinite loop when applying server data
  
  if (value === null) {
    syncRemovals.add(key);
    delete syncUpdates[key];
  } else {
    syncUpdates[key] = value;
    syncRemovals.delete(key);
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    flushSyncQueue(email);
  }, 1000); // 1-second debounce
}

/**
 * Synchronizes localStorage with the server backend.
 */
export default function SyncManager() {
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || initialized.current) return;
    initialized.current = true;

    const email = localStorage.getItem("userEmail");

    // 1. Fetch data from server on initial load if logged in
    if (email) {
      isSyncingFromServer = true;
      fetch(`/api/sync?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.ok && resData.data) {
            // Apply server data to localStorage
            const serverData = resData.data;
            let changed = false;

            for (const [key, value] of Object.entries(serverData)) {
              if (localStorage.getItem(key) !== (value as string)) {
                localStorage.setItem(key, value as string);
                changed = true;
              }
            }

            // Only dispatch event if data actually changed
            if (changed) {
              window.dispatchEvent(new Event("storage"));
              // Also dispatch custom event for specific parts of the app that might listen
              window.dispatchEvent(new Event("gym-plan-updated"));
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch initial sync data", err);
        })
        .finally(() => {
          isSyncingFromServer = false;
        });
    }

    // 2. Monkey-patch localStorage to intercept changes
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = function (key: string, value: string) {
      originalSetItem.apply(this, [key, value]);
      
      const currentEmail = this.getItem("userEmail");
      // Only sync keys associated with the current user or general app state (prevent syncing empty states if logged out)
      if (currentEmail && !isSyncingFromServer) {
        queueUpdate(currentEmail, key, value);
      }
    };

    Storage.prototype.removeItem = function (key: string) {
      originalRemoveItem.apply(this, [key]);
      
      const currentEmail = this.getItem("userEmail");
      if (currentEmail && !isSyncingFromServer) {
        queueUpdate(currentEmail, key, null);
      }
    };

    return () => {
      // Restore original functions if component unmounts (rare for global layout)
      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    };
  }, []);

  return null;
}
