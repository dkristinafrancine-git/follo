/**
 * Calendar Service
 * Generates calendar_events from medications, supplements, and appointments
 * This is the core scheduling engine that populates the SSOT calendar_events table
 */

import {
    Medication,
    Supplement,
    Appointment,
    Activity,
    CalendarEventType,
    CreateCalendarEventInput
} from '../types';
import { calendarEventRepository } from '../repositories';
import { notificationService } from './notificationService';
import { addDays, format, parse, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';

/**
 * Generate a unique event key for deduplication
 */
function getEventKey(sourceId: string, scheduledTime: string): string {
    return `${sourceId}_${scheduledTime}`;
}

/**
 * Parse time string "HH:mm" and combine with date to create ISO string
 */
function combineDateTime(date: Date, timeString: string): string {
    const [hours, minutes] = timeString.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
}

export const calendarService = {
    /**
     * Generate calendar events for a medication for a date range
     * This should be called when a medication is created or updated
     */
    async generateMedicationEvents(
        medication: Medication,
        startDate: Date,
        endDate: Date
    ): Promise<void> {
        if (!medication.isActive || medication.timeOfDay.length === 0) {
            return;
        }

        // Delete existing future events for this medication to regenerate
        await calendarEventRepository.deleteBySource(medication.id);

        const events: CreateCalendarEventInput[] = [];
        let currentDate = startOfDay(startDate);
        const end = endOfDay(endDate);

        while (isBefore(currentDate, end) || currentDate.getTime() === end.getTime()) {
            // Check if this date matches the frequency rule
            if (shouldScheduleOnDate(medication.frequencyRule, currentDate, new Date(medication.createdAt))) {
                // Create an event for each time of day
                for (const time of medication.timeOfDay) {
                    const scheduledTime = combineDateTime(currentDate, time);

                    // Only create future events
                    if (isAfter(new Date(scheduledTime), new Date())) {
                        events.push({
                            profileId: medication.profileId,
                            eventType: 'medication_due' as CalendarEventType,
                            sourceId: medication.id,
                            title: medication.hideName ? 'Medication' : medication.name,
                            scheduledTime,
                            status: 'pending',
                            metadata: {
                                dosage: medication.dosage,
                                form: medication.form,
                            },
                        });
                    }
                }
            }
            currentDate = addDays(currentDate, 1);
        }

        // Batch insert events
        if (events.length > 0) {
            const createdEvents = await calendarEventRepository.createBatch(events);
            // Schedule notifications for these new events
            await notificationService.scheduleUpcomingNotifications(createdEvents);
            console.log(`[CalendarService] Generated and scheduled ${createdEvents.length} events for medication ${medication.id}`);
        }
    },

    /**
     * Generate calendar events for a supplement for a date range
     */
    async generateSupplementEvents(
        supplement: Supplement,
        startDate: Date,
        endDate: Date
    ): Promise<void> {
        if (!supplement.isActive || supplement.timeOfDay.length === 0) {
            return;
        }

        await calendarEventRepository.deleteBySource(supplement.id);

        const events: CreateCalendarEventInput[] = [];
        let currentDate = startOfDay(startDate);
        const end = endOfDay(endDate);

        while (isBefore(currentDate, end) || currentDate.getTime() === end.getTime()) {
            if (shouldScheduleOnDate(supplement.frequencyRule, currentDate, new Date(supplement.createdAt))) {
                for (const time of supplement.timeOfDay) {
                    const scheduledTime = combineDateTime(currentDate, time);

                    if (isAfter(new Date(scheduledTime), new Date())) {
                        events.push({
                            profileId: supplement.profileId,
                            eventType: 'supplement_due' as CalendarEventType,
                            sourceId: supplement.id,
                            title: supplement.name,
                            scheduledTime,
                            status: 'pending',
                            metadata: {
                                dosage: supplement.dosage,
                                form: supplement.form,
                            },
                        });
                    }
                }
            }
            currentDate = addDays(currentDate, 1);
        }

        if (events.length > 0) {
            const createdEvents = await calendarEventRepository.createBatch(events);
            // Schedule notifications for these new events
            await notificationService.scheduleUpcomingNotifications(createdEvents);
            console.log(`[CalendarService] Generated and scheduled ${createdEvents.length} events for supplement ${supplement.id}`);
        }
    },

    /**
     * Generate a calendar event for an appointment (one-time event)
     */
    async generateAppointmentEvent(appointment: Appointment): Promise<void> {
        // Delete any existing event for this appointment
        await calendarEventRepository.deleteBySource(appointment.id);

        // Only create if appointment is in the future
        if (isAfter(new Date(appointment.scheduledTime), new Date())) {
            const event = await calendarEventRepository.create({
                profileId: appointment.profileId,
                eventType: 'appointment' as CalendarEventType,
                sourceId: appointment.id,
                title: appointment.title,
                scheduledTime: appointment.scheduledTime,
                endTime: new Date(
                    new Date(appointment.scheduledTime).getTime() + appointment.duration * 60 * 1000
                ).toISOString(),
                status: 'pending',
                metadata: {
                    doctorName: appointment.doctorName,
                    specialty: appointment.specialty,
                    location: appointment.location,
                    reason: appointment.reason,
                },
            });

            // Schedule notification
            await notificationService.scheduleEventNotification(event);
            console.log(`[CalendarService] Scheduled notification for appointment ${event.id}`);
        }
    },

    /**
     * Generate a calendar event for an activity (completed event)
     */
    async generateActivityEvent(activity: Activity): Promise<void> {
        // Delete any existing event for this activity
        await calendarEventRepository.deleteBySource(activity.id);

        await calendarEventRepository.create({
            profileId: activity.profileId,
            eventType: 'activity' as CalendarEventType,
            sourceId: activity.id,
            title: typeof activity.type === 'string'
                ? activity.type.charAt(0).toUpperCase() + activity.type.slice(1)
                : 'Activity',
            scheduledTime: activity.startTime,
            endTime: activity.endTime,
            status: 'completed',
            completedTime: activity.startTime,
            metadata: {
                value: activity.value,
                unit: activity.unit,
                notes: activity.notes,
            },
        });
    },

    /**
     * Regenerate all events for a profile for the next N days
     * Call this daily or when medications/supplements change
     */
    async regenerateEventsForProfile(
        profileId: string,
        daysAhead = 30
    ): Promise<{ medicationEvents: number; supplementEvents: number; appointmentEvents: number }> {
        const { medicationRepository, supplementRepository, appointmentRepository } = await import('../repositories');

        const startDate = new Date();
        const endDate = addDays(startDate, daysAhead);

        // Get all active medications
        const medications = await medicationRepository.getAllByProfile(profileId, false);
        let medicationEvents = 0;

        for (const med of medications) {
            await this.generateMedicationEvents(med, startDate, endDate);
            medicationEvents += med.timeOfDay.length * daysAhead;
        }

        // Get all active supplements
        const supplements = await supplementRepository.getAllByProfile(profileId, false);
        let supplementEvents = 0;

        for (const supp of supplements) {
            await this.generateSupplementEvents(supp, startDate, endDate);
            supplementEvents += supp.timeOfDay.length * daysAhead;
        }

        // Get all upcoming appointments
        const appointments = await appointmentRepository.getUpcoming(profileId, 50);
        let appointmentEvents = 0;

        for (const apt of appointments) {
            await this.generateAppointmentEvent(apt);
            appointmentEvents++;
        }

        return { medicationEvents, supplementEvents, appointmentEvents };
    },

    /**
     * Get today's schedule for a profile
     */
    async getTodaySchedule(profileId: string) {
        const today = format(new Date(), 'yyyy-MM-dd');
        return calendarEventRepository.getByDay(profileId, today);
    },

    /**
     * Get schedule for a specific date
     */
    async getScheduleForDate(profileId: string, date: Date) {
        const dateStr = format(date, 'yyyy-MM-dd');
        return calendarEventRepository.getByDay(profileId, dateStr);
    },

    /**
     * Get upcoming events (for widget/notifications)
     */
    async getUpcomingEvents(profileId: string, hours = 4) {
        return calendarEventRepository.getUpcoming(profileId, hours);
    },

    /**
     * Mark overdue pending events as missed
     * Should be called periodically (e.g., every hour)
     */
    async markOverdueAsMissed(profileId: string): Promise<number> {
        const overdueEvents = await calendarEventRepository.getOverdue(profileId);

        for (const event of overdueEvents) {
            await calendarEventRepository.markMissed(event.id);
        }

        return overdueEvents.length;
    },
};

/**
 * Helper: Determine if a medication/supplement should be scheduled on a given date
 * based on its frequency rule
 */
function shouldScheduleOnDate(
    frequencyRule: { frequency: string; interval?: number; daysOfWeek?: number[]; endDate?: string } | undefined,
    date: Date,
    startDate: Date
): boolean {
    if (!frequencyRule) {
        // Default to daily if no rule specified
        return true;
    }

    const { frequency, interval = 1, daysOfWeek, endDate } = frequencyRule;

    // Check if past end date
    if (endDate && isAfter(date, new Date(endDate))) {
        return false;
    }

    switch (frequency) {
        case 'daily':
            // Every N days from start date
            const daysDiff = Math.floor((date.getTime() - startOfDay(startDate).getTime()) / (24 * 60 * 60 * 1000));
            return daysDiff >= 0 && daysDiff % interval === 0;

        case 'weekly':
            // Specific days of the week
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            if (daysOfWeek && daysOfWeek.length > 0) {
                return daysOfWeek.includes(dayOfWeek);
            }
            // Default: same day of week as start date
            return dayOfWeek === startDate.getDay();

        case 'monthly':
            // Same day of month as start date
            return date.getDate() === startDate.getDate();

        case 'custom':
            // Custom interval in days
            const customDiff = Math.floor((date.getTime() - startOfDay(startDate).getTime()) / (24 * 60 * 60 * 1000));
            return customDiff >= 0 && customDiff % interval === 0;

        default:
            return true;
    }
}
