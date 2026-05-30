import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Spy on standard Storage prototype methods to preserve JSDOM standard localStorage functionality and prototype inheritance
vi.spyOn(Storage.prototype, 'getItem');
vi.spyOn(Storage.prototype, 'setItem');
vi.spyOn(Storage.prototype, 'removeItem');
vi.spyOn(Storage.prototype, 'clear');

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ ok: true, data: {} }),
  } as Response)
);
