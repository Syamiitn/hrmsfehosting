import React, { useEffect, useRef, useState } from "react";

import './index.css'

export default function PopoverContainer({
    open,
    onClose,
    anchorRef,  // 🔥 receive trigger element reference
    children
}) {
    const popRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (open && anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();

            // Position popover below the trigger
            setPos({
                top: rect.bottom + 8,      // 8px gap
                left: rect.left,
            });
        }
    }, [open, anchorRef]);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (popRef.current && !popRef.current.contains(e.target)) {
                onClose();
            }
        }
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    if (!open) return null;

    return (
        <div
            ref={popRef}
            className="global-popover-wrapper"
            style={{
                position: "absolute",
                top: pos.top,
                left: pos.left,
                zIndex: 9999,
            }}
        >
            {children}
        </div>
    );
}
