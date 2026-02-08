import { calendarEventRepository } from '../repositories/calendarEventRepository';
import { widgetService } from './widgetService';
import { notificationService } from './notificationService';
import notifee from '@notifee/react-native';

const ACTION_TAKE = 'com.onedollarapp.follo.widget.ACTION_TAKE';
const ACTION_SKIP = 'com.onedollarapp.follo.widget.ACTION_SKIP';
const ACTION_POSTPONE = 'com.onedollarapp.follo.widget.ACTION_POSTPONE';

module.exports = async (taskData: any) => {
    console.log('[WidgetHeadlessTask] Received task', taskData);

    // taskData is { action: string, eventId: string, ...extras }
    const { action, eventId } = taskData;

    if (!eventId) {
        console.warn('[WidgetHeadlessTask] No eventId provided');
        return;
    }

    try {
        // Get event to find profileId
        const event = await calendarEventRepository.getById(eventId);
        if (!event) {
            console.warn('[WidgetHeadlessTask] Event not found:', eventId);
            return;
        }

        if (action === ACTION_TAKE) {
            console.log('[WidgetHeadlessTask] Taking Medication', eventId);
            await calendarEventRepository.update(eventId, {
                status: 'completed',
                completedTime: new Date().toISOString()
            });
            // Cancel notification if it exists
            await notificationService.cancelNotification(eventId);

        } else if (action === ACTION_SKIP) {
            console.log('[WidgetHeadlessTask] Skipping Medication', eventId);
            await calendarEventRepository.update(eventId, {
                status: 'skipped'
            });
            await notificationService.cancelNotification(eventId);

        } else if (action === ACTION_POSTPONE) {
            console.log('[WidgetHeadlessTask] Postponing Medication', eventId);
            await calendarEventRepository.postponeEvent(eventId, 15); // 15 minutes
            // Notification will be rescheduled by notification service
        }

        // Refresh Widget Data
        await widgetService.updateWidget(event.profileId);

    } catch (error) {
        console.error('[WidgetHeadlessTask] Error processing action', error);
    }
};
