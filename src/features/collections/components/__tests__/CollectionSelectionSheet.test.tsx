import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CollectionSelectionSheet } from "../CollectionSelectionSheet";
import type { ExplorerItem } from "@/types/explorer";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/recent-apps", () => ({
  getRecentApps: vi.fn().mockResolvedValue([]),
  addRecentApp: vi.fn(),
}));

vi.mock("../../hooks/use-collection-items", () => ({
  useCollectionItems: () => ({
    removeItemByPath: vi.fn(),
  }),
}));

vi.mock("@/components/explorer/RecentAppsPicker", () => ({
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

describe("CollectionSelectionSheet", () => {
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
    collectionId: 1,
    isOpen: true,
    entries: mockEntries,
    onClose: vi.fn(),
    onRemove: vi.fn(),
    onClear: vi.fn(),
    onRequestMove: vi.fn(),
    onRequestCopy: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders entries correctly", () => {
    render(<CollectionSelectionSheet {...defaultProps} />);
    expect(screen.getByText("file1.jpg")).toBeDefined();
    expect(screen.getByText("file2.jpg")).toBeDefined();
    expect(screen.getByText("/path/to/file1.jpg")).toBeDefined();
  });

  it("shows empty state when no entries", () => {
    render(<CollectionSelectionSheet {...defaultProps} entries={[]} />);
    expect(screen.getByText("No items selected yet.")).toBeDefined();
    expect(screen.getByText("0 items")).toBeDefined();
  });

  it("calls onRemove when remove button is clicked", () => {
    render(<CollectionSelectionSheet {...defaultProps} />);
    const removeButtons = screen.getAllByLabelText(/Remove/);
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemove).toHaveBeenCalledWith("/path/to/file1.jpg");
  });

  it("calls onClear when clear button is clicked", () => {
    render(<CollectionSelectionSheet {...defaultProps} />);
    fireEvent.click(screen.getByText("Clear all"));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it("shows Open All with button", () => {
    render(<CollectionSelectionSheet {...defaultProps} />);
    expect(screen.getByText("Open All with...")).toBeDefined();
  });

  it("disables button when no entries", () => {
    render(<CollectionSelectionSheet {...defaultProps} entries={[]} />);
    const button = screen.getByText("Open All with...") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("renders collection actions", () => {
    render(<CollectionSelectionSheet {...defaultProps} />);
    expect(screen.getByText(/Move to/i)).toBeDefined();
    expect(screen.getByText(/Copy to/i)).toBeDefined();
    expect(screen.getByText(/Remove from Collection/i)).toBeDefined();
  });

  it("displays correct item count", () => {
    render(<CollectionSelectionSheet {...defaultProps} />);
    expect(screen.getByText("2 items")).toBeDefined();
  });

  it("opens app picker directly for files-only selection", async () => {
    render(<CollectionSelectionSheet {...defaultProps} />);

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

    render(<CollectionSelectionSheet {...defaultProps} entries={entries} />);

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

    render(<CollectionSelectionSheet {...defaultProps} entries={entries} />);

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

    render(<CollectionSelectionSheet {...defaultProps} entries={entries} />);

    fireEvent.click(screen.getByRole("button", { name: /open all with/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText(/resolve selection/i)).toBeNull();
    });
    expect(screen.getByRole("button", { name: /open all with/i })).toBeDefined();
  });
});
