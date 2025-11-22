import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME_COLOR, DEFAULT_THEME_MODE } from '@config/component.config'

const ThemeContext = createContext({
    themeColor: DEFAULT_THEME_COLOR,
    themeMode: DEFAULT_THEME_MODE,
    changeTheme: () => { },
    toggleThemeMode: () => { },
});

export const ThemeProvider = ({ children }) => {
    // Initialize from sessionStorage or defaults
    const [themeColor, setThemeColor] = useState(() => {
        try {
            return sessionStorage.getItem("themeColor") || DEFAULT_THEME_COLOR;
        } catch {
            return DEFAULT_THEME_COLOR;
        }
    });

    const [themeMode, setThemeMode] = useState(() => {
        try {
            return sessionStorage.getItem("themeMode") || DEFAULT_THEME_MODE;
        } catch {
            return DEFAULT_THEME_MODE;
        }
    });

    // Sync changes to <body> and persist in sessionStorage
    useEffect(() => {
        document.body.setAttribute("data-theme", themeColor);
        document.body.setAttribute("data-mode", themeMode);

        try {
            sessionStorage.setItem("themeColor", themeColor);
            sessionStorage.setItem("themeMode", themeMode);
        } catch {
            // ignore storage errors (private browsing, etc.)
        }
    }, [themeColor, themeMode]);

    const changeTheme = (color) => setThemeColor(color);
    const toggleThemeMode = () =>
        setThemeMode((prev) => (prev === "light" ? "dark" : "light"));

    const value = useMemo(
        () => ({
            themeColor,
            themeMode,
            changeTheme,
            toggleThemeMode,
        }),
        [themeColor, themeMode]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook
export const useTheme = () => useContext(ThemeContext);


/*

import { useTheme } from "@context/ThemeContext";

function ThemeSwitcher() {
  const { themeMode, toggleThemeMode, themeColor, changeTheme } = useTheme();

  return (
    <div>
      <button onClick={toggleThemeMode}>
        Switch to {themeMode === "light" ? "Dark" : "Light"} Mode
      </button>

      <button onClick={() => changeTheme("blue")}>Blue Theme</button>
      <button onClick={() => changeTheme("violet")}>Violet Theme</button>
    </div>
  );
}

 */