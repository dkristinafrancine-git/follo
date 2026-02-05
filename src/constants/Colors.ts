export type ThemeColors = {
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

export const DarkTheme: ThemeColors = {
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

export const LightTheme: ThemeColors = {
    background: '#ffffff',
    card: '#f3f4f6',
    text: '#111827',
    subtext: '#6b7280',
    primary: '#6366f1',
    border: '#e5e7eb',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    tint: '#f3f4f6',
};

export const HighContrastTheme: ThemeColors = {
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
