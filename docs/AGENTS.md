# AGENTS.md — Repository Guidelines

This document defines how AI coding agents (Claude Code, Codex) and contributors should work in this repository.

---

## Project Overview

**Selector** is a **Tauri v2 desktop file browser**.  
It allows users to browse directories, select files, and switch between list and column view modes.

---

## Repository Structure
- Refer to [file-structure](/docs/file-structure.md)

---

## Development & Build

This repository uses **Yarn**.

- `yarn install` — Install dependencies
- `yarn dev` — Start the Vite dev server
- `yarn build` — Type-check and build for production
- `yarn preview` — Preview the production build
- `yarn tauri dev` — Run the desktop app in dev mode
- `yarn tauri build` — Build distributable desktop binaries
- `yarn test:ci` — Run all unit tests (CI mode)
- `yarn eslint .` — Run static code analysis

---

## Coding Standards

### General
- Agents should only add comments where necessary to explain complex code, as code should often be self-explanatory.

### Frontend (React / TypeScript)
- 2-space indentation, double quotes, semicolons.
- Prefer functional components and hooks.
- Explicitly type props and state.
- Use Tailwind utility classes; keep tokens centralized in `src/index.css`.
- Use **shadcn/ui** components as default UI primitives.
- **Linting Note:** Files in `src/components/ui/` and `src/components/kibo-ui/` have relaxed linting rules (unused vars, explicit any allowed). **Do not refactor these files solely to satisfy strict linting**, as they are often vendored or auto-generated.
### Backend (Rust / Tauri)
- Follow `rustfmt` defaults.
- Use `snake_case` for Tauri command names.

### Architectural Enforcement
This repository uses `eslint-plugin-boundaries` to enforce the [File Structure](/docs/file-structure.md).
- **Do not** import Feature A into Feature B.
- **Do not** import App layer code into Shared components.
- **Do not** import root files (`src/main.tsx`) into other modules.
- **Do not** disable boundary rules. If you encounter an error, refactor the code to move shared logic to `src/lib/` or `src/hooks/`.

---

## Core Hooks

- `useNavigation` — Back/forward navigation history
- `useFolderListing` — Directory listing with caching and live FS watching
- `useExplorerSelection` — Generic multi-item selection state (shared by Files and Collections)
- `useLocations` — Sidebar locations (home directory, mounted volumes)
- `useUserPreferences` — Global user preferences (text scale + theme)

---

## Path Aliases

- Use `@/` to import from `src/`  
  ```ts
  import { Button } from "@/components/ui/button";

## Testing & Quality

- **Test Framework:** Vitest is configured and required.
- **Linting:** ESLint is required for all code changes.
- **Verification:** Before requesting a review or finishing a task, agents **must** run:
  1. `yarn test:ci` (Ensure all tests pass)
  2. `yarn eslint .` (Ensure no linting errors)
- **Phase Test Gate:** For each phase, write tests before implementation steps and ask the user to verify the tests before proceeding.

- Place tests under `src/**/*.test.ts(x)`
- Refer to [testing.md](/docs/testing.md) for detailed guidelines.

## Commit Guidelines

- Every commit title must start with **at least one type prefix**, e.g.  
  `feat:`, `fix:`, `feat/refactor:`
- Follow the prefix with a concise, imperative summary.
- Include a short bullet list (1–3 bullets) describing intent and impact.
- Keep commits narrowly scoped; avoid unrelated changes.

---

## Documentation Standards

- **Global Hub (`docs/`):** Infrastructure, architecture notes, and shared strategies (e.g., `docs/database.md`).
- **Feature Spoke (`src/features/<feature>/docs/`):** Technical schemas, invariants, and API surfaces specific to a feature.
- **Continuous Update (User-Verified):** Do not assume what should be documented. Propose candidate updates, ask the user what to add, and only update documentation after explicit verification.

---

## Pull Request Guidelines

### PR Title Format
- PR titles must start with a bracketed type: `[Feat]`, `[Fix]`, `[Chore]`, `[Refactor]`, `[Feat/Refactor]`, `[Docs]`, or `[Test]`.
- Preferred example: `[Feat] Persist and Manage Custom Favorites in Explorer UI`

### Required Structure
- **PR Title**
- **Description**: 1–3 sentences explaining what changed and why.
- **Key Changes**: include concise technical detail for core functionality or complex logic. Prefer file paths or module/component names when relevant.

### Optional Sections (when relevant)
- **Data Model**
- **Behavior Notes**

### Other Requirements
- Link related issues or tickets when applicable.
- Include screenshots or recordings for UI changes.
- Explicitly call out any changes to Tauri config, permissions, or capabilities.
- Ensure all commits comply with the commit guidelines above.

### Sample PR Structure
```markdown
# [Type] Short, descriptive PR title

<Description paragraph explaining what changed and why. 1–3 sentences.>

# Key Changes
- Example: <core change with technical detail> (`path/to/file`)
- Add favorites actions to list and sidebar context menus with optimistic updates and error toasts.
  - File list actions and normalization: `src/features/file-explorer/components/FileListView.tsx`
  - Sidebar actions and status handling: `src/features/file-explorer/components/LocationsSidebar.tsx`

# Data Model
- Example: <schema or storage change>
- New table `favorite_locations` stores `path` with a unique constraint and `created_at` timestamp. Used to persist custom favorites across sessions.

# Behavior Notes
- Example: <behavior, edge case, or failure mode>
```
