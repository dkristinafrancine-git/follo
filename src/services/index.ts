/**
 * Service Layer Exports
 */

export { calendarService } from './calendarService';
export { exportService } from './exportService';
export { notificationService, NOTIFICATION_CHANNELS } from './notificationService';
export { getAvatarUrl, getProfileAvatarUrl, getAvatarOptions, AVATAR_STYLES } from './avatarService';

// Stubs for native-dependent services
// These will be implemented after native build setup

/**
 * Widget Service (stub)
 * Requires: Kotlin MedicationWidgetProvider native module
 */
export const widgetService = {
    async updateWidget(): Promise<void> {
        console.log('[WidgetService] updateWidget called (stub - requires native build)');
    },
    async getWidgetData(): Promise<null> {
        console.log('[WidgetService] getWidgetData called (stub)');
        return null;
    },
};

/**
 * Health Connect Service (stub)
 * Requires: HealthConnectModule.kt native module
 */
export const healthConnectService = {
    async isAvailable(): Promise<boolean> {
        console.log('[HealthConnectService] isAvailable called (stub)');
        return false;
    },
    async requestPermissions(): Promise<boolean> {
        console.log('[HealthConnectService] requestPermissions called (stub)');
        return false;
    },
    async syncData(): Promise<void> {
        console.log('[HealthConnectService] syncData called (stub)');
    },
};

export { OCRService } from './ocrService';
