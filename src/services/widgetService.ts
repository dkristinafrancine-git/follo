/**
 * Widget Service
 * Syncs app data to Native Android Widget via WidgetModule bridge
 */

import { NativeModules } from 'react-native';
import { calendarEventRepository } from '../repositories/calendarEventRepository';
import { medicationRepository } from '../repositories/medicationRepository';
import { activityRepository } from '../repositories/activityRepository';
import { appointmentRepository } from '../repositories/appointmentRepository';
import { format, addDays } from 'date-fns';

const { WidgetModule } = NativeModules;

interface WidgetMedication {
    id: string;
    name: string;
    dosage: string;
    scheduledTime: string;
    hideName: boolean;
    photoUri?: string;
}

interface WidgetRefillAlert {
    medicationName: string;
    daysRemaining: number;
    isCritical: boolean;
}

interface WidgetQuickStats {
    adherencePercent: number;
    activitiesLogged: number;
    nextAppointment?: string;
}

interface WidgetConfig {
    showHealthLogReminders: boolean;
    showRefillAlerts: boolean;
    showQuickStats: boolean;
}

interface WidgetData {
    medications: WidgetMedication[];
    refillAlerts: WidgetRefillAlert[];
    quickStats: WidgetQuickStats;
    widgetConfig: WidgetConfig;
}

export const widgetService = {
    /**
     * Update the widget with latest data for active profile
     */
    async updateWidget(profileId: string): Promise<void> {
        try {
            if (!WidgetModule) {
                console.warn('[WidgetService] WidgetModule not available');
                return;
            }

            // Check if widget is installed
            const isInstalled = await WidgetModule.isWidgetInstalled();
            if (!isInstalled) {
                console.log('[WidgetService] Widget not installed, skipping update');
                return;
            }

            // Build widget data
            const widgetData = await this.buildWidgetData(profileId);

            // Send to native module
            await WidgetModule.updateWidget(widgetData);
            console.log('[WidgetService] Widget updated successfully');
        } catch (error) {
            console.error('[WidgetService] Failed to update widget', error);
        }
    },

    /**
     * Build comprehensive widget data from repositories
     */
    async buildWidgetData(profileId: string): Promise<WidgetData> {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // Get pending medications for today
        const pendingEvents = await calendarEventRepository.getPendingToday(profileId);
        const medicationEvents = pendingEvents.filter(e => e.eventType === 'medication_due');

        // Get medication details for each event
        const medications: WidgetMedication[] = [];
        for (const event of medicationEvents.slice(0, 5)) { // Limit to 5 for widget
            const medication = await medicationRepository.getById(event.sourceId);
            if (medication) {
                medications.push({
                    id: event.id,
                    name: medication.name,
                    dosage: medication.dosage || '',
                    scheduledTime: new Date(event.scheduledTime).getTime().toString(),
                    hideName: medication.hideName || false,
                    photoUri: medication.photoUri || undefined,
                });
            }
        }

        // Get refill alerts
        const allMedications = await medicationRepository.getAllByProfile(profileId);
        const refillAlerts: WidgetRefillAlert[] = allMedications
            .filter((med: any) =>
                med.isActive &&
                med.currentQuantity !== null &&
                med.currentQuantity <= (med.refillThreshold || 7)
            )
            .map((med: any) => ({
                medicationName: med.name,
                daysRemaining: med.currentQuantity || 0,
                isCritical: (med.currentQuantity || 0) <= 3,
            }))
            .sort((a: WidgetRefillAlert, b: WidgetRefillAlert) => a.daysRemaining - b.daysRemaining)
            .slice(0, 3); // Top 3 critical refills

        // Calculate adherence for today
        const stats = await calendarEventRepository.getStats(profileId, todayStr, todayStr);
        const adherencePercent = stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0;

        // Get today's activity count
        const todayActivities = await activityRepository.getByDay(profileId, todayStr);
        const activitiesLogged = todayActivities.length;

        // Get next appointment
        const upcomingAppointments = await appointmentRepository.getUpcoming(profileId, 1);
        let nextAppointment: string | undefined;
        if (upcomingAppointments.length > 0) {
            const appt = upcomingAppointments[0];
            const apptDate = new Date(appt.scheduledTime);
            const today = new Date();
            const tomorrow = addDays(today, 1);

            if (format(apptDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
                nextAppointment = `Today, ${format(apptDate, 'h:mm a')}`;
            } else if (format(apptDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
                nextAppointment = `Tomorrow, ${format(apptDate, 'h:mm a')}`;
            } else {
                nextAppointment = format(apptDate, 'MMM d, h:mm a');
            }
        }

        // Get widget configuration (default all enabled)
        const widgetConfig = await this.getWidgetConfig();

        return {
            medications,
            refillAlerts,
            quickStats: {
                adherencePercent,
                activitiesLogged,
                nextAppointment,
            },
            widgetConfig,
        };
    },

    /**
     * Get widget configuration from storage
     */
    async getWidgetConfig(): Promise<WidgetConfig> {
        // TODO: Read from settings repository when widget config is added
        // For now, return defaults
        return {
            showHealthLogReminders: true,
            showRefillAlerts: true,
            showQuickStats: true,
        };
    },

    /**
     * Force widget refresh
     */
    async refreshWidget(): Promise<void> {
        try {
            if (WidgetModule) {
                await WidgetModule.refreshWidget();
            }
        } catch (error) {
            console.error('[WidgetService] Failed to refresh widget', error);
        }
    },

    /**
     * Check if widget is installed
     */
    async isWidgetInstalled(): Promise<boolean> {
        try {
            if (WidgetModule) {
                return await WidgetModule.isWidgetInstalled();
            }
            return false;
        } catch (error) {
            console.error('[WidgetService] Failed to check widget installation', error);
            return false;
        }
    },
};
