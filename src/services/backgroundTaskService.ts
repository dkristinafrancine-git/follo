/**
 * Background Task Service
 * Handles periodic tasks like rescheduling notifications
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { calendarEventRepository, profileRepository, settingsRepository } from '../repositories';
import { notificationService } from './notificationService';
import { format, addDays } from 'date-fns';

const NOTIFICATION_RESCHEDULE_TASK = 'NOTIFICATION_RESCHEDULE_TASK';

// Define the task
TaskManager.defineTask(NOTIFICATION_RESCHEDULE_TASK, async () => {
    try {
        console.log(`[${NOTIFICATION_RESCHEDULE_TASK}] Running background task`);

        // 1. Fetch all profiles to ensure we cover everyone
        // (For MVP, getting all might be heavy, but safe)
        const profiles = await profileRepository.getAll();

        if (profiles.length === 0) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        let totalScheduled = 0;
        const now = new Date();
        const ranges: string[] = [];
        for (let i = 0; i < 7; i++) {
            ranges.push(format(addDays(now, i), 'yyyy-MM-dd'));
        }

        // 2. Clear all existing to avoid duplicates (controlled reset)
        // Note: notificationService.scheduleUpcomingNotifications does this too, but per call.
        // We should be careful not to cancel, then fail to schedule.
        // For robustness, notificationService.scheduleUpcomingNotifications cancels ALL then schedules.
        // If we call it multiple times (per profile), we might cancel previous profile's.
        // Refactor: We should gather ALL events first.

        let allEvents: any[] = [];

        for (const profile of profiles) {
            for (const dateStr of ranges) {
                const events = await calendarEventRepository.getByDay(profile.id, dateStr);
                const pending = events.filter(e => e.status === 'pending');
                allEvents = [...allEvents, ...pending];
            }
        }

        // 3. Schedule
        if (allEvents.length > 0) {
            // Service now handles fetching mode if not provided, but we can be explicit if needed.
            // Since we updated scheduleUpcomingNotifications to fetch it if undefined, we can just pass the events.
            totalScheduled = await notificationService.scheduleUpcomingNotifications(allEvents);
            console.log(`[${NOTIFICATION_RESCHEDULE_TASK}] Scheduled ${totalScheduled} events`);
            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
        console.error(`[${NOTIFICATION_RESCHEDULE_TASK}] Failed`, error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

export const backgroundTaskService = {
    /**
     * Register the background fetch task
     */
    async registerAsync(): Promise<void> {
        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(NOTIFICATION_RESCHEDULE_TASK);
            if (!isRegistered) {
                await BackgroundFetch.registerTaskAsync(NOTIFICATION_RESCHEDULE_TASK, {
                    minimumInterval: 60 * 60 * 6, // 6 hours
                    stopOnTerminate: false, // Continue after kill
                    startOnBoot: true, // Android Only
                });
                console.log('[BackgroundTaskService] Registered notification reschedule task');
            }
        } catch (err) {
            console.error('[BackgroundTaskService] Failed to register task', err);
        }
    },

    /**
     * Unregister the task
     */
    async unregisterAsync(): Promise<void> {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(NOTIFICATION_RESCHEDULE_TASK);
        if (isRegistered) {
            await BackgroundFetch.unregisterTaskAsync(NOTIFICATION_RESCHEDULE_TASK);
        }
    }
};
