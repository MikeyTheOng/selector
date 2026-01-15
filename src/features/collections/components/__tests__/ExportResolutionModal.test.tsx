import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExportResolutionModal } from "../ExportResolutionModal";
import type { ExplorerItem } from "@/types/explorer";

const createFile = (path: string, extension = "txt"): ExplorerItem => ({
  path,
  name: path.split("/").pop() ?? "",
  kind: "file",
  status: "available",
  extension,
  sizeLabel: "0 B",
  dateModified: new Date(),
  dateModifiedLabel: "Today",
  kindLabel: "File",
});

const createFolder = (path: string): ExplorerItem => ({
  path,
  name: path.split("/").pop() ?? "",
  kind: "folder",
  status: "available",
  dateModified: new Date(),
  dateModifiedLabel: "Today",
  kindLabel: "Folder",
});

describe("ExportResolutionModal", () => {
  const baseProps = {
    isOpen: true,
    entries: [createFile("/path/to/file.txt")],
    onProceed: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders when open", () => {
    render(<ExportResolutionModal {...baseProps} />);
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("displays three resolution options", () => {
    render(<ExportResolutionModal {...baseProps} />);
    expect(screen.getByLabelText(/files only/i)).toBeDefined();
    expect(screen.getByLabelText(/folders only/i)).toBeDefined();
    expect(screen.getByLabelText(/expand folders/i)).toBeDefined();
  });

  it("starts with no option selected", () => {
    render(<ExportResolutionModal {...baseProps} />);
    const filesOnly = screen.getByLabelText(/files only/i);
    expect(filesOnly).toHaveAttribute("aria-checked", "false");
  });

  it("updates selection when an option is clicked", async () => {
    render(<ExportResolutionModal {...baseProps} />);
    const filesOnly = screen.getByLabelText(/files only/i);
    fireEvent.click(filesOnly);

    await waitFor(() => {
      expect(filesOnly).toHaveAttribute("aria-checked", "true");
    });
  });

  it("shows file kind checkboxes when multiple kinds exist", async () => {
    const entries = [
      createFile("/path/to/image.jpg", "jpg"),
      createFile("/path/to/video.mp4", "mp4"),
    ];
    render(
      <ExportResolutionModal {...baseProps} entries={entries} />,
    );

    fireEvent.click(screen.getByLabelText(/files only/i));

    await waitFor(() => {
      expect(screen.getByText(/images/i)).toBeDefined();
      expect(screen.getByText(/videos/i)).toBeDefined();
    });
  });

  it("hides file kind checkboxes when a single kind exists", async () => {
    const entries = [
      createFile("/path/to/image.jpg", "jpg"),
      createFile("/path/to/another.jpg", "jpg"),
    ];
    render(
      <ExportResolutionModal {...baseProps} entries={entries} />,
    );

    fireEvent.click(screen.getByLabelText(/files only/i));

    await waitFor(() => {
      expect(screen.queryByText(/images/i)).toBeNull();
    });
  });

  it("disables proceed button when no option is selected", () => {
    render(<ExportResolutionModal {...baseProps} />);
    const proceed = screen.getByRole("button", { name: /open with/i });
    expect(proceed).toBeDisabled();
  });

  it("disables proceed button when resolved set is empty", async () => {
    const entries = [createFolder("/path/to/folder")];
    render(
      <ExportResolutionModal {...baseProps} entries={entries} />,
    );

    fireEvent.click(screen.getByLabelText(/files only/i));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /open with/i })).toBeDisabled();
      expect(screen.getByText(/no files match your selection/i)).toBeDefined();
    });
  });

  it("enables proceed button with a valid selection", async () => {
    render(<ExportResolutionModal {...baseProps} />);
    fireEvent.click(screen.getByLabelText(/files only/i));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /open with/i })).toBeEnabled();
    });
  });

  it("calls onClose when cancel is clicked", () => {
    render(<ExportResolutionModal {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
