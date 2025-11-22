import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./index.css";

export default function Sidebar({ themeColor, role, menuConfig, showSidebar, setShowSidebar }) {
    const location = useLocation();
    const sidebarMenu = menuConfig[role] || [];

    // Track viewport to switch behaviors for desktop vs mobile
    const [isDesktop, setIsDesktop] = useState(() =>
        window.matchMedia("(min-width: 992px)").matches
    );

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 992px)");
        const handler = (e) => setIsDesktop(e.matches);
        mq.addEventListener?.("change", handler);
        mq.addListener?.(handler); // Safari fallback
        return () => {
            mq.removeEventListener?.("change", handler);
            mq.removeListener?.(handler);
        };
    }, []);

    // Close sidebar on mobile after click
    const handleItemClick = () => {
        if (!isDesktop) setShowSidebar(false);
    };

    // Recursive function to check if menu (or its children) are active
    const isMenuActive = (menuItem, pathname) => {
        if (menuItem.path) {
            if (
                pathname === menuItem.path ||
                pathname.startsWith(menuItem.path + "/")
            ) {
                return true;
            }
        }
        if (menuItem.subMenu && menuItem.subMenu.length > 0) {
            return menuItem.subMenu.some((sub) => isMenuActive(sub, pathname));
        }
        return false;
    };

    // Mobile submenu state
    const [openKeys, setOpenKeys] = useState(new Set());
    useEffect(() => {
        if (isDesktop && openKeys.size) setOpenKeys(new Set());
    }, [isDesktop]);

    const toggleKey = (key) => {
        setOpenKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const makeKey = (parentKey, idx, label) => `${parentKey}/${idx}-${label}`;

    const themeClass = useMemo(() => {
        const safe = (themeColor || "").toLowerCase();
        return ["violet", "blue", "rose", "green", "orange"].includes(safe)
            ? `${safe}-sidebar`
            : "violet-sidebar";
    }, [themeColor]);

    // Recursive submenu renderer
    const renderSubMenu = (subMenuItems, parentKey) => (
        <ul className="sub-menu" role="menu">
            {subMenuItems.map((sub, i) => {
                const key = makeKey(parentKey, i, sub.label);
                const active = isMenuActive(sub, location.pathname);
                const isOpen = isDesktop ? false : openKeys.has(key);

                const hasChildren = Array.isArray(sub.subMenu) && sub.subMenu.length > 0;
                const onClick = (e) => {
                    if (!isDesktop && hasChildren) {
                        e.preventDefault();
                        toggleKey(key);
                    } else {
                        handleItemClick();
                    }
                };

                return (
                    <li
                        key={key}
                        className={`has-submenu ${active ? "active" : ""} ${isOpen ? "open" : ""}`}
                        role="none"
                    >
                        {sub.path ? (
                            <NavLink
                                to={sub.path}
                                className={`sub-menu-item ${active ? "active" : ""}`}
                                onClick={onClick}
                                role="menuitem"
                                aria-haspopup={hasChildren}
                                aria-expanded={isDesktop ? undefined : isOpen}
                            >
                                {sub.label}
                            </NavLink>
                        ) : (
                            <span
                                className={`sub-menu-item ${active ? "active" : ""}`}
                                onClick={onClick}
                                role="menuitem"
                                aria-haspopup={hasChildren}
                                aria-expanded={isDesktop ? undefined : isOpen}
                            >
                                {sub.label}
                            </span>
                        )}

                        {hasChildren && (
                            <ul
                                className={`sub-menu ${isDesktop ? "" : isOpen ? "open" : ""}`}
                                role="menu"
                            >
                                {renderSubMenu(sub.subMenu, key)}
                            </ul>
                        )}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <>
            {!isDesktop && showSidebar && (
                <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} />
            )}

            <aside className={`sidebar ${themeClass} ${showSidebar ? "show" : ""}`} aria-label="Primary">
                <div className="logo-container rounded">
                    <h3 className="fw-bold m-0">SoGo</h3>
                </div>

                <ul className="sidebar-menu" role="menubar">
                    {sidebarMenu.map(({ path, label, icon: Icon, activeIcon: ActiveIcon, subMenu }, index) => {
                        const active = isMenuActive({ path, subMenu }, location.pathname);
                        const rootKey = `root-${index}-${label}`;
                        const hasChildren = Array.isArray(subMenu) && subMenu.length > 0;
                        const isOpen = !isDesktop && openKeys.has(rootKey);

                        const onRootClick = (e) => {
                            if (!isDesktop && hasChildren) {
                                e.preventDefault();
                                toggleKey(rootKey);
                            } else {
                                handleItemClick();
                            }
                        };

                        return (
                            <li
                                key={rootKey}
                                className={`has-submenu ${active ? "active" : ""} ${isOpen ? "open" : ""}`}
                                role="none"
                            >
                                {path ? (
                                    <NavLink
                                        to={path}
                                        className={`menu-item ${active ? "active" : ""}`}
                                        onClick={onRootClick}
                                        role="menuitem"
                                        aria-haspopup={hasChildren}
                                        aria-expanded={isDesktop ? undefined : isOpen}
                                    >
                                        {active && ActiveIcon ? (
                                            <ActiveIcon className="menu-icon" aria-hidden />
                                        ) : (
                                            Icon && <Icon className="menu-icon" aria-hidden />
                                        )}
                                        <span className="menu-label">{label}</span>
                                    </NavLink>
                                ) : (
                                    <span
                                        className={`menu-item ${active ? "active" : ""}`}
                                        onClick={onRootClick}
                                        role="menuitem"
                                        aria-haspopup={hasChildren}
                                        aria-expanded={isDesktop ? undefined : isOpen}
                                    >
                                        {Icon && <Icon className="menu-icon" aria-hidden />}
                                        <span className="menu-label">{label}</span>
                                    </span>
                                )}

                                {hasChildren && (
                                    <ul
                                        className={`sub-menu ${isDesktop ? "" : isOpen ? "open" : ""}`}
                                        role="menu"
                                    >
                                        {renderSubMenu(subMenu, rootKey)}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </aside>
        </>
    );
}
