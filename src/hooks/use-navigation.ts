import { useCallback, useEffect, useMemo, useState } from "react";

type NavState = {
  stack: string[];
  index: number;
};

type NavigateOptions = {
  push?: boolean;
};

export const useNavigation = (initialPath: string | null) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [navState, setNavState] = useState<NavState>({ stack: [], index: -1 });

  const navigateTo = useCallback((path: string, options?: NavigateOptions) => {
    setSelectedFolder(path);
    if (options?.push === false) {
      return;
    }
    setNavState((prev) => {
      if (prev.stack[prev.index] === path) {
        return prev;
      }
      const nextStack = prev.stack.slice(0, prev.index + 1);
      nextStack.push(path);
      return { stack: nextStack, index: nextStack.length - 1 };
    });
  }, []);

  useEffect(() => {
    if (!initialPath || selectedFolder) {
      return;
    }
    navigateTo(initialPath);
  }, [initialPath, navigateTo, selectedFolder]);

  const canGoBack = navState.index > 0;
  const canGoForward = navState.index >= 0 && navState.index < navState.stack.length - 1;

  const goBack = useCallback(() => {
    if (!canGoBack) {
      return;
    }
    const nextIndex = navState.index - 1;
    const nextPath = navState.stack[nextIndex];
    setNavState((prev) => ({ ...prev, index: nextIndex }));
    navigateTo(nextPath, { push: false });
  }, [canGoBack, navState, navigateTo]);

  const goForward = useCallback(() => {
    if (!canGoForward) {
      return;
    }
    const nextIndex = navState.index + 1;
    const nextPath = navState.stack[nextIndex];
    setNavState((prev) => ({ ...prev, index: nextIndex }));
    navigateTo(nextPath, { push: false });
  }, [canGoForward, navState, navigateTo]);

  return useMemo(
    () => ({
      selectedFolder,
      navigateTo,
      canGoBack,
      canGoForward,
      goBack,
      goForward,
    }),
    [selectedFolder, navigateTo, canGoBack, canGoForward, goBack, goForward],
  );
};
