import { NativeModules, Platform } from 'react-native';

export interface HeavySleeperPermissions {
    dndAccess: boolean;
    exactAlarm: boolean;
    fullScreenIntent: boolean;
    appearOnTop: boolean;
}

interface FullScreenIntentModuleType {
    checkAllPermissions(): Promise<HeavySleeperPermissions>;
    requestDndAccess(): Promise<boolean>;
    requestExactAlarmPermission(): Promise<boolean>;
    requestFullScreenIntentPermission(): Promise<boolean>;
    requestAppearOnTopPermission(): Promise<boolean>;
    // Legacy methods
    canUseFullScreenIntent(): Promise<boolean>;
    openFullScreenIntentSettings(): Promise<boolean>;
}

const FullScreenIntentModuleNative = NativeModules.FullScreenIntentModule as FullScreenIntentModuleType | undefined;

/**
 * Check all permissions required for Heavy Sleeper mode
 * Returns object with status of each permission
 */
export const checkHeavySleeperPermissions = async (): Promise<HeavySleeperPermissions> => {
    if (Platform.OS !== 'android') {
        return { dndAccess: true, exactAlarm: true, fullScreenIntent: true, appearOnTop: true };
    }
    if (Platform.Version < 31) {
        return { dndAccess: true, exactAlarm: true, fullScreenIntent: true, appearOnTop: true };
    }

    if (!FullScreenIntentModuleNative) {
        console.warn('[HeavySleeper] Native module not available');
        return { dndAccess: false, exactAlarm: false, fullScreenIntent: false, appearOnTop: false };
    }

    try {
        const permissions = await FullScreenIntentModuleNative.checkAllPermissions();
        console.log('[HeavySleeper] Permissions:', permissions);
        return permissions;
    } catch (error) {
        console.error('[HeavySleeper] Permission check failed:', error);
        return { dndAccess: false, exactAlarm: false, fullScreenIntent: false, appearOnTop: false };
    }
};

/**
 * Request Do Not Disturb access
 * Opens system settings for user to grant permission
 */
export const requestDndAccess = async (): Promise<void> => {
    if (Platform.OS !== 'android' || !FullScreenIntentModuleNative) return;

    try {
        await FullScreenIntentModuleNative.requestDndAccess();
        console.log('[HeavySleeper] Opened DND settings');
    } catch (error) {
        console.error('[HeavySleeper] Failed to open DND settings:', error);
    }
};

/**
 * Request exact alarm permission (Android 12+)
 * Opens system settings for user to grant permission
 */
export const requestExactAlarmPermission = async (): Promise<void> => {
    if (Platform.OS !== 'android' || !FullScreenIntentModuleNative) return;

    try {
        await FullScreenIntentModuleNative.requestExactAlarmPermission();
        console.log('[HeavySleeper] Opened exact alarm settings');
    } catch (error) {
        console.error('[HeavySleeper] Failed to open exact alarm settings:', error);
    }
};

/**
 * Request full-screen intent permission
 * Opens system settings for user to grant permission
 */
export const requestFullScreenIntentPermission = async (): Promise<void> => {
    if (Platform.OS !== 'android' || !FullScreenIntentModuleNative) return;

    try {
        await FullScreenIntentModuleNative.requestFullScreenIntentPermission();
        console.log('[HeavySleeper] Opened full-screen intent settings');
    } catch (error) {
        console.error('[HeavySleeper] Failed to open full-screen intent settings:', error);
    }
};

/**
 * Request appear on top permission (SYSTEM_ALERT_WINDOW)
 * Opens system settings for user to grant permission
 */
export const requestAppearOnTopPermission = async (): Promise<void> => {
    if (Platform.OS !== 'android' || !FullScreenIntentModuleNative) return;

    try {
        await FullScreenIntentModuleNative.requestAppearOnTopPermission();
        console.log('[HeavySleeper] Opened appear on top settings');
    } catch (error) {
        console.error('[HeavySleeper] Failed to open appear on top settings:', error);
    }
};

// Legacy exports for backward compatibility
export const checkFullScreenIntentPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 31) return true;

    if (!FullScreenIntentModuleNative) return false;

    try {
        return await FullScreenIntentModuleNative.canUseFullScreenIntent();
    } catch (error) {
        console.error('[FullScreenIntent] Permission check failed:', error);
        return false;
    }
};

export const openFullScreenIntentSettings = async (): Promise<void> => {
    await requestFullScreenIntentPermission();
};
