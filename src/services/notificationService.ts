/**
 * Notification Service
 * Manages medication reminders with Home Mode (gentle) and Heavy Sleeper Mode (alarm)
 * 
 * NOTE: This is a stub implementation. Full functionality requires:
 * - Notifee native package installation
 * - Native build (expo prebuild)
 * 
 * Once native build is complete, replace stubs with actual Notifee calls.
 */

import { CalendarEvent } from '../types';

// Notification modes
export type NotificationMode = 'home' | 'heavy_sleeper';

// Notification channel IDs
export const NOTIFICATION_CHANNELS = {
    MEDICATION_REMINDER: 'medication_reminder',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    REFILL_ALERT: 'refill_alert',
    HEAVY_SLEEPER_ALARM: 'heavy_sleeper_alarm',
} as const;

interface ScheduledNotification {
    id: string;
    eventId: string;
    scheduledTime: Date;
    title: string;
    body: string;
    mode: NotificationMode;
}

// In-memory tracking of scheduled notifications (will be replaced with Notifee)
const scheduledNotifications = new Map<string, ScheduledNotification>();

export const notificationService = {
    /**
     * Initialize notification channels
     * Should be called on app startup
     * 
     * TODO: Implement with Notifee.createChannel()
     */
    async initialize(): Promise<void> {
        console.log('[NotificationService] Initializing notification channels (stub)');
        // Stub: In actual implementation, create Notifee channels here
        // await notifee.createChannel({
        //   id: NOTIFICATION_CHANNELS.MEDICATION_REMINDER,
        //   name: 'Medication Reminders',
        //   lights: true,
        //   vibration: true,
        //   importance: AndroidImportance.HIGH,
        // });
    },

    /**
     * Schedule a notification for a calendar event
     * 
     * TODO: Implement with Notifee.createTriggerNotification()
     */
    async scheduleEventNotification(
        event: CalendarEvent,
        mode: NotificationMode = 'home'
    ): Promise<string> {
        const notificationId = `event_${event.id}`;

        console.log(`[NotificationService] Scheduling notification for event ${event.id} (stub)`);

        // Store in memory for now
        scheduledNotifications.set(notificationId, {
            id: notificationId,
            eventId: event.id,
            scheduledTime: new Date(event.scheduledTime),
            title: getNotificationTitle(event),
            body: getNotificationBody(event),
            mode,
        });

        // Stub: In actual implementation:
        // const trigger: TimestampTrigger = {
        //   type: TriggerType.TIMESTAMP,
        //   timestamp: new Date(event.scheduledTime).getTime(),
        //   alarmManager: mode === 'heavy_sleeper' ? { allowWhileIdle: true } : undefined,
        // };
        // await notifee.createTriggerNotification({ ... }, trigger);

        return notificationId;
    },

    /**
     * Cancel a scheduled notification
     */
    async cancelNotification(notificationId: string): Promise<void> {
        console.log(`[NotificationService] Cancelling notification ${notificationId} (stub)`);
        scheduledNotifications.delete(notificationId);
        // await notifee.cancelNotification(notificationId);
    },

    /**
     * Cancel all notifications for a specific event
     */
    async cancelEventNotifications(eventId: string): Promise<void> {
        const notificationId = `event_${eventId}`;
        await this.cancelNotification(notificationId);
    },

    /**
     * Schedule notifications for all pending events
     */
    async scheduleUpcomingNotifications(
        events: CalendarEvent[],
        mode: NotificationMode = 'home'
    ): Promise<number> {
        let scheduled = 0;

        for (const event of events) {
            if (event.status === 'pending') {
                await this.scheduleEventNotification(event, mode);
                scheduled++;
            }
        }

        console.log(`[NotificationService] Scheduled ${scheduled} notifications (stub)`);
        return scheduled;
    },

    /**
     * Display immediate notification (for testing/debugging)
     */
    async displayNow(title: string, body: string): Promise<void> {
        console.log(`[NotificationService] Display now: ${title} - ${body} (stub)`);
        // await notifee.displayNotification({ title, body, android: { channelId: ... } });
    },

    /**
     * Get current notification mode from settings
     * TODO: Integrate with settings storage
     */
    async getMode(): Promise<NotificationMode> {
        // Default to home mode
        return 'home';
    },

    /**
     * Check if notifications are enabled
     */
    async areNotificationsEnabled(): Promise<boolean> {
        // Stub: Always return true
        // In actual implementation: return (await notifee.getNotificationSettings()).authorizationStatus === AuthorizationStatus.AUTHORIZED
        return true;
    },

    /**
     * Request notification permissions
     */
    async requestPermissions(): Promise<boolean> {
        console.log('[NotificationService] Requesting notification permissions (stub)');
        // await notifee.requestPermission();
        return true;
    },

    /**
     * Get all scheduled notification IDs (for debugging)
     */
    getScheduledIds(): string[] {
        return Array.from(scheduledNotifications.keys());
    },
};

// =====================
// Helper Functions
// =====================

function getNotificationTitle(event: CalendarEvent): string {
    switch (event.eventType) {
        case 'medication_due':
            return '💊 Medication Reminder';
        case 'supplement_due':
            return '🌿 Supplement Reminder';
        case 'appointment':
            return '📅 Appointment Reminder';
        default:
            return '⏰ Reminder';
    }
}

function getNotificationBody(event: CalendarEvent): string {
    return `Time to take ${event.title}`;
}
