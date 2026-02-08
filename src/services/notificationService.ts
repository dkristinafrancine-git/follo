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
    AndroidVisibility,
    EventType,
    Event
} from '@notifee/react-native';
import { Platform, DeviceEventEmitter } from 'react-native';
import { CalendarEvent } from '../types';
import { calendarEventRepository, settingsRepository } from '../repositories';
import { NotificationMode } from '../repositories/settingsRepository';

// Notification channel IDs
export const NOTIFICATION_CHANNELS = {
    MEDICATION_REMINDER: 'medication_reminder',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    HEAVY_SLEEPER_ALARM: 'heavy_sleeper_alarm_v3',
} as const;

export const notificationService = {
    /**
     * Initialize notification channels and permissions
     */
    async initialize(): Promise<void> {
        console.log('[NotificationService] Initializing Notifee');

        // Request permissions
        await notifee.requestPermission();

        // Note: Android 12+ requires USE_FULL_SCREEN_INTENT permission (declared in app.json)
        // The permission is automatically granted on install for alarm apps
        // If user revokes it, they must manually re-enable in system settings

        if (Platform.OS === 'android') {
            await notifee.createChannel({
                id: NOTIFICATION_CHANNELS.MEDICATION_REMINDER,
                name: 'Medication Reminders',
                importance: AndroidImportance.HIGH,
                visibility: AndroidVisibility.PUBLIC,
                sound: 'default',
                vibration: true,
                vibrationPattern: [300, 500],
            });

            await notifee.createChannel({
                id: NOTIFICATION_CHANNELS.APPOINTMENT_REMINDER,
                name: 'Appointment Reminders',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibration: true,
            });

            // Heavy Sleeper Channel: HIGH importance (highest available) for full-screen intents
            await notifee.createChannel({
                id: NOTIFICATION_CHANNELS.HEAVY_SLEEPER_ALARM,
                name: 'Heavy Sleeper Alarm',
                importance: AndroidImportance.HIGH,
                bypassDnd: true,
                sound: 'default',
                vibration: true,
                vibrationPattern: [300, 1000, 500, 1000, 500, 1000],
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
        mode?: NotificationMode
    ): Promise<string> {
        if (new Date(event.scheduledTime).getTime() < Date.now() - 5 * 60 * 1000) {
            console.log(`[NotificationService] Skipping past event ${event.id}`);
            return '';
        }

        const effectiveMode = mode ?? await settingsRepository.getNotificationMode();

        const channelId = getChannelId(event, effectiveMode);
        const title = getNotificationTitle(event);
        const body = getNotificationBody(event);
        let triggerTimestamp = new Date(event.scheduledTime).getTime();

        // Safety check: specific Notifee error "timestamp must be in the future"
        // If event is in the past (but within the 5 min window allowed above), schedule it for 5 seconds from now
        if (triggerTimestamp <= Date.now()) {
            console.log(`[NotificationService] Event ${event.id} is slightly in past, bumping to future`);
            triggerTimestamp = Date.now() + 5000;
        }

        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: triggerTimestamp,
            alarmManager: effectiveMode === 'heavy_sleeper' ? {
                allowWhileIdle: true,
            } : undefined,
        };

        console.log(`[NotificationService] Scheduling notification with mode=${effectiveMode}, channelId=${channelId}, timestamp=${new Date(triggerTimestamp).toISOString()}`);
        if (effectiveMode === 'heavy_sleeper') {
            console.log('[NotificationService] ⚠️ HEAVY SLEEPER MODE - Using exact alarm manager with full-screen intent');
        }

        try {
            const id = await notifee.createTriggerNotification({
                id: event.id, // Use event ID as notification ID for easier tracking
                title,
                body,
                android: {
                    channelId,
                    category: effectiveMode === 'heavy_sleeper' ? AndroidCategory.ALARM : AndroidCategory.REMINDER,
                    importance: effectiveMode === 'heavy_sleeper' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
                    // Full Screen Action (Heavy Sleeper)
                    fullScreenAction: effectiveMode === 'heavy_sleeper' ? {
                        id: 'full-screen',
                        launchActivity: 'com.onedollarapp.follo.MainActivity',
                    } : undefined,
                    // Alarm-specific settings for Heavy Sleeper
                    ...(effectiveMode === 'heavy_sleeper' && {
                        autoCancel: false,
                        ongoing: true,
                        showTimestamp: true,
                    }),
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

            console.log(`[NotificationService] ✅ Scheduled ${id} for ${event.scheduledTime}`);
            if (effectiveMode === 'heavy_sleeper') {
                console.log(`[NotificationService] ✅ Heavy sleeper alarm created with fullScreenAction. Event ID: ${event.id}`);
            }
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
     * Schedule notifications for a list of events
     * NOTE: This is now non-destructive to other events NOT in the list.
     */
    async scheduleUpcomingNotifications(
        events: CalendarEvent[],
        mode?: NotificationMode
    ): Promise<number> {
        // Resolve mode if not provided
        const effectiveMode = mode ?? await settingsRepository.getNotificationMode();

        let scheduled = 0;
        const now = Date.now();

        for (const event of events) {
            // We schedule if it's pending. 
            // scheduleEventNotification has its own logic to handle past events (up to 5 mins)
            // but we filter here based on a slightly wider window to catch overdue items
            if (event.status === 'pending') {
                const eventTime = new Date(event.scheduledTime).getTime();

                // If it's in the future OR within the last 24 hours (overdue)
                // we attempt to schedule it. scheduleEventNotification will handle the future offset.
                if (eventTime > now - 24 * 60 * 60 * 1000) {
                    await this.scheduleEventNotification(event, effectiveMode);
                    scheduled++;
                }
            }
        }

        return scheduled;
    },

    /**
     * Handle notification events (Action press)
     */
    async handleNotificationEvent({ type, detail }: Event): Promise<void> {
        const { notification, pressAction } = detail;
        console.log(`[NotificationService] Event received: type=${type} action=${pressAction?.id} notification=${notification?.id}`);

        try {
            if (type === EventType.ACTION_PRESS && pressAction && notification?.data?.eventId) {
                const eventId = notification.data.eventId as string;
                console.log(`[NotificationService] Action ${pressAction.id} on event ${eventId}`);

                if (pressAction.id === 'TAKE') {
                    // update inventory if it's a medication
                    console.log(`[NotificationService] Processing TAKE for event ${eventId}`);
                    const event = await calendarEventRepository.getById(eventId);

                    if (event && event.eventType === 'medication_due') {
                        console.log(`[NotificationService] Decrementing quantity for medication ${event.sourceId}`);
                        const { medicationRepository } = await import('../repositories');
                        await medicationRepository.decrementQuantity(event.sourceId);
                        console.log(`[NotificationService] Quantity decremented`);
                    }

                    console.log(`[NotificationService] Updating event status to completed`);
                    await calendarEventRepository.update(eventId, {
                        status: 'completed',
                        completedTime: new Date().toISOString(),
                    });
                    console.log(`[NotificationService] Event updated, cancelling notification`);
                    await notifee.cancelNotification(notification.id!);
                    console.log(`[NotificationService] Notification cancelled`);
                    DeviceEventEmitter.emit('REFRESH_TIMELINE');
                } else if (pressAction.id === 'SKIP') {
                    console.log(`[NotificationService] Processing SKIP for event ${eventId}`);
                    await calendarEventRepository.update(eventId, {
                        status: 'skipped',
                    });
                    console.log(`[NotificationService] Event updated to skipped`);
                    await notifee.cancelNotification(notification.id!);
                    DeviceEventEmitter.emit('REFRESH_TIMELINE');
                }
            }
        } catch (error) {
            console.error('[NotificationService] Failed to handle event', error);
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
