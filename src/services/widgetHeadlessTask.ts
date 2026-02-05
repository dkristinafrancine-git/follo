import { calendarEventRepository } from '../repositories/calendarEventRepository';
import { widgetService } from './widgetService';
import { notificationService } from './notificationService';
import notifee from '@notifee/react-native';

const ACTION_TAKE = 'com.onedollarapp.follo.widget.ACTION_TAKE';
const ACTION_SKIP = 'com.onedollarapp.follo.widget.ACTION_SKIP';

module.exports = async (taskData: any) => {
    console.log('[WidgetHeadlessTask] Received task', taskData);

    // taskData is { action: string, eventId: string, ...extras }
    const { action, eventId } = taskData;

    if (!eventId) {
        console.warn('[WidgetHeadlessTask] No eventId provided');
        return;
    }

    try {
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
        }

        // Refresh Widget Data
        // We assume "Active Profile" logic applies or we update for the profile this event belongs to.
        // But Repository needs profileId. Since headless task doesn't have React context, we might rely on default behavior 
        // or we need to look up the event first to get profileId.

        const event = await calendarEventRepository.getById(eventId);
        if (event) {
            const todayStr = new Date().toISOString().split('T')[0];
            const events = await calendarEventRepository.getByDay(event.profileId, todayStr);
            await widgetService.updateWidgetData(events);
        }

    } catch (error) {
        console.error('[WidgetHeadlessTask] Error processing action', error);
    }
};
