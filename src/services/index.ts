/**
 * Service Layer Exports
 */

export { calendarService } from './calendarService';
export { exportService } from './exportService';
export { notificationService, NOTIFICATION_CHANNELS } from './notificationService';
export { getAvatarUrl, getProfileAvatarUrl, getAvatarOptions, AVATAR_STYLES } from './avatarService';

// Stubs for native-dependent services
// These will be implemented after native build setup

export * from './widgetService';
export * from './careMetricsService';

export { healthConnectService } from './healthConnectService';

export { OCRService } from './ocrService';
export * from './myFlowService';
export { emergencyService } from './emergencyService';


