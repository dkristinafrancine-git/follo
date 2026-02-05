/**
 * Widget Service
 * Syncs app data to a JSON file for the Native Android Widget to read.
 */

import * as FileSystem from 'expo-file-system';
import { CalendarEvent } from '../types';
import { format } from 'date-fns';

// @ts-ignore
const WIDGET_DATA_FILE = (FileSystem.documentDirectory ?? '') + 'widget_data.json';

export const widgetService = {
    /**
     * Update the widget data file with the latest events
     * Should be called whenever events change
     */
    async updateWidgetData(events: CalendarEvent[]): Promise<void> {
        try {
            // Filter for today's pending/completed events
            // We want to show a summary: "3 Meds left", "Next: Vitamin C at 8:00"

            const todayStr = format(new Date(), 'yyyy-MM-dd');

            // Basic data structure for the widget
            const widgetData = {
                lastUpdated: new Date().toISOString(),
                events: events.map(e => ({
                    title: e.title,
                    time: format(new Date(e.scheduledTime), 'HH:mm'),
                    status: e.status,
                    type: e.eventType
                })),
                stats: {
                    pending: events.filter(e => e.status === 'pending').length,
                    completed: events.filter(e => e.status === 'completed').length,
                    nextEvent: events.find(e => e.status === 'pending')?.title || 'All done!'
                }
            };

            await FileSystem.writeAsStringAsync(WIDGET_DATA_FILE, JSON.stringify(widgetData));
            console.log('[WidgetService] Widget data updated', WIDGET_DATA_FILE);

            // TODO: In a native module, we would send a broadcast intent to update the widget immediately.
            // For now, the widget will rely on periodic updates or we need a native module to trigger an update.

        } catch (error) {
            console.error('[WidgetService] Failed to update widget data', error);
        }
    },

    /**
     * Get path to widget data (for debugging)
     */
    getDataPath(): string {
        return WIDGET_DATA_FILE;
    }
};
