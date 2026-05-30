import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SyncManager from './SyncManager';

describe('SyncManager DOM Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('fetches remote data on mount if userEmail exists in localStorage', async () => {
    // Setup existing login state
    localStorage.setItem('userEmail', 'test@sync.com');

    // Mock API response with some synced data
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true, data: { 'test_plan': '{"name":"Bulk"}' } })
    });

    render(<SyncManager />);

    // Ensure it fetched the remote data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sync?email=test%40sync.com');
    });

    // Wait for the promise resolution
    await waitFor(() => {
      expect(localStorage.getItem('test_plan')).toBe('{"name":"Bulk"}');
    });
  });

  it('intercepts localStorage.setItem and debounces a POST to /api/sync', async () => {
    localStorage.setItem('userEmail', 'test@sync.com');
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true, data: {} }) });
    
    render(<SyncManager />);

    // Wait for the initial sync fetch to complete so isSyncingFromServer is reset to false
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sync?email=test%40sync.com');
    });

    // Clear call history to isolate the debounce POST assertion
    (global.fetch as any).mockClear();

    // Trigger an intercepted setItem
    localStorage.setItem('new_log', '100kg');

    // Fast-forward debounce timeout (1000ms)
    vi.advanceTimersByTime(1100);

    // Verify it sent the payload
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sync', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'test@sync.com',
          updates: { new_log: '100kg' },
          removals: []
        })
      }));
    });
  });
});
