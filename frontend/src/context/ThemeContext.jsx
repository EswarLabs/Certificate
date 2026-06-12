import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or default to 'light'
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved : 'dark';
    });

    useEffect(() => {
        // Apply theme class to <html> element for CSS variable switching
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark-theme');
        } else {
            root.classList.remove('dark-theme');
        }
        // Persist selection
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
