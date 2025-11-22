import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

export default function DropdownView({
    items = [],
    showNested = true,
    onSelect,
    level = 1,
    sticky = false, // default false
}) {
    const location = useLocation();
    const [openDropdown, setOpenDropdown] = useState(null);

    // Detect if item or any subItem matches active route
    const isActivePath = (item) => {
        if (item.path && location.pathname === item.path) return true;
        if (item.subMenu?.length > 0) {
            return item.subMenu.some((sub) => isActivePath(sub));
        }
        return false;
    };

    // Auto-expand menu if current route is inside it
    useEffect(() => {
        const activeParent = items.find((i) => isActivePath(i));
        if (activeParent) {
            setOpenDropdown(activeParent.label);
        }
    }, [location.pathname, items]);

    // Handle click
    const handleClick = (item) => {
        onSelect?.(item);
        if (item.subMenu?.length && showNested) {
            setOpenDropdown((prev) =>
                prev === item.label ? null : item.label
            );
        } else {
            setOpenDropdown(null);
        }
    };

    // Conditional class for sticky behavior
    const containerClasses = `dropdown-container menu-level-${level} ${sticky ? "sticky-sidebar" : ""
        }`;

    return (
        <div className={containerClasses}>
            <div className="dropdown-box">
                {items.map((item) => {
                    const active = isActivePath(item);
                    const hasChildren = item.subMenu?.length > 0;

                    return (
                        <div
                            key={item.path || item.label}
                            className={`dropdown-option ${openDropdown === item.label ? "open" : ""
                                } ${active ? "active" : ""}`}
                            onClick={() => handleClick(item)}
                            onMouseEnter={() =>
                                showNested && hasChildren && setOpenDropdown(item.label)
                            }
                            onMouseLeave={() =>
                                showNested && hasChildren && setOpenDropdown(null)
                            }
                        >
                            {/* Wrapping label with NavLink */}
                            <NavLink
                                to={item.path || "#"}
                                className={({ isActive }) =>
                                    `dropdown-option-label d-flex justify-content-between align-items-center text-decoration-none text-reset flex-grow-1 gap-2 ${isActive ? "active" : ""
                                    }`
                                }
                            >
                                <div className="d-flex align-items-center gap-2 flex-grow-1">
                                    {item.icon && (
                                        <span className="menu-icon">
                                            <item.icon className="icon" size={16} />
                                        </span>
                                    )}
                                    <span>{item.label}</span>
                                </div>

                                {showNested && hasChildren && (
                                    <FaChevronRight
                                        size={10}
                                        className={`dropdown-arrow ${openDropdown === item.label ? "rotated" : ""
                                            }`}
                                    />
                                )}
                            </NavLink>

                            {showNested && hasChildren && openDropdown === item.label && (
                                <div className="dropdown-flyout">
                                    <DropdownView
                                        items={item.subMenu}
                                        showNested={showNested}
                                        onSelect={onSelect}
                                        level={level + 1}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
