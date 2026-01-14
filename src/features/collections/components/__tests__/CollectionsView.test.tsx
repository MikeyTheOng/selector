import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CollectionsView } from "../CollectionsView";
import { useCollections } from "../../hooks/use-collections";
import { useCollectionItems } from "../../hooks/use-collection-items";
import { useNavigation } from "@/hooks/use-navigation";
import { useExplorerSelection } from "@/hooks/explorer/use-explorer-selection";
import type { CollectionItemWithStatus } from "../../types";
import type { ExplorerItem } from "@/types/explorer";

// Mock hooks
vi.mock("../../hooks/use-collections");
vi.mock("../../hooks/use-collection-items");
vi.mock("@/hooks/use-navigation");

// Mock components
let capturedSelectionSheetProps: {
  renderActions?: (entries: ExplorerItem[]) => React.ReactNode;
} | null = null;

vi.mock("@/components/explorer/ExplorerSelectionSheet", () => ({
  ExplorerSelectionSheet: (props: {
    renderActions?: (entries: ExplorerItem[]) => React.ReactNode;
  }) => {
    capturedSelectionSheetProps = props;
    return <div data-testid="selection-sheet" />;
  },
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  ask: vi.fn(),
  message: vi.fn(),
  save: vi.fn(),
}));

// Store handlers so tests can invoke them
let capturedDoubleClickHandler: ((item: ExplorerItem) => void) | undefined;
let capturedContextMenuHandler:
  | ((item: ExplorerItem, event: React.MouseEvent) => void)
  | undefined;

const mockShowContextMenu = vi.fn();

vi.mock("@/components/explorer/ExplorerContextMenu", () => ({
  useExplorerContextMenu: () => ({
    showContextMenu: mockShowContextMenu,
  }),
}));

vi.mock("@/components/explorer/ExplorerListView", () => ({
  ExplorerListView: ({
    items,
    onItemDoubleClick,
    onItemContextMenu,
  }: {
    items: ExplorerItem[];
    onItemDoubleClick?: (item: ExplorerItem) => void;
    onItemContextMenu?: (item: ExplorerItem, event: React.MouseEvent) => void;
  }) => {
    capturedDoubleClickHandler = onItemDoubleClick;
    capturedContextMenuHandler = onItemContextMenu;
    return (
      <div data-testid="explorer-list-view">
        {items.map((f) => (
          <div key={f.path} data-testid={`item-${f.path}`}>
            {f.name} - {f.kindLabel} - {f.status}
          </div>
        ))}
      </div>
    );
  },
}));

describe("CollectionsView", () => {
  const mockCollection = {
    id: 1,
    name: "My Collection",
    created_at: "",
    updated_at: "",
  };
  const mockItems: CollectionItemWithStatus[] = [
    {
      id: 1,
      collection_id: 1,
      path: "/test/file1.txt",
      item_type: "file",
      added_at: "2024-01-01",
      status: "available",
    },
  ];

  const mockNavigateToExplorer = vi.fn();

  const mockCollectionItemsReturn = {
    items: mockItems,
    isLoading: false,
    error: null,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    removeItemByPath: vi.fn(),
    refetch: vi.fn(),
    relinkItem: vi.fn(),
    relinkFolder: vi.fn(),
  };

  const mockSelection = {
    selectedItems: {},
    selectedEntries: [],
    focusedItem: null,
    lastClickedItem: null,
    selectCollectionItem: vi.fn(),
    selectMultipleCollectionItems: vi.fn(),
    toggleCollectionItemSelection: vi.fn(),
    focusItem: vi.fn(),
    removeSelection: vi.fn(),
    clearSelections: vi.fn(),
    selectItem: vi.fn(),
    selectMultiple: vi.fn(),
    toggleSelection: vi.fn(),
    selectedCount: 0,
    selectRange: vi.fn(),
    updateLastClickedItem: vi.fn(),
    clearLastClickedItem: vi.fn(),
    clearFocus: vi.fn(),
    getCachedItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedDoubleClickHandler = undefined;
    vi.mocked(useNavigation).mockReturnValue({
      currentRoute: { type: "collection", collectionId: "1" },
      navigateToExplorer: mockNavigateToExplorer,
      navigateToCollection: vi.fn(),
      canGoBack: false,
      canGoForward: false,
      goBack: vi.fn(),
      goForward: vi.fn(),
    });
    vi.mocked(useCollections).mockReturnValue({
      collections: [mockCollection],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });
    vi.mocked(useCollectionItems).mockReturnValue(mockCollectionItemsReturn);
  });

  it("renders item list", () => {
    render(
      <CollectionsView
        collectionId="1"
        isSelectionOpen={false}
        setIsSelectionOpen={vi.fn()}
        selection={
          mockSelection as unknown as ReturnType<typeof useExplorerSelection>
        }
      />,
    );
    expect(screen.getByText(/file1.txt/i)).toBeDefined();
  });

  it("does not render toolbar", () => {
    render(
      <CollectionsView
        collectionId="1"
        isSelectionOpen={false}
        setIsSelectionOpen={vi.fn()}
        selection={
          mockSelection as unknown as ReturnType<typeof useExplorerSelection>
        }
      />,
    );
    // ExplorerToolbar title
    expect(screen.queryByText("Collection Toolbar (Placeholder)")).toBeNull();
    // Previous internal toolbar title
    expect(
      screen.queryByText("My Collection", { selector: ".toolbar-title-class" }),
    ).toBeNull();
  });

  it("renders loading state", () => {
    vi.mocked(useCollectionItems).mockReturnValue({
      ...mockCollectionItemsReturn,
      items: [],
      isLoading: true,
    });

    render(
      <CollectionsView
        collectionId="1"
        isSelectionOpen={false}
        setIsSelectionOpen={vi.fn()}
        selection={
          mockSelection as unknown as ReturnType<typeof useExplorerSelection>
        }
      />,
    );
    expect(screen.getByText("Loading items...")).toBeDefined();
  });

  it("renders file list when items loaded", () => {
    render(
      <CollectionsView
        collectionId="1"
        isSelectionOpen={false}
        setIsSelectionOpen={vi.fn()}
        selection={
          mockSelection as unknown as ReturnType<typeof useExplorerSelection>
        }
      />,
    );
    expect(screen.getByTestId("explorer-list-view")).toBeDefined();
  });

  it("displays status for items", () => {
    const missingItems: CollectionItemWithStatus[] = [
      {
        id: 2,
        collection_id: 1,
        path: "/test/missing.txt",
        item_type: "file",
        added_at: "2024-01-01",
        status: "missing",
      },
    ];

    vi.mocked(useCollectionItems).mockReturnValue({
      ...mockCollectionItemsReturn,
      items: missingItems,
    });

    render(
      <CollectionsView
        collectionId="1"
        isSelectionOpen={false}
        setIsSelectionOpen={vi.fn()}
        selection={
          mockSelection as unknown as ReturnType<typeof useExplorerSelection>
        }
      />,
    );
    expect(screen.getByText(/missing/i)).toBeDefined();
  });

  it("shows error if collection not found", () => {
    vi.mocked(useCollections).mockReturnValue({
      collections: [],
      isLoading: false,
      error: null,
      createCollection: vi.fn(),
      updateCollection: vi.fn(),
      deleteCollection: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <CollectionsView
        collectionId="999"
        isSelectionOpen={false}
        setIsSelectionOpen={vi.fn()}
        selection={
          mockSelection as unknown as ReturnType<typeof useExplorerSelection>
        }
      />,
    );
    expect(screen.getByText("Collection not found")).toBeDefined();
  });

  describe("double-click navigation", () => {
    it("navigates to parent folder when double-clicking an available file", () => {
      const fileItems: CollectionItemWithStatus[] = [
        {
          id: 1,
          collection_id: 1,
          path: "/Users/test/documents/photo.jpg",
          item_type: "file",
          added_at: "2024-01-01",
          status: "available",
        },
      ];

      vi.mocked(useCollectionItems).mockReturnValue({
        ...mockCollectionItemsReturn,
        items: fileItems,
      });

      render(
        <CollectionsView
          collectionId="1"
          isSelectionOpen={false}
          setIsSelectionOpen={vi.fn()}
          selection={
            mockSelection as unknown as ReturnType<
              typeof useExplorerSelection
            >
          }
        />,
      );

      // Simulate double-click on the file
      const explorerItem = {
        path: "/Users/test/documents/photo.jpg",
        name: "photo.jpg",
        kind: "file" as const,
        status: "available" as const,
        dateModified: new Date(),
        dateModifiedLabel: "Today at 1:00pm",
        kindLabel: "File",
        extension: "jpg",
      } as ExplorerItem;

      capturedDoubleClickHandler?.(explorerItem);

      expect(mockNavigateToExplorer).toHaveBeenCalledWith(
        "/Users/test/documents",
        {
          focusItemPath: "/Users/test/documents/photo.jpg",
        },
      );
    });

    it("navigates to folder when double-clicking an available folder", () => {
      const folderItems: CollectionItemWithStatus[] = [
        {
          id: 2,
          collection_id: 1,
          path: "/Users/test/documents",
          item_type: "folder",
          added_at: "2024-01-01",
          status: "available",
        },
      ];

      vi.mocked(useCollectionItems).mockReturnValue({
        ...mockCollectionItemsReturn,
        items: folderItems,
      });

      render(
        <CollectionsView
          collectionId="1"
          isSelectionOpen={false}
          setIsSelectionOpen={vi.fn()}
          selection={
            mockSelection as unknown as ReturnType<
              typeof useExplorerSelection
            >
          }
        />,
      );

      const explorerItem = {
        path: "/Users/test/documents",
        name: "documents",
        kind: "folder" as const,
        status: "available" as const,
        dateModified: new Date(),
        dateModifiedLabel: "Today at 1:00pm",
        kindLabel: "Folder",
      } as ExplorerItem;

      capturedDoubleClickHandler?.(explorerItem);

      expect(mockNavigateToExplorer).toHaveBeenCalledWith(
        "/Users/test/documents",
      );
    });

    it("does not navigate for missing/offline items (keeps relink behavior)", () => {
      const missingItems: CollectionItemWithStatus[] = [
        {
          id: 3,
          collection_id: 1,
          path: "/Volumes/External/file.txt",
          item_type: "file",
          added_at: "2024-01-01",
          status: "offline",
        },
      ];

      vi.mocked(useCollectionItems).mockReturnValue({
        ...mockCollectionItemsReturn,
        items: missingItems,
      });

      render(
        <CollectionsView
          collectionId="1"
          isSelectionOpen={false}
          setIsSelectionOpen={vi.fn()}
          selection={
            mockSelection as unknown as ReturnType<
              typeof useExplorerSelection
            >
          }
        />,
      );

      const explorerItem = {
        path: "/Volumes/External/file.txt",
        name: "file.txt",
        kind: "file" as const,
        status: "offline" as const,
        dateModified: new Date(),
        dateModifiedLabel: "Today at 1:00pm",
        kindLabel: "File",
        extension: "txt",
      } as ExplorerItem;

      capturedDoubleClickHandler?.(explorerItem);

      // Should NOT navigate - instead it should trigger the relink dialog (not tested here)
      expect(mockNavigateToExplorer).not.toHaveBeenCalled();
    });
  });

  describe("context menu", () => {
    it("shows context menu with correct items", () => {
      render(
        <CollectionsView
          collectionId="1"
          isSelectionOpen={false}
          setIsSelectionOpen={vi.fn()}
          selection={
            mockSelection as unknown as ReturnType<
              typeof useExplorerSelection
            >
          }
        />,
      );

      const itemToClick = {
        path: "/test/file1.txt",
        name: "file1.txt",
        kind: "file" as const,
        status: "available" as const,
        dateModified: new Date(),
        dateModifiedLabel: "Jan 1, 2024",
        kindLabel: "Text document",
        extension: "txt",
      } as ExplorerItem;

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;
      capturedContextMenuHandler?.(itemToClick, mockEvent);

      expect(mockShowContextMenu).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: "Reveal in Explorer",
            enabled: true,
          }),
          expect.objectContaining({ text: "Remove from Collection" }),
        ]),
      );
    });

    it("executes Reveal in Explorer action", () => {
      render(
        <CollectionsView
          collectionId="1"
          isSelectionOpen={false}
          setIsSelectionOpen={vi.fn()}
          selection={
            mockSelection as unknown as ReturnType<
              typeof useExplorerSelection
            >
          }
        />,
      );

      const itemToClick = {
        path: "/test/file1.txt",
        name: "file1.txt",
        kind: "file" as const,
        status: "available" as const,
        dateModified: new Date(),
        dateModifiedLabel: "Jan 1, 2024",
        kindLabel: "Text document",
        extension: "txt",
      } as ExplorerItem;

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;
      capturedContextMenuHandler?.(itemToClick, mockEvent);

      const revealAction = mockShowContextMenu.mock.calls[0][0].find(
        (i: { id: string }) => i.id === "reveal",
      );
      revealAction.action();

      expect(mockNavigateToExplorer).toHaveBeenCalledWith("/test", {
        focusItemPath: "/test/file1.txt",
      });
    });

    it("executes Remove from Collection action", () => {
      const mockRemoveItem = vi.fn();
      vi.mocked(useCollectionItems).mockReturnValue({
        ...mockCollectionItemsReturn,
        items: mockItems,
        removeItem: mockRemoveItem,
      });

      render(
        <CollectionsView
          collectionId="1"
          isSelectionOpen={false}
          setIsSelectionOpen={vi.fn()}
          selection={
            mockSelection as unknown as ReturnType<
              typeof useExplorerSelection
            >
          }
        />,
      );

      const itemToClick = {
        path: "/test/file1.txt",
        name: "file1.txt",
        kind: "file" as const,
        status: "available" as const,
        dateModified: new Date(),
        dateModifiedLabel: "Jan 1, 2024",
        kindLabel: "Text document",
        extension: "txt",
      } as ExplorerItem;

      const mockEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;
      capturedContextMenuHandler?.(itemToClick, mockEvent);

      const removeAction = mockShowContextMenu.mock.calls[0][0].find(
        (i: { id: string }) => i.id === "remove",
      );
      removeAction.action();

      expect(mockRemoveItem).toHaveBeenCalledWith(1);
    });
  });

  describe("selection sheet actions", () => {
    it("passes collection actions to ExplorerSelectionSheet", () => {
      render(
        <CollectionsView
          collectionId="1"
          isSelectionOpen={true}
          setIsSelectionOpen={vi.fn()}
          selection={
            mockSelection as unknown as ReturnType<
              typeof useExplorerSelection
            >
          }
        />,
      );

      expect(capturedSelectionSheetProps).not.toBeNull();
      expect(capturedSelectionSheetProps!.renderActions).toBeDefined();

      render(
        capturedSelectionSheetProps!.renderActions!([
          {
            name: "Item 1",
            path: "/1",
            kind: "file",
            status: "available",
            dateModified: new Date(),
            dateModifiedLabel: "Jan 1, 2024",
            kindLabel: "Text document",
            extension: "txt",
          } as ExplorerItem,
        ]),
      );

      expect(screen.getByText(/Move to/i)).toBeDefined();
      expect(screen.getByText(/Copy to/i)).toBeDefined();
      expect(screen.getByText(/Remove from Collection/i)).toBeDefined();
    });
  });
});
