import { vi } from 'vitest';

// Mock @tauri-apps/api/event
export const mockEmit = vi.fn();
export const mockListen = vi.fn();

let listeners: Record<string, Array<(event: { payload?: unknown }) => void>> = {};

mockListen.mockImplementation((name: string, callback: (event: { payload?: unknown }) => void) => {
  if (!listeners[name]) listeners[name] = [];
  listeners[name].push(callback);
  return Promise.resolve(() => {
    listeners[name] = listeners[name].filter(l => l !== callback);
  });
});

mockEmit.mockImplementation((name: string, payload?: unknown) => {
  if (listeners[name]) {
    listeners[name].forEach(l => l({ payload }));
  }
  return Promise.resolve();
});

vi.mock('@tauri-apps/api/event', () => ({
  emit: (name: string, payload?: unknown) => mockEmit(name, payload),
  listen: (name: string, callback: (event: { payload?: unknown }) => void) => mockListen(name, callback),
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
  listeners = {};
};

// Helper to reset SQL mocks specifically (useful for database tests)
export const resetSqlMocks = () => {
  mockDatabaseExecute.mockReset();
  mockDatabaseSelect.mockReset();
  mockDatabaseClose.mockReset();
};
