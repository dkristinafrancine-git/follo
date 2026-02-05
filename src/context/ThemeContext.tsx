import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ThemeColors, DarkTheme, LightTheme, HighContrastTheme } from '../constants/Colors';

type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
    themeMode: ThemeMode;
    toggleTheme: () => void;
    isHighContrast: boolean;
    toggleHighContrast: () => void;
    colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const KEY_THEME_MODE = 'user_theme_preference';
const KEY_HIGH_CONTRAST = 'accessibility_high_contrast';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');
    const [isHighContrast, setIsHighContrast] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedMode = await SecureStore.getItemAsync(KEY_THEME_MODE);
            if (savedMode === 'light' || savedMode === 'dark') {
                setThemeMode(savedMode);
            } else {
                setThemeMode('light'); // Default to light if no preference
            }

            const savedContrast = await SecureStore.getItemAsync(KEY_HIGH_CONTRAST);
            if (savedContrast) {
                setIsHighContrast(savedContrast === 'true');
            }
        } catch (error) {
            console.error('Failed to load theme settings', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newMode = themeMode === 'light' ? 'dark' : 'light';
            setThemeMode(newMode);
            await SecureStore.setItemAsync(KEY_THEME_MODE, newMode);
        } catch (error) {
            console.error('Failed to save theme settings', error);
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

    const getColors = (): ThemeColors => {
        if (isHighContrast) return HighContrastTheme;
        return themeMode === 'light' ? LightTheme : DarkTheme;
    };

    return (
        <ThemeContext.Provider value={{
            themeMode,
            toggleTheme,
            isHighContrast,
            toggleHighContrast,
            colors: getColors()
        }}>
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
