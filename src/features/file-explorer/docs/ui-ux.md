# File Explorer UI/UX & Interaction Model

This document describes the interaction model for the Selector File Explorer, covering mouse behaviors, keyboard navigation, and visual feedback states.

## 🖱 Mouse Interactions

### List View
- **Single Click:** Selects the item (file or folder). Updates focus and range selection anchor.
- **Double Click (Folder):** Navigates into the folder.
- **Cmd/Ctrl + Click:** Toggles selection of the item (additive).
- **Shift + Click:** Selects a range of items from the last anchor to the clicked item.

### Column View
- **Single Click (Folder):** Navigates into the folder (opens next column) but does **not** add it to the selection set. Updates focus and range anchor.
- **Single Click (File):** Selects the file.
- **Cmd/Ctrl + Click (Folder):** Navigates into the folder AND toggles its selection state for the "shopping cart".
- **Double Click (Folder):** Navigates into the folder (same as single click in this view).

---

## ⌨️ Keyboard Navigation

Keyboard interaction uses a **Decoupled Focus** model, where the focused item (indicated by a ring) is distinct from the selected item(s) (indicated by a solid background).

### Navigation
- **Arrow Up / Down:** Moves focus to the previous/next item.
  - If no item is focused: `Up` starts from the bottom, `Down` starts from the top.
- **Arrow Left (Column View):** Navigates to the parent folder's column.
- **Arrow Right (Column View):** Navigates into the focused folder.
- **Enter:** 
  - **List View:** Navigates into the focused folder.
  - **Column View:** Navigates into the focused folder.

### Selection
- **Cmd/Ctrl + Enter:** Toggles the selection of the currently focused item.
- **Shift + Arrow Up / Down:** Extends the selection range from the current anchor to the new focus.
- **Cmd/Ctrl + A:** Selects all files in the current folder.

---

## 🎨 Visual States

### Focus Indicator
Items targeted by keyboard navigation or the last click are highlighted with a **focus ring** (`ring-1 ring-ring`). This indicator is visible even if the item is not "selected" for action.

### Selection State
Items explicitly selected for the "shopping cart" (export/import) are highlighted with the **primary theme color** (`bg-primary`).

### Active Path (Column View)
Folders that form the current navigation path but are not explicitly selected are highlighted with a **neutral accent** (`bg-active-path`) and **medium font weight** to distinguish them from actionable selections.

---

## 🛠 Developer Implementation Details

- **Hook:** `useFileSelection` maintains `focusedFile` and `lastClickedFile` (anchor).
- **Persistence:** Navigating between folders preserves the selection set (the "shopping cart").
- **Consistency:** Both folders and files are mapped to a `FileRow` structure internally in views to ensure consistent selection logic.
