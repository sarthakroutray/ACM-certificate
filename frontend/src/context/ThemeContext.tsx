import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark'; // Only dark mode allowed

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always default to dark, ignore local storage or system preference for light mode
  const [theme] = useState<Theme>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    // Ensure styles are forced
    root.style.colorScheme = 'dark';
  }, []);

  const toggleTheme = () => {
    // No-op: Theme is permanently dark
    console.log("Theme switching is disabled.");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};