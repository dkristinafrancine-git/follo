import * as SecureStore from 'expo-secure-store';

export type NotificationMode = 'home' | 'heavy_sleeper';

const KEYS = {
    NOTIFICATION_MODE: 'settings_notification_mode',
};

export const settingsRepository = {
    /**
     * Get the current notification mode
     * Defaults to 'home' if not set
     */
    async getNotificationMode(): Promise<NotificationMode> {
        try {
            const mode = await SecureStore.getItemAsync(KEYS.NOTIFICATION_MODE);
            return (mode === 'heavy_sleeper' ? 'heavy_sleeper' : 'home');
        } catch (error) {
            console.error('[SettingsRepository] Failed to get notification mode', error);
            return 'home';
        }
    },

    /**
     * Set the notification mode
     */
    async setNotificationMode(mode: NotificationMode): Promise<void> {
        try {
            await SecureStore.setItemAsync(KEYS.NOTIFICATION_MODE, mode);
        } catch (error) {
            console.error('[SettingsRepository] Failed to set notification mode', error);
            throw error;
        }
    }
};
