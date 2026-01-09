import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExplorerSelectionSheet } from "../ExplorerSelectionSheet";
import { invoke } from "@tauri-apps/api/core";
import type { ExplorerItem } from "@/types/explorer";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("ExplorerSelectionSheet", () => {
  const mockEntries: ExplorerItem[] = [
    {
      id: "1",
      path: "/path/to/file1.txt",
      name: "file1.txt",
      kind: "file",
      status: "available",
      dateModified: new Date(),
      dateModifiedLabel: "Today",
      kindLabel: "File",
    },
    {
      id: "2",
      path: "/path/to/folder",
      name: "folder",
      kind: "folder",
      status: "available",
      dateModified: new Date(),
      dateModifiedLabel: "Today",
      kindLabel: "Folder",
    },
  ];

  const defaultProps = {
    isOpen: true,
    entries: mockEntries,
    onClose: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders entries correctly", () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);
    expect(screen.getByText("file1.txt")).toBeDefined();
    expect(screen.getByText("folder")).toBeDefined();
    expect(screen.getByText("/path/to/file1.txt")).toBeDefined();
  });

  it("shows empty state when no entries", () => {
    render(<ExplorerSelectionSheet {...defaultProps} entries={[]} />);
    expect(screen.getByText("No items selected yet.")).toBeDefined();
    expect(screen.getByText("0 items")).toBeDefined();
  });

  it("calls onRemove when remove button is clicked", () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);
    const removeButtons = screen.getAllByLabelText(/Remove/);
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemove).toHaveBeenCalledWith("1");
  });

  it("calls onClear when clear button is clicked", () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);
    fireEvent.click(screen.getByText("Clear all"));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it("calls default invoke action when main button is clicked without custom onAction", async () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);
    const mainButton = screen.getByText("Import to LrC");
    fireEvent.click(mainButton);
    
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("import_to_lrc", {
        files: ["/path/to/file1.txt", "/path/to/folder"],
      });
    });
  });

  it("calls custom onAction when provided", async () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    render(
      <ExplorerSelectionSheet
        {...defaultProps}
        actionLabel="Custom Action"
        onAction={onAction}
      />
    );
    
    const mainButton = screen.getByText("Custom Action");
    fireEvent.click(mainButton);
    
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith(mockEntries);
    });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("renders custom actions slot", () => {
    render(
      <ExplorerSelectionSheet
        {...defaultProps}
        renderActions={() => <button>Custom Widget</button>}
      />
    );
    expect(screen.getByText("Custom Widget")).toBeDefined();
  });
});
