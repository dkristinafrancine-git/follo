import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type ThemeColors = {
    background: string;
    card: string;
    text: string;
    subtext: string;
    primary: string;
    border: string;
    danger: string;
    success: string;
    warning: string;
    tint: string;
};

const defaultTheme: ThemeColors = {
    background: '#1a1a2e',
    card: '#252542',
    text: '#ffffff',
    subtext: '#9ca3af',
    primary: '#6366f1',
    border: 'transparent',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    tint: '#252542',
};

const highContrastTheme: ThemeColors = {
    background: '#000000',
    card: '#000000',
    text: '#ffffff',
    subtext: '#ffff00',
    primary: '#ffff00',
    border: '#ffffff',
    danger: '#ff0000',
    success: '#00ff00',
    warning: '#ffff00',
    tint: '#ffffff',
};

type ThemeContextType = {
    isHighContrast: boolean;
    toggleHighContrast: () => void;
    colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const KEY_HIGH_CONTRAST = 'accessibility_high_contrast';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isHighContrast, setIsHighContrast] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await SecureStore.getItemAsync(KEY_HIGH_CONTRAST);
            if (saved) {
                setIsHighContrast(saved === 'true');
            }
        } catch (error) {
            console.error('Failed to load theme settings', error);
        }
    };

    const toggleHighContrast = async () => {
        try {
            const newValue = !isHighContrast;
            setIsHighContrast(newValue);
            await SecureStore.setItemAsync(KEY_HIGH_CONTRAST, String(newValue));
        } catch (error) {
            console.error('Failed to save theme settings', error);
        }
    };

    const colors = isHighContrast ? highContrastTheme : defaultTheme;

    return (
        <ThemeContext.Provider value={{ isHighContrast, toggleHighContrast, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
