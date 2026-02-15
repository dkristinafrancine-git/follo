/**
 * Reminder Service
 * Manages generic reminders for supplements, activities, gratitudes, and symptoms.
 * Generates calendar events for reminders.
 */

import { getDatabase } from '../database';
import { randomUUID } from 'expo-crypto';
import {
    Reminder,
    CreateReminderInput,
    UpdateReminderInput,
    CalendarEvent,
    RecurrenceRule,
    ReminderType
} from '../types';
import { calendarEventRepository } from '../repositories';

export const reminderService = {
    /**
     * Create a new reminder
     */
    async create(input: CreateReminderInput): Promise<Reminder> {
        const db = await getDatabase();
        const id = randomUUID();
        const now = new Date().toISOString();

        const reminder: Reminder = {
            id,
            ...input,
            isActive: true, // Default to active
            createdAt: now,
            updatedAt: now,
        };

        await db.runAsync(
            `INSERT INTO reminders (
                id, profile_id, type, frequency_rule, time_of_day, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reminder.id,
                reminder.profileId,
                reminder.type,
                JSON.stringify(reminder.frequencyRule),
                JSON.stringify(reminder.timeOfDay),
                reminder.isActive ? 1 : 0,
                reminder.createdAt,
                reminder.updatedAt
            ]
        );

        // Generate initial events
        await this.processRemindersForProfile(reminder.profileId);

        return reminder;
    },

    /**
     * Get all reminders for a profile
     */
    async getByProfileId(profileId: string): Promise<Reminder[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM reminders WHERE profile_id = ? ORDER BY created_at DESC',
            [profileId]
        );

        return result.map(this.mapRowToReminder);
    },

    /**
     * Get a single reminder by ID
     */
    async getById(id: string): Promise<Reminder | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<any>(
            'SELECT * FROM reminders WHERE id = ?',
            [id]
        );

        return result ? this.mapRowToReminder(result) : null;
    },

    /**
     * Update a reminder
     */
    async update(id: string, input: UpdateReminderInput): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: any[] = [];

        if (input.type !== undefined) {
            updates.push('type = ?');
            values.push(input.type);
        }
        if (input.frequencyRule !== undefined) {
            updates.push('frequency_rule = ?');
            values.push(JSON.stringify(input.frequencyRule));
        }
        if (input.timeOfDay !== undefined) {
            updates.push('time_of_day = ?');
            values.push(JSON.stringify(input.timeOfDay));
        }
        if (input.isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(input.isActive ? 1 : 0);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Refresh events if scheduling changed
        if (input.frequencyRule || input.timeOfDay || input.isActive !== undefined) {
            // Retrieve full profile ID to process
            const reminder = await this.getById(id);
            if (reminder) {
                // Remove future pending events for this reminder to regenerate
                await calendarEventRepository.deleteFuturePendingEvents(id, now);
                await this.processRemindersForProfile(reminder.profileId);
            }
        }
    },

    /**
     * Delete a reminder
     */
    async delete(id: string): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();

        // Delete future events first
        await calendarEventRepository.deleteFuturePendingEvents(id, now);

        await db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
    },

    /**
     * Process and generate calendar events for reminders
     * This follows standard pattern: generate for next 7 days
     */
    async processRemindersForProfile(profileId: string): Promise<void> {
        const reminders = await this.getByProfileId(profileId);
        const activeReminders = reminders.filter(r => r.isActive);

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7); // Schedule 7 days out

        for (const reminder of activeReminders) {
            await this.generateEventsForReminder(reminder, startDate, endDate);
        }
    },

    /**
     * Generate events for a specific reminder in range
     */
    async generateEventsForReminder(reminder: Reminder, start: Date, end: Date): Promise<void> {
        // Basic implementation for Daily/Weekly
        // This mirrors logic in MedicationService but simplified for reminders

        const eventsToCreate: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[] = [];

        let currentDate = new Date(start);
        currentDate.setHours(0, 0, 0, 0);

        const endDateTime = new Date(end);
        endDateTime.setHours(23, 59, 59, 999);

        while (currentDate <= endDateTime) {
            // Check if reminder applies to this date
            if (this.isReminderDueOnDate(reminder.frequencyRule, currentDate)) {
                // Create Event for each time of day
                for (const timeStr of reminder.timeOfDay) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const scheduledTime = new Date(currentDate);
                    scheduledTime.setHours(hours, minutes, 0, 0);

                    // Skip past times if generating for today, BUT typically we generate future
                    // pending events. If we run this daily, we might generate for 'today' if missed.
                    // For now, simple check: don't duplicate. We rely on repository to handle dupes if needed,
                    // or we check existence.
                    // Standard pattern in this app seems to be: check if exists, if not create.

                    // Simple check to avoid creating events in the immediate past if running 'now'
                    // but usually we want to see missed events.

                    const existing = await calendarEventRepository.findExisting(
                        reminder.profileId,
                        reminder.id,
                        'reminder',
                        scheduledTime.toISOString()
                    );

                    if (!existing) {
                        eventsToCreate.push({
                            profileId: reminder.profileId,
                            eventType: 'reminder',
                            sourceId: reminder.id,
                            title: this.getReminderTitle(reminder.type),
                            scheduledTime: scheduledTime.toISOString(),
                            status: 'pending',
                            metadata: {
                                type: reminder.type // Store specific type for deep linking
                            }
                        });
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Batch create
        for (const event of eventsToCreate) {
            await calendarEventRepository.create(event);
        }
    },

    isReminderDueOnDate(rule: RecurrenceRule, date: Date): boolean {
        const dayOfWeek = date.getDay(); // 0 = Sunday

        if (rule.frequency === 'daily') {
            if (!rule.interval || rule.interval === 1) return true;
            // logic for interval > 1 would require a start date reference,
            // assuming daily/simple for now or valid every N days logic if needed
            return true;
        }

        if (rule.frequency === 'weekly') {
            if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
                return rule.daysOfWeek.includes(dayOfWeek);
            }
            return true; // Default to every week?? Usually implies specific day.
        }

        return false;
    },

    getReminderTitle(type: ReminderType): string {
        switch (type) {
            case 'supplement': return 'Supplement Check-in';
            case 'activity': return 'Activity Check-in';
            case 'gratitude': return 'Gratitude Journal';
            case 'symptom': return 'Symptom Check-in';
            default: return 'Reminder';
        }
    },

    mapRowToReminder(row: any): Reminder {
        return {
            id: row.id,
            profileId: row.profile_id,
            type: row.type as ReminderType,
            frequencyRule: JSON.parse(row.frequency_rule),
            timeOfDay: JSON.parse(row.time_of_day),
            isActive: !!row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
};
