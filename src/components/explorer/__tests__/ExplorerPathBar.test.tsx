import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExplorerPathBar, type PathSegment } from "../ExplorerPathBar";

describe("ExplorerPathBar", () => {
  const mockSegments: PathSegment[] = [
    { id: "root", path: "/users/test", name: "Home", isRoot: true },
    { id: "folder1", path: "/users/test/documents", name: "Documents", isRoot: false },
    { id: "folder2", path: "/users/test/documents/work", name: "Work", isRoot: false },
  ];

  it("should render nothing when no segments are provided", () => {
    const { container } = render(
      <ExplorerPathBar segments={[]} onNavigate={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render all segments with correct names", () => {
    render(<ExplorerPathBar segments={mockSegments} onNavigate={vi.fn()} />);

    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Documents")).toBeDefined();
    expect(screen.getByText("Work")).toBeDefined();
  });

  it("should call onNavigate when a non-last segment is clicked", () => {
    const onNavigate = vi.fn();
    render(<ExplorerPathBar segments={mockSegments} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText("Documents"));
    expect(onNavigate).toHaveBeenCalledWith(mockSegments[1]);
  });

  it("should not render a link for the last segment", () => {
    render(<ExplorerPathBar segments={mockSegments} onNavigate={vi.fn()} />);

    const lastSegment = screen.getByText("Work");
    // In our implementation, non-links are just spans or similar, while links are buttons
    expect(lastSegment.closest("button")).toBeNull();
  });

  it("should render buttons for non-last segments", () => {
    render(<ExplorerPathBar segments={mockSegments} onNavigate={vi.fn()} />);

    expect(screen.getByText("Home").closest("button")).not.toBeNull();
    expect(screen.getByText("Documents").closest("button")).not.toBeNull();
  });
});
