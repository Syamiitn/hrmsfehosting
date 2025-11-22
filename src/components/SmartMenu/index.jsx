import React from "react";
import { SIDEBAR_MENU } from "@config/component.config";
import TabsView from "./variants/TabsView";
import DropdownView from "./variants/DropdownView";
import StepperView from "./variants/StepperView";
import "./index.css";

/**
 * SmartMenu - Dynamic multi-level navigation system
 * Props:
 *  role?: "admin" | "employee" | "hr"
 *  mainLabel?: string (top-level label from SIDEBAR_MENU)
 *  tabList?: Array<{ label: string, path: string, icon?: Component }>
 *  variant?: "tabs" | "dropdown" | "stepper"
 *  showNested?: boolean
 *  onSelect?: function(item)
 */
export default function SmartMenu({
    role,
    mainLabel,
    tabList = null,
    variant = "tabs",
    showNested = true,
    onSelect = () => { },
    sticky = false,
}) {
    // Variant mapping
    const variantMap = {
        tabs: TabsView,
        dropdown: DropdownView,
        stepper: StepperView,
    };
    const ViewComponent = variantMap[variant] || TabsView;

    // Derive menu items either from tabList OR SIDEBAR_MENU
    let items = [];

    if (Array.isArray(tabList) && tabList.length > 0) {
        items = tabList;
    } else if (role && mainLabel) {
        const roleMenu = SIDEBAR_MENU[role] || [];
        const mainMenu = roleMenu.find((m) => m.label === mainLabel);
        items = mainMenu?.subMenu || [];
    }

    if (!items.length) return null;

    return (
        <div className={`smartmenu-container variant-${variant}`}>
            <ViewComponent
                items={items}
                showNested={showNested}
                onSelect={onSelect}
                level={1}
                sticky={sticky}
            />
        </div>
    );
}
