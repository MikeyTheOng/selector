import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExplorerSelectionSheet } from "../ExplorerSelectionSheet";
import type { ExplorerItem } from "@/types/explorer";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock recent-apps module
vi.mock("@/lib/recent-apps", () => ({
  getRecentApps: vi.fn().mockResolvedValue([]),
  addRecentApp: vi.fn(),
}));

vi.mock("../RecentAppsPicker", () => ({
  RecentAppsPicker: ({
    isOpen,
    extension,
    filePaths,
    onClose,
  }: {
    isOpen: boolean;
    extension: string;
    filePaths: string[];
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <div>RecentAppsPicker</div>
        <div data-testid="recent-apps-extension">{extension}</div>
        <div data-testid="recent-apps-paths">{filePaths.join(",")}</div>
        <button type="button" onClick={onClose}>
          Close Picker
        </button>
      </div>
    ) : null,
}));

// Mock file-groups module
vi.mock("@/lib/file-groups", () => ({
  groupFilesByMediaType: vi.fn((files) => ({
    images: { type: "image", files: [], extensions: new Set() },
    videos: { type: "video", files: [], extensions: new Set() },
    others: { type: "other", files: files, extensions: new Set() },
    hasImages: false,
    hasVideos: false,
    hasOthers: files.length > 0,
    hasMultipleTypes: false,
  })),
  getFirstExtension: vi.fn((files) => files[0]?.extension),
  getFileCountLabel: vi.fn((count, type) => `${count} ${type}s`),
}));

describe("ExplorerSelectionSheet", () => {
  const mockEntries: ExplorerItem[] = [
    {
      path: "/path/to/file1.jpg",
      name: "file1.jpg",
      kind: "file",
      status: "available",
      extension: "jpg",
      dateModified: new Date(),
      dateModifiedLabel: "Today",
      kindLabel: "Image",
    } as ExplorerItem,
    {
      path: "/path/to/file2.jpg",
      name: "file2.jpg",
      kind: "file",
      status: "available",
      extension: "jpg",
      dateModified: new Date(),
      dateModifiedLabel: "Today",
      kindLabel: "Image",
    } as ExplorerItem,
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
    expect(screen.getByText("file1.jpg")).toBeDefined();
    expect(screen.getByText("file2.jpg")).toBeDefined();
    expect(screen.getByText("/path/to/file1.jpg")).toBeDefined();
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
    expect(defaultProps.onRemove).toHaveBeenCalledWith("/path/to/file1.jpg");
  });

  it("calls onClear when clear button is clicked", () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);
    fireEvent.click(screen.getByText("Clear all"));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it("shows Open All with button", () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);
    expect(screen.getByText("Open All with...")).toBeDefined();
  });

  it("disables button when no entries", () => {
    render(<ExplorerSelectionSheet {...defaultProps} entries={[]} />);
    const button = screen.getByText("Open All with...") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("renders custom actions slot", () => {
    render(
      <ExplorerSelectionSheet
        {...defaultProps}
        renderActions={() => <button>Custom Widget</button>}
      />,
    );
    expect(screen.getByText("Custom Widget")).toBeDefined();
  });

  it("displays correct item count", () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);
    expect(screen.getByText("2 items")).toBeDefined();
  });

  it("opens app picker directly for files-only selection", async () => {
    render(<ExplorerSelectionSheet {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /open all with/i }));

    await waitFor(() => {
      expect(screen.getByText("RecentAppsPicker")).toBeDefined();
    });
    expect(screen.queryByText(/resolve selection/i)).toBeNull();
  });

  it("opens resolution modal for selections with folders", () => {
    const entries = [
      ...mockEntries,
      {
        path: "/path/to/folder",
        name: "folder",
        kind: "folder",
        status: "available",
        dateModified: new Date(),
        dateModifiedLabel: "Today",
        kindLabel: "Folder",
      } as ExplorerItem,
    ];

    render(<ExplorerSelectionSheet {...defaultProps} entries={entries} />);

    fireEvent.click(screen.getByRole("button", { name: /open all with/i }));

    expect(screen.getByText(/resolve selection/i)).toBeDefined();
    expect(screen.queryByText("RecentAppsPicker")).toBeNull();
  });

  it("proceeds from modal and opens app picker with resolved paths", async () => {
    const entries = [
      ...mockEntries,
      {
        path: "/path/to/folder",
        name: "folder",
        kind: "folder",
        status: "available",
        dateModified: new Date(),
        dateModifiedLabel: "Today",
        kindLabel: "Folder",
      } as ExplorerItem,
    ];

    render(<ExplorerSelectionSheet {...defaultProps} entries={entries} />);

    fireEvent.click(screen.getByRole("button", { name: /open all with/i }));
    fireEvent.click(screen.getByLabelText(/files only/i));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /open with/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /open with/i }));

    await waitFor(() => {
      expect(screen.getByText("RecentAppsPicker")).toBeDefined();
    });
    expect(screen.getByTestId("recent-apps-paths").textContent).toContain(
      "/path/to/file1.jpg",
    );
  });

  it("closes the resolution modal when cancel is clicked", async () => {
    const entries = [
      ...mockEntries,
      {
        path: "/path/to/folder",
        name: "folder",
        kind: "folder",
        status: "available",
        dateModified: new Date(),
        dateModifiedLabel: "Today",
        kindLabel: "Folder",
      } as ExplorerItem,
    ];

    render(<ExplorerSelectionSheet {...defaultProps} entries={entries} />);

    fireEvent.click(screen.getByRole("button", { name: /open all with/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText(/resolve selection/i)).toBeNull();
    });
    expect(screen.getByRole("button", { name: /open all with/i })).toBeDefined();
  });
});
