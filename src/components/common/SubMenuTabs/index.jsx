import React from "react";
import { NavLink } from "react-router-dom";
import { MdFiberManualRecord } from "react-icons/md";
import { SIDEBAR_MENU } from "@config/component.config";
import "./index.css";

export default function SubMenuTabs({ role, mainLabel }) {
    // find the menu for this role
    const roleMenu = SIDEBAR_MENU[role] || [];

    // find the main menu item by label
    const mainMenu = roleMenu.find((menu) => menu.label === mainLabel);

    // extract sub-menu
    const subMenu = mainMenu?.subMenu || [];

    if (!subMenu.length) return null;

    return (
        <div className="d-flex justify-content-start">
            <ul className="submenu-tab-container flex flex-wrap gap-2">
                {subMenu.map((item, i) => (
                    <li key={i}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `tab-link ${isActive ? "active" : ""}`
                            }
                        >
                            {/* <div><MdFiberManualRecord className="icon" /></div> */}
                            <div>{item.label}</div>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}


// USAGE:
{/* <SubMenuTabs role="employee" mainLabel="Leaves" /> */ }
