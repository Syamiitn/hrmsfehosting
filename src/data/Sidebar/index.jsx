import React, { useState } from "react";
import { sidebarConfig } from "@config/sidebar.config";
import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import "./index.css";

export default function Sidebar({ role = "employee", isOpen, closeSidebar }) {
    const menu = sidebarConfig[role] || [];

    const [openSections, setOpenSections] = useState({});

    const toggleSection = (index) => {
        setOpenSections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <div className={`layout-sidebar ${isOpen ? "open" : ""}`}>

            {/* Close button inside sidebar on mobile */}
            {/* <div className="close-btn d-block d-lg-none" onClick={closeSidebar}>
                ✕
            </div> */}

            {menu.map((section, index) => {
                const isOpenSection = openSections[index] ?? true;

                return (
                    <div key={index} className="sidebar-section">

                        <div
                            className="sidebar-section-title-row"
                            onClick={() => section.isDropDown && toggleSection(index)}
                        >
                            <p className="sidebar-section-title">{section.section}</p>

                            {section.isDropDown && (
                                isOpenSection ? (
                                    <ChevronUp className="dropdown-icon" />
                                ) : (
                                    <ChevronDown className="dropdown-icon" />
                                )
                            )}
                        </div>

                        {isOpenSection && (
                            <>
                                {section.items.map((item, idx) =>
                                    item.isHeading ? (
                                        <p key={idx} className="sidebar-subheading">{item.label}</p>
                                    ) : (
                                        <NavLink
                                            key={idx}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `sidebar-item ${isActive ? "active" : ""}`
                                            }
                                            onClick={closeSidebar}
                                        >
                                            <div className="d-flex gap-2 align-items-center">
                                                <item.icon className="sidebar-icon" />
                                                <span>{item.label}</span>
                                            </div>
                                        </NavLink>
                                    )
                                )}
                            </>
                        )}
                    </div>
                );
            })}

        </div>
    );
}