import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExplorerToolbar } from "../ExplorerToolbar";

describe("ExplorerToolbar", () => {
  const defaultProps = {
    viewMode: "list" as const,
    onViewModeChange: vi.fn(),
    fileCount: 10,
    folderCount: 5,
    selectedCount: 2,
    isSelectionOpen: false,
    onToggleSelection: vi.fn(),
  };

  it("should render item counts correctly", () => {
    render(<ExplorerToolbar {...defaultProps} />);
    expect(screen.getByText(/10 files - 5 folders/)).toBeDefined();
  });

  it("should render selected count", () => {
    render(<ExplorerToolbar {...defaultProps} />);
    expect(screen.getByText(/2 selected/)).toBeDefined();
  });

  it("should call onViewModeChange when a view mode is selected", () => {
    const onViewModeChange = vi.fn();
    render(<ExplorerToolbar {...defaultProps} onViewModeChange={onViewModeChange} />);

    fireEvent.click(screen.getByText("Column"));
    expect(onViewModeChange).toHaveBeenCalledWith("column");
  });

  it("should call onToggleSelection when selection button is clicked", () => {
    const onToggleSelection = vi.fn();
    render(<ExplorerToolbar {...defaultProps} onToggleSelection={onToggleSelection} />);

    fireEvent.click(screen.getByText(/2 selected/));
    expect(onToggleSelection).toHaveBeenCalled();
  });

  it("should render title or left content if provided", () => {
    render(
      <ExplorerToolbar 
        {...defaultProps} 
        title="My Collection" 
        leftContent={<span>Left Action</span>} 
      />
    );
    expect(screen.getByText("My Collection")).toBeDefined();
    expect(screen.getByText("Left Action")).toBeDefined();
  });

  it("should render additional actions if provided", () => {
    render(
      <ExplorerToolbar 
        {...defaultProps} 
        rightContent={<button>Extra Action</button>} 
      />
    );
    expect(screen.getByText("Extra Action")).toBeDefined();
  });
});
