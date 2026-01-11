import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CollectionsSidebarSection } from "../CollectionsSidebarSection";
import { useCollections } from "../../hooks/use-collections";
import { useNavigation } from "@/hooks/use-navigation";

// Mock useCollections hook
vi.mock("../../hooks/use-collections");
vi.mock("@/hooks/use-navigation");

// Mock the Explorer context menu hook
const showContextMenuMock = vi.fn();
vi.mock("@/components/explorer/ExplorerContextMenu", () => ({
  useExplorerContextMenu: () => ({ showContextMenu: showContextMenuMock }),
}));

describe("CollectionsSidebarSection", () => {
  const mockCollections = [
    { id: 1, name: "Vacation", created_at: "", updated_at: "" },
    { id: 2, name: "Work", created_at: "", updated_at: "" },
  ];

  const mockNavigateToCollection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: { type: "explorer", folderId: null },
      navigateToExplorer: vi.fn(),
      navigateToCollection: mockNavigateToCollection,
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });
  });

  it("renders loading state", () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: [],
      isLoading: true,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection />);
    expect(screen.getByText("Loading collections...")).toBeDefined();
  });

  it("renders collections list", () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection />);
    expect(screen.getByText("Collections")).toBeDefined();
    expect(screen.getByText("Vacation")).toBeDefined();
    expect(screen.getByText("Work")).toBeDefined();
  });

  it("shows context menu with rename and delete on right click", () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection />);
    const btn = screen.getByText("Work").closest("button")!;
    fireEvent.contextMenu(btn);
    expect(showContextMenuMock).toHaveBeenCalledTimes(1);
    const menuItems = showContextMenuMock.mock.calls[0][0];
    const ids = menuItems.map((i: { id: string }) => i.id);
    expect(ids).toContain("rename");
    expect(ids).toContain("delete");
  });

  it("renames a collection via the dialog", async () => {
    const renameMock = vi.fn().mockResolvedValue({});
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: renameMock,
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection />);
    const btn = screen.getByText("Vacation").closest("button")!;
    fireEvent.contextMenu(btn);
    const renameAction = showContextMenuMock.mock.calls[0][0].find(
      (i: { id: string }) => i.id === "rename",
    );
    act(() => {
      renameAction.action();
    });

    await waitFor(() =>
      expect(screen.getByDisplayValue("Vacation")).toBeInTheDocument(),
    );
    const input = screen.getByDisplayValue("Vacation") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Renamed" } });

    const renameBtn = screen.getByRole("button", { name: /Rename/i });
    fireEvent.click(renameBtn);

    await waitFor(() =>
      expect(renameMock).toHaveBeenCalledWith({ id: 1, name: "Renamed" }),
    );
  });

  it("deletes a collection via the confirmation dialog", async () => {
    const deleteMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: deleteMock,
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection />);
    const btn = screen.getByText("Work").closest("button")!;
    fireEvent.contextMenu(btn);
    const deleteAction = showContextMenuMock.mock.calls[0][0].find(
      (i: { id: string }) => i.id === "delete",
    );
    act(() => {
      deleteAction.action();
    });

    const deleteBtn = await screen.findByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(2));
  });

  it("calls navigateToCollection when clicked", () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(<CollectionsSidebarSection />);

    fireEvent.click(screen.getByText("Vacation"));
    expect(mockNavigateToCollection).toHaveBeenCalledWith("1");
  });

  it("renders nothing if no collections", () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: [],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    const { container } = render(<CollectionsSidebarSection />);
    expect(container.firstChild).toBeNull();
  });
});
