import React from "react";
import "./index.css";

/**
 * Reusable Card Component
 *
 * Supports:
 * - variant: filled | outline | ghost
 * - shadow: none | soft | strong | inset | theme | glass
 * - border: none | default | theme | gradient
 * - radius: sm | md | lg | xl
 * - padding: none | sm | md | lg
 * - icon: JSX element (left side icon)
 * - title: card heading
 * - subtitle: sub heading
 * - footer: JSX footer
 * - hover: enable hover elevation
 * - blur: enable glass blur effect
 * - type: stat | standard | tile | feed (optional preset styles)
 */

export default function Card({
    children,

    /* Layout Props */
    icon = null,
    title = "",
    subtitle = "",
    footer = null,

    /* Style Props */
    variant = "filled",
    shadow = "soft",
    border = "default",
    radius = "md",
    padding = "md",
    hover = false,
    blur = false,
    type = "standard", // stat | standard | tile | feed

    className = "",
    ...rest
}) {
    const cardClass = [
        "card",
        `card--variant-${variant}`,
        `card--shadow-${shadow}`,
        `card--border-${border}`,
        `card--radius-${radius}`,
        `card--padding-${padding}`,
        type ? `card--type-${type}` : "",
        hover ? "card--hover" : "",
        blur ? "card--blur" : "",
        className
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={cardClass} {...rest}>

            {/* ---------- HEADER ---------- */}
            {(icon || title || subtitle) && (
                <div className="card__header">
                    {icon && <div className="card__icon">{icon}</div>}

                    <div className="card__header-text">
                        {title && <div className="card__title">{title}</div>}
                        {subtitle && <div className="card__subtitle">{subtitle}</div>}
                    </div>
                </div>
            )}

            {/* ---------- BODY CONTENT ---------- */}
            <div className="card__body">{children}</div>

            {/* ---------- FOOTER ---------- */}
            {footer && <div className="card__footer">{footer}</div>}
        </div>
    );
}
