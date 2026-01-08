import { Menu, MenuItem, Submenu, PredefinedMenuItem, CheckMenuItem } from "@tauri-apps/api/menu";

console.log("[ExplorerContextMenu] module loaded");

export type ContextMenuItemAction = {
    type: "item";
    id: string;
    text: string;
    enabled?: boolean;
    checked?: boolean;
    action: () => void;
};

export type ContextMenuSeparator = {
    type: "separator";
};

export type ContextMenuSubmenu = {
    type: "submenu";
    text: string;
    enabled?: boolean;
    items: ContextMenuItemDef[];
};

export type ContextMenuItemDef =
    | ContextMenuItemAction
    | ContextMenuSeparator
    | ContextMenuSubmenu;

export const useExplorerContextMenu = () => {
    const buildMenuParams = async (items: ContextMenuItemDef[]): Promise<(MenuItem | Submenu | PredefinedMenuItem | CheckMenuItem)[]> => {
        return Promise.all(
            items.map(async (item) => {
                if (item.type === "separator") {
                    return PredefinedMenuItem.new({ item: "Separator" });
                }

                if (item.type === "submenu") {
                    const children = await buildMenuParams(item.items);
                    return Submenu.new({
                        text: item.text,
                        items: children,
                        enabled: item.enabled !== false,
                    });
                }

                const commonOptions = {
                    id: item.id,
                    text: item.text,
                    enabled: item.enabled !== false,
                    action: (_id: string) => {
                        void _id;
                        item.action();
                    }
                };

                if (item.checked !== undefined) {
                    return CheckMenuItem.new({
                        ...commonOptions,
                        checked: item.checked,
                    });
                }

                return MenuItem.new(commonOptions);
            })
        );
    };

    const showContextMenu = async (items: ContextMenuItemDef[]) => {
        try {
            const tauriItems = await buildMenuParams(items);
            const menu = await Menu.new({
                items: tauriItems,
            });
            await menu.popup();
        } catch (error) {
            console.error("Failed to show context menu:", error);
        }
    };

    return { showContextMenu };
};