import React from "react";
import { NavLink } from "react-router-dom";

export default function StepperView({
    items = [],
    showNested,
    onSelect,
    level = 1,
}) {
    return (
        <div className={`stepper-container menu-level-${level}`}>
            {items.map((step, index) => (
                <div key={step.path} className="stepper-step">
                    <NavLink
                        to={step.path || "#"}
                        className={({ isActive }) =>
                            `stepper-circle ${isActive ? "active" : ""}`
                        }
                        onClick={() => onSelect(step)}
                    >
                        {index + 1}
                    </NavLink>
                    <div className="stepper-label">{step.label}</div>

                    {showNested && step.subMenu?.length > 0 && (
                        <div className="stepper-sub">
                            <StepperView
                                items={step.subMenu}
                                showNested={showNested}
                                onSelect={onSelect}
                                level={level + 1}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
