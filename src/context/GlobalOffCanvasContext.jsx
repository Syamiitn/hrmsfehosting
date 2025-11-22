import React, { createContext, useContext, useState } from "react";

const OffCanvasContext = createContext();

export const useOffCanvas = () => useContext(OffCanvasContext);

export function OffCanvasProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState(null);
    const [position, setPosition] = useState("right"); // "left" | "right"

    const openOffCanvas = (jsxContent, pos = "right") => {
        setContent(jsxContent);
        setPosition(pos);
        setIsOpen(true);
    };

    const closeOffCanvas = () => {
        setIsOpen(false);
        setTimeout(() => setContent(null), 200);
    };

    return (
        <OffCanvasContext.Provider value={{ openOffCanvas, closeOffCanvas }}>
            {children}

            {/* Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[9999]">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeOffCanvas}
                    />
                    <div
                        className={`
              absolute top-0 h-full w-90 max-w-full global-offcanvas shadow-xl
              transition-transform duration-300
              ${position === "right"
                                ? "right-0 translate-x-0"
                                : "left-0 translate-x-0"}
            `}
                    >
                        <div className="p-4 h-full overflow-y-auto">{content}</div>
                    </div>
                </div>
            )}
        </OffCanvasContext.Provider>
    );
}


// USAGE:

// import { useOffCanvas } from "./GlobalOffCanvasContext";
// const { openOffCanvas, closeOffCanvas } = useOffCanvas();

// openOffCanvas('jsx', 'right');
// openOffCanvas('jsx', 'left');