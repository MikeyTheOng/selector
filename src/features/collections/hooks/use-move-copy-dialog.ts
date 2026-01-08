import { useCallback, useState } from "react";
import type { ExplorerItem } from "@/types/explorer";

export type MoveCopyMode = "move" | "copy";

export type MoveCopyState = {
    mode: MoveCopyMode;
    entries: ExplorerItem[];
} | null;

export const useMoveCopyDialog = () => {
    const [state, setState] = useState<MoveCopyState>(null);

    const openMoveCopyDialog = useCallback((mode: MoveCopyMode, entries: ExplorerItem[]) => {
        if (entries.length === 0) return;
        setState({ mode, entries });
    }, []);

    const openMoveDialog = useCallback((entries: ExplorerItem[]) => {
        openMoveCopyDialog("move", entries);
    }, [openMoveCopyDialog]);

    const openCopyDialog = useCallback((entries: ExplorerItem[]) => {
        openMoveCopyDialog("copy", entries);
    }, [openMoveCopyDialog]);

    const closeMoveCopyDialog = useCallback(() => {
        setState(null);
    }, []);

    return {
        moveCopyState: state,
        openMoveCopyDialog,
        openMoveDialog,
        openCopyDialog,
        closeMoveCopyDialog,
    };
};
