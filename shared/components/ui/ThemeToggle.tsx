"use client";

import { useTheme } from "@/shared/context/ThemeContext";
import { Sun, Moon, Computer } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const nextTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={nextTheme}
      className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-150"
      aria-label={`Switch theme to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'}`}
    >
      {theme === 'light' && <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
      {theme === 'dark' && <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
      {theme === 'system' && <Computer className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
    </button>
  );
} 