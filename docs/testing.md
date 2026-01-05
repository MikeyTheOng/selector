# Testing Guide - Selector

## Philosophy: Strict Mocking
Selector follows a **Strict Mocking** strategy for all frontend tests. This means:
1. **No Native Execution:** Frontend tests must **never** trigger actual Rust commands or attempt to read/write from the physical file system.
2. **Speed & Safety:** By avoiding native side-effects, we ensure the test suite remains extremely fast (<15s) and safe to run in any environment.
3. **Isolation:** We test the application logic and UI components in isolation from the operating system.

## Test Structure
- **Global Mocks:** Located in `src/test/mocks/`. These provide shared mocks for Tauri APIs.
- **Unit & Component Tests:** Located alongside the code they test, following the pattern: `src/features/<feature-name>/__tests__/<filename>.test.tsx`.
- **Backend Tests:** Standard Rust tests located within `src-tauri/src/`.

## Mocking Tauri APIs
Tauri APIs are globally mocked in `src/test/mocks/tauri.ts`. You can override these mocks in individual tests to simulate specific backend behaviors.

### Example: Mocking `readDir`
```typescript
import { readDir } from '@tauri-apps/plugin-fs';
import { vi } from 'vitest';

vi.mocked(readDir).mockResolvedValue([
  { name: 'file.txt', isFile: true, isDirectory: false },
]);
```

## Available Commands

### Frontend (Yarn)
- `yarn test` - Runs Vitest in watch mode (recommended for TDD).
- `yarn test:ci` - Runs all tests once and exits (used in CI/CD).

### Backend (Cargo)
- `yarn test:rust` - Runs all Rust backend tests.


