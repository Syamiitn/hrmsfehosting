import React, { createContext, useContext, useState, useEffect } from "react";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState(null);
    const [config, setConfig] = useState({ size: "md", title: "", position: "center" });

    const openModal = (jsxContent, options = {}) => {
        setContent(jsxContent);
        setConfig({ size: options.size || "md", title: options.title || "", position: options.position || "center" });
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setTimeout(() => setContent(null), 200); // cleanup
    };

    // 🔒 Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => document.body.classList.remove("overflow-hidden");
    }, [isOpen]);

    // Modal size classes
    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-3xl",
        xl: "max-w-5xl",
        full: "w-full h-full rounded-none",
    };

    // Position classes
    const positionClasses = {
        center: "items-center justify-center",
        top: "items-start justify-center mt-10",
        bottom: "items-end justify-center mb-10",
    };

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}

            {isOpen && (
                <div className={`fixed inset-0 z-[9999] flex ${positionClasses[config.position]} bg-black/50 backdrop-blur-sm`}>
                    <div
                        className={`global-modal rounded-lg shadow-lg w-full ${sizeClasses[config.size]} mx-4 max-h-[90vh] flex flex-col`}
                        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
                    >
                        {/* Header */}
                        {config.title && (
                            <>
                                <div className="px-4 py-2 flex justify-between items-center">
                                    <h4 style={{ color: 'var(--theme)' }}>{config.title}</h4>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <hr className="my-1" />
                            </>
                        )}

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-3">
                            {typeof content === "function" ? content() : content}
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}