import { vi } from 'vitest';

// Mock @tauri-apps/api
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

// Mock @tauri-apps/plugin-fs
vi.mock('@tauri-apps/plugin-fs', () => ({
  readDir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  remove: vi.fn(),
  exists: vi.fn(),
  stat: vi.fn(),
  watch: vi.fn(() => Promise.resolve(() => {})),
}));

// Mock @tauri-apps/api/path
vi.mock('@tauri-apps/api/path', () => ({
  homeDir: vi.fn(() => Promise.resolve('/Users/test')),
}));

// Mock @tauri-apps/plugin-shell
vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}));

// Helper to reset all mocks between tests
export const resetTauriMocks = () => {
  vi.clearAllMocks();
};
