import { useEffect } from 'react';

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Dark mode is disabled — the platform uses a single light editorial theme.
    // Ensure the 'dark' class is never applied.
    document.documentElement.classList.remove('dark');
  }, []);
  return children;
}