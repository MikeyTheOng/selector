import { vi } from 'vitest';

// Mock @tauri-apps/api
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

// Mock database instance for @tauri-apps/plugin-sql
export const mockDatabaseExecute = vi.fn();
export const mockDatabaseSelect = vi.fn();
export const mockDatabaseClose = vi.fn();

const mockDatabaseInstance = {
  execute: mockDatabaseExecute,
  select: mockDatabaseSelect,
  close: mockDatabaseClose,
};

// Mock @tauri-apps/plugin-sql
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(() => Promise.resolve(mockDatabaseInstance)),
  },
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

// Helper to reset SQL mocks specifically (useful for database tests)
export const resetSqlMocks = () => {
  mockDatabaseExecute.mockReset();
  mockDatabaseSelect.mockReset();
  mockDatabaseClose.mockReset();
};
