import { vi } from "vitest";

// Mock @tauri-apps/api/event
export const mockEmit = vi.fn();
export const mockListen = vi.fn();

let listeners: Record<
  string,
  Array<(event: { payload?: unknown }) => void>
> = {};

mockListen.mockImplementation(
  (name: string, callback: (event: { payload?: unknown }) => void) => {
    if (!listeners[name]) listeners[name] = [];
    listeners[name].push(callback);
    return Promise.resolve(() => {
      listeners[name] = listeners[name].filter((l) => l !== callback);
    });
  },
);

mockEmit.mockImplementation((name: string, payload?: unknown) => {
  if (listeners[name]) {
    listeners[name].forEach((l) => l({ payload }));
  }
  return Promise.resolve();
});

vi.mock("@tauri-apps/api/event", () => ({
  emit: (name: string, payload?: unknown) => mockEmit(name, payload),
  listen: (name: string, callback: (event: { payload?: unknown }) => void) =>
    mockListen(name, callback),
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
}));

// Mock @tauri-apps/api/app
vi.mock("@tauri-apps/api/app", () => ({
  getName: vi.fn(() => Promise.resolve("Test App")),
}));

// Mock @tauri-apps/api/menu
type MenuEntry = {
  id?: string;
};

class Menu {
  private _items: MenuEntry[];

  constructor({ items = [] }: { items?: MenuEntry[] } = {}) {
    this._items = items;
  }

  static async default() {
    return new Menu();
  }

  static async new({ items = [] }: { items?: MenuEntry[] } = {}) {
    return new Menu({ items });
  }

  async items() {
    return this._items;
  }

  async setAsAppMenu() {
    return undefined;
  }

  async popup() {
    return undefined;
  }
}

class MenuItem {
  id?: string;
  text?: string;
  enabled?: boolean;
  action?: (id: string) => void;

  constructor(
    options: {
      id?: string;
      text?: string;
      enabled?: boolean;
      action?: (id: string) => void;
    } = {},
  ) {
    this.id = options.id;
    this.text = options.text;
    this.enabled = options.enabled;
    this.action = options.action;
  }

  static async new(options: {
    id?: string;
    text?: string;
    enabled?: boolean;
    action?: (id: string) => void;
  }) {
    return new MenuItem(options);
  }
}

class CheckMenuItem extends MenuItem {
  checked?: boolean;

  constructor(
    options: {
      id?: string;
      text?: string;
      enabled?: boolean;
      action?: (id: string) => void;
      checked?: boolean;
    } = {},
  ) {
    super(options);
    this.checked = options.checked;
  }

  static async new(options: {
    id?: string;
    text?: string;
    enabled?: boolean;
    action?: (id: string) => void;
    checked?: boolean;
  }) {
    return new CheckMenuItem(options);
  }

  async setChecked(checked: boolean) {
    this.checked = checked;
    return undefined;
  }
}

class PredefinedMenuItem {
  item?: string;
  id?: string;

  constructor(options: { item?: string; id?: string } = {}) {
    this.item = options.item;
    this.id = options.id;
  }

  static async new(options: { item?: string; id?: string }) {
    return new PredefinedMenuItem(options);
  }
}

class Submenu {
  id?: string;
  private _text: string;
  private _items: MenuEntry[];

  constructor(
    options: { id?: string; text?: string; items?: MenuEntry[] } = {},
  ) {
    this.id = options.id;
    this._text = options.text ?? "";
    this._items = options.items ?? [];
  }

  static async new(options: {
    id?: string;
    text?: string;
    items?: MenuEntry[];
  }) {
    return new Submenu(options);
  }

  async text() {
    return this._text;
  }

  async items() {
    return this._items;
  }

  async get(id: string) {
    return this._items.find((item) => item.id === id);
  }

  async append(items: MenuEntry[]) {
    this._items.push(...items);
    return undefined;
  }

  async insert(items: MenuEntry[], index: number) {
    this._items.splice(index, 0, ...items);
    return undefined;
  }
}

vi.mock("@tauri-apps/api/menu", () => ({
  Menu,
  MenuItem,
  Submenu,
  PredefinedMenuItem,
  CheckMenuItem,
}));

// Mock @tauri-apps/plugin-shell
vi.mock("@tauri-apps/plugin-shell", () => ({
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
