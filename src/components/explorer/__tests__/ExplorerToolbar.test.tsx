import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExplorerToolbar } from "../ExplorerToolbar";

describe("ExplorerToolbar", () => {
  const defaultProps = {
    viewMode: "list" as const,
    onViewModeChange: vi.fn(),
    fileCount: 10,
    folderCount: 5,
  };

  it("should render item counts correctly", () => {
    render(<ExplorerToolbar {...defaultProps} />);
    expect(screen.getByText(/10 files - 5 folders/)).toBeDefined();
  });

  it("should render selection panel slot when provided", () => {
    render(
      <ExplorerToolbar
        {...defaultProps}
        selectionPanel={<button>2 selected</button>}
      />,
    );
    expect(screen.getByText(/2 selected/)).toBeDefined();
  });

  it("should call onViewModeChange when a view mode is selected", () => {
    const onViewModeChange = vi.fn();
    render(
      <ExplorerToolbar {...defaultProps} onViewModeChange={onViewModeChange} />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /column view/i }));
    expect(onViewModeChange).toHaveBeenCalledWith("column");
  });

  it("should handle click on selection panel slot", () => {
    const onToggle = vi.fn();
    render(
      <ExplorerToolbar
        {...defaultProps}
        selectionPanel={<button onClick={onToggle}>2 selected</button>}
      />,
    );

    fireEvent.click(screen.getByText(/2 selected/));
    expect(onToggle).toHaveBeenCalled();
  });

  it("should render title or left content if provided", () => {
    render(
      <ExplorerToolbar
        {...defaultProps}
        title="My Collection"
        leftContent={<span>Left Action</span>}
      />,
    );
    expect(screen.getByText("My Collection")).toBeDefined();
    expect(screen.getByText("Left Action")).toBeDefined();
  });

  it("should render additional actions if provided", () => {
    render(
      <ExplorerToolbar
        {...defaultProps}
        rightContent={<button>Extra Action</button>}
      />,
    );
    expect(screen.getByText("Extra Action")).toBeDefined();
  });
});
