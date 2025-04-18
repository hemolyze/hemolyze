"use client";

import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark'; // The resolved theme actually applied
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_COOKIE_NAME = 'theme-preference';

// Simple cookie helpers (consider a library like js-cookie for more complex needs)
const setCookie = (name: string, value: string, days: number = 365) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // Ensure cookie is available across the site
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};


export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('system'); // Default to system
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light'); // Default assumption

  // Function to apply theme class to HTML element
  const applyTheme = useCallback((t: 'light' | 'dark') => {
    const root = window.document.documentElement;
    root.classList.remove(t === 'light' ? 'dark' : 'light');
    root.classList.add(t);
    setEffectiveTheme(t); // Update effective theme state
  }, []);

  // Effect to initialize theme from cookie and system preference
  useEffect(() => {
    const storedTheme = getCookie(THEME_COOKIE_NAME) as Theme | null;
    const initialTheme = storedTheme || 'system';
    setThemeState(initialTheme); // Set the controlling state

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme = prefersDark.matches ? 'dark' : 'light';

    if (initialTheme === 'system') {
      applyTheme(systemTheme);
    } else {
      applyTheme(initialTheme);
    }

    // Listener for system theme changes
    const mediaQueryListener = (e: MediaQueryListEvent) => {
        if (theme === 'system') { // Only update if theme is 'system'
            applyTheme(e.matches ? 'dark' : 'light');
        }
    };

    prefersDark.addEventListener('change', mediaQueryListener);

    return () => {
        prefersDark.removeEventListener('change', mediaQueryListener);
    };
  // Run only once on mount, theme dependency handled by setTheme function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTheme]); // Include applyTheme dependency

  // Function to update theme state and cookie, and apply class
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setCookie(THEME_COOKIE_NAME, newTheme);

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    } else {
      applyTheme(newTheme);
    }
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 