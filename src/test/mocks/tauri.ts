import { beforeEach, vi } from "vitest";
import { clearMocks, mockIPC, mockWindows } from "@tauri-apps/api/mocks";

type IpcHandler = (cmd: string, payload?: unknown) => unknown;

type MenuNewPayload = {
  options?: {
    id?: unknown;
  };
};

const getMenuOptionId = (payload: unknown): string | undefined => {
  if (typeof payload !== "object" || payload === null) return undefined;
  const maybeOptions = (payload as MenuNewPayload).options;
  if (typeof maybeOptions !== "object" || maybeOptions === null)
    return undefined;
  const maybeId = (maybeOptions as { id?: unknown }).id;
  return typeof maybeId === "string" ? maybeId : undefined;
};

const createDefaultIpcHandler = (): IpcHandler => {
  let nextRid = 1;
  const next = () => nextRid++;

  return (cmd: string, payload?: unknown) => {
    switch (cmd) {
      case "plugin:app|name":
        return "Selector Test";
      case "plugin:menu|create_default": {
        const rid = next();
        return [rid, "default-menu"];
      }
      case "plugin:menu|new": {
        const rid = next();
        const id = getMenuOptionId(payload) ?? `menu-item-${rid}`;
        return [rid, id];
      }
      case "plugin:menu|items":
        return [];
      case "plugin:menu|get":
        return null;
      case "plugin:menu|set_as_app_menu":
        return null;
      case "plugin:menu|text":
        return "Selector Test";
      case "plugin:menu|append":
      case "plugin:menu|insert":
      case "plugin:menu|set_checked":
        return undefined;
      default:
        return undefined;
    }
  };
};

let ipcHandler: IpcHandler = createDefaultIpcHandler();

const registerIpc = () => {
  mockIPC((cmd, payload) => ipcHandler(cmd, payload), {
    shouldMockEvents: true,
  });
  mockWindows("main");
};

registerIpc();

beforeEach(() => {
  clearMocks();
  ipcHandler = createDefaultIpcHandler();
  registerIpc();
});

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
vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: vi.fn(() => Promise.resolve(mockDatabaseInstance)),
  },
}));

// Mock @tauri-apps/plugin-fs
vi.mock("@tauri-apps/plugin-fs", () => ({
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
vi.mock("@tauri-apps/api/path", () => ({
  homeDir: vi.fn(() => Promise.resolve("/Users/test")),
  pictureDir: vi.fn(() => Promise.resolve("/Users/test/Pictures")),
}));

// Mock @tauri-apps/plugin-shell
vi.mock("@tauri-apps/plugin-shell", () => ({
  open: vi.fn(),
}));

export const setMockIPCHandler = (handler: IpcHandler) => {
  ipcHandler = handler;
};

// Helper to reset all mocks between tests
export const resetTauriMocks = () => {
  vi.clearAllMocks();
  clearMocks();
  ipcHandler = createDefaultIpcHandler();
  registerIpc();
};

// Helper to reset SQL mocks specifically (useful for database tests)
export const resetSqlMocks = () => {
  mockDatabaseExecute.mockReset();
  mockDatabaseSelect.mockReset();
  mockDatabaseClose.mockReset();
};
