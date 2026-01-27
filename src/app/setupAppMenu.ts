import { useEffect, useMemo, useRef } from "react";
import { getName } from "@tauri-apps/api/app";
import { CheckMenuItem, Menu, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import { type ThemePreference } from "@/lib/preferences/theme";
import { useUserPreferences } from "@/providers/UserPreferencesProvider";

const appearanceOptions = [
  { id: "appearance-light", text: "Light", value: "light" as const },
  { id: "appearance-dark", text: "Dark", value: "dark" as const },
  { id: "appearance-system", text: "System", value: "system" as const },
];

export const useAppMenu = () => {
  const { theme, setTheme } = useUserPreferences();
  const initializedRef = useRef(false);
  const appearanceItemsRef = useRef<CheckMenuItem[]>([]);
  const latestThemeRef = useRef<ThemePreference>(theme);
  const optionById = useMemo(
    () => new Map(appearanceOptions.map((option) => [option.id, option.value])),
    [],
  );

  useEffect(() => {
    latestThemeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    let cancelled = false;

    const setup = async () => {
      const appName = await getName();
      const menu = await Menu.default();
      const items = await menu.items();

      let appSubmenu: Submenu | null = null;
      for (const item of items) {
        if (item instanceof Submenu) {
          const text = await item.text();
          if (text.toLowerCase() === appName.toLowerCase()) {
            appSubmenu = item;
            break;
          }
        }
      }

      if (!appSubmenu || cancelled) return;

      const existingAppearance = await appSubmenu.get("appearance-submenu");
      if (existingAppearance instanceof Submenu) {
        const existingItems = await existingAppearance.items();
        appearanceItemsRef.current = existingItems.filter(
          (item): item is CheckMenuItem => item instanceof CheckMenuItem,
        );
        await Promise.all(
          appearanceItemsRef.current.map((item) =>
            item.setChecked(optionById.get(item.id) === latestThemeRef.current),
          ),
        );
        return;
      }

      const appearanceSubMenu = await Submenu.new({
        id: "appearance-submenu",
        text: "Appearance...",
      });
      const appearanceSubMenuItems = await Promise.all(
        appearanceOptions.map((option) =>
          CheckMenuItem.new({
            id: option.id,
            text: option.text,
            checked: option.value === latestThemeRef.current,
            action: () => setTheme(option.value),
          }),
        ),
      );
      appearanceItemsRef.current = appearanceSubMenuItems;
      await appearanceSubMenu.append(appearanceSubMenuItems);
      const separator = await PredefinedMenuItem.new({ item: "Separator" });
      await appSubmenu.insert([appearanceSubMenu, separator], 2);
      await menu.setAsAppMenu();
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [optionById, setTheme, theme]);

  useEffect(() => {
    if (!appearanceItemsRef.current.length) return;
    void Promise.all(
      appearanceItemsRef.current.map((item) =>
        item.setChecked(optionById.get(item.id) === theme),
      ),
    );
  }, [optionById, theme]);
};
