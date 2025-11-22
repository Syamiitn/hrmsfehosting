import React from "react";
import { useTheme } from "@context/ThemeContext";

const Loading = ({
    type = "spinner",
    size = "md", // sm | md | lg
    message = "",
    fullScreen = false,
}) => {
    const { themeMode } = useTheme();

    // 🔹 size mappings
    const sizeClasses = {
        sm: "w-5 h-5",
        md: "w-10 h-10",
        lg: "w-14 h-14",
    };

    return (
        <div
            className={`
        flex flex-col items-center justify-center p-4
        ${fullScreen ? "fixed inset-0 z-[3000] bg-black/20 dark:bg-black/40" : ""}
        ${themeMode}
      `}
        >
            {/* Spinner */}
            {type === "spinner" && (
                <div
                    className={`
            ${sizeClasses[size]} 
            border-4 border-transparent border-t-[4px] 
            border-t-[var(--theme)] rounded-full animate-spin
          `}
                />
            )}

            {/* Dots */}
            {type === "dots" && (
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className={`
                w-2 h-2 rounded-full bg-[var(--theme)]
                animate-bounce
              `}
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            )}

            {/* Skeleton */}
            {type === "skeleton" && (
                <div className="w-full max-w-sm space-y-2">
                    <div className="h-3.5 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[shimmer_1.5s_infinite]" />
                    <div className="h-3.5 w-3/5 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-[shimmer_1.5s_infinite]" />
                </div>
            )}

            {/* Message */}
            {message && (
                <p className="mt-3 text-sm text-[var(--text-color,#333)]">{message}</p>
            )}
        </div>
    );
};

export default Loading;


/************************* USAGE *************************
 
<Loading type="spinner" size="lg" message="Loading data..." fullScreen />
<Loading type="dots" size="md" message="Please wait..." />
<Loading type="skeleton" />

*/