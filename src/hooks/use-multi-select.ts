import type { CSSProperties, MouseEvent as ReactMouseEvent, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FileRow } from "@/lib/fs";

type UseMultiSelectOptions = {
    files: FileRow[];
    onSelectFile: (row: FileRow, options?: { additive?: boolean }) => void;
    onSelectMultiple?: (rows: FileRow[], options?: { additive?: boolean }) => void;
    containerRef: RefObject<HTMLElement | null>;
};

type DragSelectionState = {
    isDragging: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
};

/**
 * Hook for multi-selection features: CMD+A to select all and click+drag marquee selection.
 * Designed to be reusable across different file view components.
 */
export const useMultiSelect = ({
    files,
    onSelectFile,
    onSelectMultiple,
    containerRef,
}: UseMultiSelectOptions) => {
    const [dragState, setDragState] = useState<DragSelectionState | null>(null);
    const rowRefsMap = useRef<Map<string, HTMLElement>>(new Map());

    const registerRowRef = useCallback((path: string, element: HTMLElement | null) => {
        if (element) {
            rowRefsMap.current.set(path, element);
        } else {
            rowRefsMap.current.delete(path);
        }
    }, []);

    const selectAll = useCallback(() => {
        if (files.length === 0) return;

        if (onSelectMultiple) {
            onSelectMultiple(files, { additive: true });
            return;
        }

        files.forEach((file) => {
            onSelectFile(file, { additive: true });
        });
    }, [files, onSelectFile, onSelectMultiple]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "a") {
                event.preventDefault();
                selectAll();
            }
        };

        container.addEventListener("keydown", handleKeyDown);
        return () => {
            container.removeEventListener("keydown", handleKeyDown);
        };
    }, [containerRef, selectAll]);

    const getSelectionRect = useCallback(() => {
        if (!dragState) return null;

        const left = Math.min(dragState.startX, dragState.currentX);
        const top = Math.min(dragState.startY, dragState.currentY);
        const right = Math.max(dragState.startX, dragState.currentX);
        const bottom = Math.max(dragState.startY, dragState.currentY);

        return { left, top, right, bottom, width: right - left, height: bottom - top };
    }, [dragState]);

    const rectsIntersect = useCallback(
        (
            rect1: { left: number; top: number; right: number; bottom: number },
            rect2: { left: number; top: number; right: number; bottom: number },
        ) => {
            return !(
                rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom
            );
        },
        [],
    );

    const getFilesInSelectionRect = useCallback(() => {
        const selectionRect = getSelectionRect();
        if (!selectionRect) return [];

        const container = containerRef.current;
        if (!container) return [];

        const containerRect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const adjustedSelectionRect = {
            left: selectionRect.left + scrollLeft - containerRect.left,
            top: selectionRect.top + scrollTop - containerRect.top,
            right: selectionRect.right + scrollLeft - containerRect.left,
            bottom: selectionRect.bottom + scrollTop - containerRect.top,
        };

        const intersectingFiles: FileRow[] = [];

        rowRefsMap.current.forEach((element, path) => {
            const file = files.find((f) => f.path === path);
            if (!file) return;

            const rowRect = element.getBoundingClientRect();
            const adjustedRowRect = {
                left: rowRect.left - containerRect.left + scrollLeft,
                top: rowRect.top - containerRect.top + scrollTop,
                right: rowRect.right - containerRect.left + scrollLeft,
                bottom: rowRect.bottom - containerRect.top + scrollTop,
            };

            if (rectsIntersect(adjustedSelectionRect, adjustedRowRect)) {
                intersectingFiles.push(file);
            }
        });

        return intersectingFiles;
    }, [getSelectionRect, containerRef, files, rectsIntersect]);

    const handleMouseDown = useCallback(
        (event: ReactMouseEvent) => {
            if (event.button !== 0) return;

            const target = event.target as HTMLElement;
            if (target.closest("button, a, input, [role='button']")) return;

            const container = containerRef.current;
            if (!container) return;

            setDragState({
                isDragging: true,
                startX: event.clientX,
                startY: event.clientY,
                currentX: event.clientX,
                currentY: event.clientY,
            });
        },
        [containerRef],
    );

    useEffect(() => {
        if (!dragState?.isDragging) return;

        const handleMouseMove = (event: MouseEvent) => {
            setDragState((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    currentX: event.clientX,
                    currentY: event.clientY,
                };
            });
        };

        const handleMouseUp = () => {
            const selectionRect = getSelectionRect();
            const movedEnough = selectionRect && (selectionRect.width >= 5 || selectionRect.height >= 5);

            if (movedEnough) {
                const filesInRect = getFilesInSelectionRect();
                if (filesInRect.length > 0) {
                    if (onSelectMultiple) {
                        onSelectMultiple(filesInRect, { additive: true });
                    } else {
                        filesInRect.forEach((file) => {
                            onSelectFile(file, { additive: true });
                        });
                    }
                }
            }

            setDragState(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragState, getFilesInSelectionRect, getSelectionRect, onSelectFile, onSelectMultiple]);

    const selectionRectStyle = useCallback((): CSSProperties | null => {
        const rect = getSelectionRect();
        if (!rect || rect.width < 5 || rect.height < 5) return null;

        return {
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            pointerEvents: "none",
            zIndex: 50,
        };
    }, [getSelectionRect]);

    return {
        isDragging: dragState?.isDragging ?? false,
        selectionRectStyle,
        selectAll,
        registerRowRef,
        handleMouseDown,
    };
};
