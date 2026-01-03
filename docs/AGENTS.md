# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the React + TypeScript UI; entry points are `src/main.tsx` and `src/App.tsx`.
- `src/lib/` contains shared helpers (for example, `src/lib/utils.ts`).
- `src/assets/` and `public/` store static assets and icons served by Vite.
- `src-tauri/` contains the Rust backend and Tauri configuration (`src-tauri/src`, `src-tauri/tauri.conf.json`).
- Root configs include `vite.config.ts`, `tsconfig.json`, and `index.html`.

## Build, Test, and Development Commands
Use `yarn` for this repo.
- `yarn install`: install dependencies.
- `yarn dev`: start the Vite dev server for the web UI.
- `yarn build`: run TypeScript checks and produce a production build.
- `yarn preview`: serve the production build locally.
- `yarn tauri dev`: run the desktop app with Tauri in dev mode.
- `yarn tauri build`: bundle the desktop app for distribution.

## Coding Style & Naming Conventions
- Follow existing formatting: 2-space indentation, double quotes, and semicolons in TS/TSX.
- Prefer functional React components and hooks; keep props and state typing explicit.
- Use Tailwind utility classes in JSX and keep tokens centralized in `src/index.css`.
- Use shadcn components as the default building blocks for UI.
- For Rust in `src-tauri/src`, follow rustfmt defaults and keep Tauri command names in `snake_case`.

## Testing Guidelines
- No test framework is configured yet. If you add tests, prefer Vitest and place files as `src/**/*.test.ts(x)`.
- Update this guide with any new test commands or coverage expectations.

## Commit & Pull Request Guidelines
- Use commit messages with a concise summary line followed by a short bullet list.
- Keep subjects imperative and focused (e.g., "Add settings panel"), and keep the bullets to 1–3 lines.
- PRs should include a clear summary, linked issues when applicable, and screenshots for UI changes.
- Call out changes to Tauri config or capabilities explicitly.
