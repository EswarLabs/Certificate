import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize theme mode from localStorage ('light', 'dark', or 'system')
    const [themeMode, setThemeMode] = useState(() => {
        const saved = localStorage.getItem('theme_mode');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
            return saved;
        }
        // Fallback for legacy localStorage 'theme' key
        const legacy = localStorage.getItem('theme');
        return legacy ? legacy : 'dark';
    });

    // Resolved active theme ('light' or 'dark')
    const [resolvedTheme, setResolvedTheme] = useState('dark');

    useEffect(() => {
        const root = document.documentElement;

        const applyTheme = (isDark) => {
            if (isDark) {
                root.setAttribute('data-theme', 'dark');
                setResolvedTheme('dark');
            } else {
                root.removeAttribute('data-theme');
                setResolvedTheme('light');
            }
        };

        if (themeMode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches);

            const handler = (e) => applyTheme(e.matches);
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            applyTheme(themeMode === 'dark');
        }

        localStorage.setItem('theme_mode', themeMode);
        localStorage.setItem('theme', themeMode === 'system' ? resolvedTheme : themeMode);
    }, [themeMode]);

    const toggleTheme = () => {
        setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme: resolvedTheme, themeMode, setThemeMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
