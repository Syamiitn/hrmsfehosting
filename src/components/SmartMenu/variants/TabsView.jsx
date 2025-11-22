import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function TabsView({
    items = [],
    showNested,
    onSelect = () => { },
    level = 1,
}) {
    const [expandedItem, setExpandedItem] = useState(null);
    const location = useLocation();

    // Automatically expand the submenu when current route matches a subpath
    useEffect(() => {
        const match = items.find(
            (item) =>
                item.subMenu &&
                item.subMenu.some((sub) => location.pathname.startsWith(sub.path))
        );
        if (match) setExpandedItem(match.label);
    }, [location.pathname, items]);

    const handleClick = (item) => {
        onSelect(item);
        if (showNested && item.subMenu?.length > 0) {
            setExpandedItem((prev) => (prev === item.label ? null : item.label));
        } else {
            setExpandedItem(null);
        }
    };

    const isPathActive = (path) => {
        if (!path) return false;
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const selectedItem = items.find((i) => i.label === expandedItem);

    return (
        <div className={`menu-level-${level}`}>
            <div className={`tab-row level-${level}`}>
                {items.map((item) => {
                    const active = isPathActive(item.path);
                    return (
                        <div
                            key={item.path || item.label}
                            className={`smartmenu-item ${active ? "active-parent" : ""}`}
                        >
                            <NavLink
                                to={item.path || "#"}
                                className={({ isActive }) =>
                                    `tab-link ${isActive || active ? "active" : ""}`
                                }
                                onClick={() => handleClick(item)}
                            >
                                {item.icon && (
                                    <span className="menu-icon">
                                        <item.icon className="icon" size={16} />
                                    </span>
                                )}
                                {item.label}
                            </NavLink>
                        </div>
                    );
                })}
            </div>

            {/* Render nested submenu when expanded */}
            {showNested && selectedItem?.subMenu?.length > 0 && (
                <div className={`menu-level-${level + 1}`}>
                    {selectedItem.subMenu.map((sub) => {
                        const active = isPathActive(sub.path);
                        return (
                            <div
                                key={sub.path || sub.label}
                                className={`smartmenu-item ${active ? "active-parent" : ""}`}
                            >
                                <NavLink
                                    to={sub.path || "#"}
                                    className={({ isActive }) =>
                                        `tab-link ${isActive || active ? "active" : ""}`
                                    }
                                    onClick={() => handleClick(sub)}
                                >
                                    {sub.icon && (
                                        <span className="menu-icon">
                                            <sub.icon className="icon" size={16} />
                                        </span>
                                    )}
                                    {sub.label}
                                </NavLink>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}
