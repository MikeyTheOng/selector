import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppRoute } from "../types/navigation";

type NavState = {
  stack: AppRoute[];
  index: number;
};

type NavigationContextValue = {
  currentRoute: AppRoute;
  navigateToExplorer: (folderId: string | null) => void;
  navigateToCollection: (collectionId: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navState, setNavState] = useState<NavState>({
    stack: [{ type: "explorer", folderId: null }],
    index: 0,
  });

  const currentRoute = navState.stack[navState.index];

  const navigate = useCallback((route: AppRoute) => {
    setNavState((prev) => {
      // Check if the route is the same as the current one
      const current = prev.stack[prev.index];
      if (JSON.stringify(current) === JSON.stringify(route)) {
        return prev;
      }

      // Clear forward history and add new route
      const nextStack = prev.stack.slice(0, prev.index + 1);
      nextStack.push(route);
      return { stack: nextStack, index: nextStack.length - 1 };
    });
  }, []);

  const navigateToExplorer = useCallback(
    (folderId: string | null) => {
      navigate({ type: "explorer", folderId });
    },
    [navigate],
  );

  const navigateToCollection = useCallback(
    (collectionId: string) => {
      navigate({ type: "collection", collectionId });
    },
    [navigate],
  );

  const canGoBack = navState.index > 0;
  const canGoForward = navState.index < navState.stack.length - 1;

  const goBack = useCallback(() => {
    if (!canGoBack) {
      return;
    }
    setNavState((prev) => ({ ...prev, index: prev.index - 1 }));
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (!canGoForward) {
      return;
    }
    setNavState((prev) => ({ ...prev, index: prev.index + 1 }));
  }, [canGoForward]);

  const value = useMemo(
    () => ({
      currentRoute,
      navigateToExplorer,
      navigateToCollection,
      canGoBack,
      canGoForward,
      goBack,
      goForward,
    }),
    [
      currentRoute,
      navigateToExplorer,
      navigateToCollection,
      canGoBack,
      canGoForward,
      goBack,
      goForward,
    ],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
