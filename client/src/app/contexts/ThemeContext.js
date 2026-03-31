"use client";

import { createContext, useContext } from "react";

const ThemeContext = createContext({ darkMode: false });

export function ThemeProvider({ value, children }) {
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

