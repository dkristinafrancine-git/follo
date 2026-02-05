/**
 * Notification Service
 * Manages medication reminders using Notifee
 * Supports Home Mode and Heavy Sleeper Mode (Full Screen Alarm)
 */

import notifee, {
    AndroidImportance,
    AndroidCategory,
    TriggerType,
    TimestampTrigger,
    RepeatFrequency,
    AndroidVisibility,
    EventType,
    Event
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { CalendarEvent } from '../types';
import { calendarEventRepository } from '../repositories';

// Notification modes
export type NotificationMode = 'home' | 'heavy_sleeper';

// Notification channel IDs
export const NOTIFICATION_CHANNELS = {
    MEDICATION_REMINDER: 'medication_reminder',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    HEAVY_SLEEPER_ALARM: 'heavy_sleeper_alarm',
} as const;

export const notificationService = {
    /**
     * Initialize notification channels and permissions
     */
    async initialize(): Promise<void> {
        console.log('[NotificationService] Initializing Notifee');

        // Request permissions
        await notifee.requestPermission();

        if (Platform.OS === 'android') {
            await notifee.createChannel({
                id: NOTIFICATION_CHANNELS.MEDICATION_REMINDER,
                name: 'Medication Reminders',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                sound: 'default',
                vibration: true,
                vibrationPattern: [0, 250, 250, 250],
            });

            await notifee.createChannel({
                id: NOTIFICATION_CHANNELS.APPOINTMENT_REMINDER,
                name: 'Appointment Reminders',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibration: true,
            });

            // Heavy Sleeper Channel: Max importance, overrides DND if possible
            await notifee.createChannel({
                id: NOTIFICATION_CHANNELS.HEAVY_SLEEPER_ALARM,
                name: 'Heavy Sleeper Alarm',
                importance: AndroidImportance.HIGH, // MAX requires special handling, HIGH is safer for now
                sound: 'default', // In real app, put a custom 'alarm.mp3' in /res/raw
                vibration: true,
                vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
            });

            // Set up categories (Actions)
            await notifee.setNotificationCategories([
                {
                    id: 'medication',
                    actions: [
                        {
                            id: 'TAKE',
                            title: 'Take',
                            foreground: false, // Background action
                        },
                        {
                            id: 'SKIP',
                            title: 'Skip',
                            foreground: false,
                        },
                    ],
                },
            ]);
        }
    },

    /**
     * Schedule a notification for a calendar event
     */
    async scheduleEventNotification(
        event: CalendarEvent,
        mode: NotificationMode = 'home'
    ): Promise<string> {
        if (new Date(event.scheduledTime).getTime() < Date.now() - 5 * 60 * 1000) {
            console.log(`[NotificationService] Skipping past event ${event.id}`);
            return '';
        }

        const channelId = getChannelId(event, mode);
        const title = getNotificationTitle(event);
        const body = getNotificationBody(event);
        const triggerTimestamp = new Date(event.scheduledTime).getTime();

        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: triggerTimestamp,
            alarmManager: mode === 'heavy_sleeper' ? {
                allowWhileIdle: true,
            } : undefined,
        };

        try {
            const id = await notifee.createTriggerNotification({
                id: event.id, // Use event ID as notification ID for easier tracking
                title,
                body,
                android: {
                    channelId,
                    category: mode === 'heavy_sleeper' ? AndroidCategory.ALARM : AndroidCategory.REMINDER,
                    importance: mode === 'heavy_sleeper' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
                    // Full Screen Action (Heavy Sleeper)
                    fullScreenAction: mode === 'heavy_sleeper' ? {
                        id: 'default', // Launches main activity
                    } : undefined,
                    actions: (event.eventType === 'medication_due' || event.eventType === 'supplement_due')
                        ? [
                            { title: 'Take', pressAction: { id: 'TAKE' } },
                            { title: 'Skip', pressAction: { id: 'SKIP' } },
                        ]
                        : undefined,
                    pressAction: {
                        id: 'default',
                    },
                },
                data: {
                    eventId: event.id,
                    type: event.eventType,
                },
            }, trigger);

            console.log(`[NotificationService] Scheduled ${id} for ${event.scheduledTime}`);
            return id;
        } catch (error) {
            console.error('[NotificationService] Failed to schedule', error);
            return '';
        }
    },

    /**
     * Cancel a scheduled notification
     */
    async cancelNotification(notificationId: string): Promise<void> {
        await notifee.cancelNotification(notificationId);
    },

    /**
     * Cancel all notifications
     */
    async cancelAll(): Promise<void> {
        await notifee.cancelAllNotifications();
    },

    /**
     * Schedule notifications for all upcoming pending events
     */
    async scheduleUpcomingNotifications(
        events: CalendarEvent[],
        mode: NotificationMode = 'home'
    ): Promise<number> {
        // Cancel all first to ensure sync
        await this.cancelAll();

        let scheduled = 0;
        const now = Date.now();

        for (const event of events) {
            if (event.status === 'pending' && new Date(event.scheduledTime).getTime() > now) {
                await this.scheduleEventNotification(event, mode);
                scheduled++;
            }
        }

        return scheduled;
    },

    /**
     * Handle notification events (Action press)
     */
    async handleNotificationEvent({ type, detail }: Event): Promise<void> {
        const { notification, pressAction } = detail;

        if (type === EventType.ACTION_PRESS && pressAction && notification?.data?.eventId) {
            const eventId = notification.data.eventId as string;
            console.log(`[NotificationService] Action ${pressAction.id} on event ${eventId}`);

            if (pressAction.id === 'TAKE') {
                await calendarEventRepository.update(eventId, {
                    status: 'completed',
                    completedTime: new Date().toISOString(),
                });
                await notifee.cancelNotification(notification.id!);
            } else if (pressAction.id === 'SKIP') {
                await calendarEventRepository.update(eventId, {
                    status: 'skipped',
                });
                await notifee.cancelNotification(notification.id!);
            }
        }
    }
};

// =====================
// Helper Functions
// =====================

function getChannelId(event: CalendarEvent, mode: NotificationMode): string {
    if (mode === 'heavy_sleeper') return NOTIFICATION_CHANNELS.HEAVY_SLEEPER_ALARM;
    return event.eventType === 'appointment'
        ? NOTIFICATION_CHANNELS.APPOINTMENT_REMINDER
        : NOTIFICATION_CHANNELS.MEDICATION_REMINDER;
}

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
    const time = new Date(event.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (event.eventType === 'appointment') {
        return `Upcoming: ${event.title} at ${time}`;
    }
    return `Time to take ${event.title} (${time})`;
}
