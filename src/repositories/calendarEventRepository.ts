import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import {
    CalendarEvent,
    CreateCalendarEventInput,
    UpdateCalendarEventInput,
    CalendarEventType,
    CalendarEventStatus
} from '../types';

// Convert database row to CalendarEvent entity
function rowToCalendarEvent(row: Record<string, unknown>): CalendarEvent {
    let metadata: Record<string, unknown> | undefined;
    if (row.metadata) {
        try {
            metadata = JSON.parse(row.metadata as string);
        } catch {
            metadata = undefined;
        }
    }

    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        eventType: row.event_type as CalendarEventType,
        sourceId: row.source_id as string,
        title: row.title as string,
        scheduledTime: row.scheduled_time as string,
        endTime: row.end_time as string | undefined,
        status: row.status as CalendarEventStatus,
        completedTime: row.completed_time as string | undefined,
        metadata,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

export const calendarEventRepository = {
    /**
     * Get events for a specific day (MAIN TIMELINE QUERY)
     */
    async getByDay(profileId: string, date: string): Promise<CalendarEvent[]> {
        const db = await getDatabase();
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.999Z`;

        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM calendar_events 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time <= ?
       ORDER BY scheduled_time ASC`,
            [profileId, startDate, endDate]
        );
        return result.map(rowToCalendarEvent);
    },

    /**
     * Get pending events for today (for widget/notifications)
     */
    async getPendingToday(profileId: string): Promise<CalendarEvent[]> {
        const db = await getDatabase();
        const today = new Date().toISOString().split('T')[0];
        const startDate = `${today}T00:00:00.000Z`;
        const endDate = `${today}T23:59:59.999Z`;

        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM calendar_events 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time <= ?
       AND status = 'pending'
       ORDER BY scheduled_time ASC`,
            [profileId, startDate, endDate]
        );
        return result.map(rowToCalendarEvent);
    },

    /**
     * Get upcoming events (next N hours)
     */
    async getUpcoming(profileId: string, hours = 24): Promise<CalendarEvent[]> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const futureTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM calendar_events 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time <= ?
       AND status = 'pending'
       ORDER BY scheduled_time ASC`,
            [profileId, now, futureTime]
        );
        return result.map(rowToCalendarEvent);
    },

    /**
     * Get events by source (linked entity)
     */
    async getBySource(sourceId: string): Promise<CalendarEvent[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM calendar_events 
       WHERE source_id = ?
       ORDER BY scheduled_time DESC`,
            [sourceId]
        );
        return result.map(rowToCalendarEvent);
    },

    /**
     * Get a single event by ID
     */
    async getById(id: string): Promise<CalendarEvent | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM calendar_events WHERE id = ?',
            [id]
        );
        return result ? rowToCalendarEvent(result) : null;
    },

    /**
     * Create a new calendar event
     */
    async create(input: CreateCalendarEventInput): Promise<CalendarEvent> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO calendar_events (
        id, profile_id, event_type, source_id, title, scheduled_time, end_time,
        status, completed_time, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.eventType,
                input.sourceId,
                input.title,
                input.scheduledTime,
                input.endTime ?? null,
                input.status,
                input.completedTime ?? null,
                input.metadata ? JSON.stringify(input.metadata) : null,
                now,
                now,
            ]
        );

        return {
            id,
            ...input,
            createdAt: now,
            updatedAt: now,
        };
    },

    /**
     * Update event status (most common operation)
     */
    async updateStatus(
        id: string,
        status: CalendarEventStatus,
        completedTime?: string
    ): Promise<boolean> {
        const db = await getDatabase();
        const now = new Date().toISOString();

        const result = await db.runAsync(
            `UPDATE calendar_events 
       SET status = ?, completed_time = ?, updated_at = ? 
       WHERE id = ?`,
            [status, completedTime ?? null, now, id]
        );
        return result.changes > 0;
    },

    /**
     * Mark event as completed
     */
    async markCompleted(id: string): Promise<boolean> {
        return this.updateStatus(id, 'completed', new Date().toISOString());
    },

    /**
     * Mark event as missed
     */
    async markMissed(id: string): Promise<boolean> {
        return this.updateStatus(id, 'missed');
    },

    /**
     * Mark event as skipped
     */
    async markSkipped(id: string): Promise<boolean> {
        return this.updateStatus(id, 'skipped');
    },

    /**
     * Update an existing event
     */
    async update(id: string, input: UpdateCalendarEventInput): Promise<CalendarEvent | null> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return null;

        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | null)[] = [];

        if (input.title !== undefined) {
            updates.push('title = ?');
            values.push(input.title);
        }
        if (input.scheduledTime !== undefined) {
            updates.push('scheduled_time = ?');
            values.push(input.scheduledTime);
        }
        if (input.endTime !== undefined) {
            updates.push('end_time = ?');
            values.push(input.endTime ?? null);
        }
        if (input.status !== undefined) {
            updates.push('status = ?');
            values.push(input.status);
        }
        if (input.completedTime !== undefined) {
            updates.push('completed_time = ?');
            values.push(input.completedTime ?? null);
        }
        if (input.metadata !== undefined) {
            updates.push('metadata = ?');
            values.push(input.metadata ? JSON.stringify(input.metadata) : null);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return this.getById(id);
    },

    /**
     * Delete an event
     */
    async delete(id: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync('DELETE FROM calendar_events WHERE id = ?', [id]);
        return result.changes > 0;
    },

    /**
     * Delete all events for a source (when source entity is deleted)
     */
    async deleteBySource(sourceId: string): Promise<number> {
        const db = await getDatabase();
        const result = await db.runAsync('DELETE FROM calendar_events WHERE source_id = ?', [sourceId]);
        return result.changes;
    },

    /**
     * Get overdue pending events
     */
    async getOverdue(profileId: string): Promise<CalendarEvent[]> {
        const db = await getDatabase();
        const now = new Date().toISOString();

        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM calendar_events 
       WHERE profile_id = ? 
       AND scheduled_time < ?
       AND status = 'pending'
       ORDER BY scheduled_time ASC`,
            [profileId, now]
        );
        return result.map(rowToCalendarEvent);
    },

    /**
     * Batch create events (for generating recurring events)
     */
    async createBatch(inputs: CreateCalendarEventInput[]): Promise<CalendarEvent[]> {
        const events: CalendarEvent[] = [];
        for (const input of inputs) {
            const event = await this.create(input);
            events.push(event);
        }
        return events;
    },

    /**
     * Get event stats for a date range
     */
    async getStats(
        profileId: string,
        startDate: string,
        endDate: string
    ): Promise<{ total: number; completed: number; missed: number; skipped: number; pending: number }> {
        const db = await getDatabase();

        const result = await db.getFirstAsync<{
            total: number;
            completed: number;
            missed: number;
            skipped: number;
            pending: number;
        }>(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM calendar_events 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?`,
            [profileId, startDate, endDate]
        );

        return {
            total: result?.total ?? 0,
            completed: result?.completed ?? 0,
            missed: result?.missed ?? 0,
            skipped: result?.skipped ?? 0,
            pending: result?.pending ?? 0,
        };
    },
};
