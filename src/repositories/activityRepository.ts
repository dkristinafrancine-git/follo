import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import { Activity, CreateActivityInput, ActivityType } from '../types';

// Convert database row to Activity entity
function rowToActivity(row: Record<string, unknown>): Activity {
    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        type: row.type as ActivityType | string,
        value: row.value as number | undefined,
        unit: row.unit as string | undefined,
        startTime: row.start_time as string,
        endTime: row.end_time as string | undefined,
        notes: row.notes as string | undefined,
        createdAt: row.created_at as string,
    };
}

export const activityRepository = {
    /**
     * Get activities for a profile within a date range
     */
    async getByDateRange(
        profileId: string,
        startDate: string,
        endDate: string
    ): Promise<Activity[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM activities 
       WHERE profile_id = ? 
       AND start_time >= ? 
       AND start_time < ?
       ORDER BY start_time DESC`,
            [profileId, startDate, endDate]
        );
        return result.map(rowToActivity);
    },

    /**
     * Get activities for a specific day
     */
    async getByDay(profileId: string, date: string): Promise<Activity[]> {
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.999Z`;
        return this.getByDateRange(profileId, startDate, endDate);
    },

    /**
     * Get activities by type
     */
    async getByType(
        profileId: string,
        type: ActivityType | string,
        limit = 50
    ): Promise<Activity[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM activities 
       WHERE profile_id = ? AND type = ?
       ORDER BY start_time DESC
       LIMIT ?`,
            [profileId, type, limit]
        );
        return result.map(rowToActivity);
    },

    /**
     * Get a single activity by ID
     */
    async getById(id: string): Promise<Activity | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM activities WHERE id = ?',
            [id]
        );
        return result ? rowToActivity(result) : null;
    },

    /**
     * Create a new activity
     */
    async create(input: CreateActivityInput): Promise<Activity> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO activities (
        id, profile_id, type, value, unit, start_time, end_time, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.type,
                input.value ?? null,
                input.unit ?? null,
                input.startTime,
                input.endTime ?? null,
                input.notes ?? null,
                now,
            ]
        );

        // Update widget (quick stats activity count)
        widgetService.updateWidget(input.profileId).catch(console.error);

        return {
            id,
            ...input,
            createdAt: now,
        };
    },

    /**
     * Delete an activity
     */
    async delete(id: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
        return result.changes > 0;
    },

    /**
     * Update an activity
     */
    async update(id: string, input: Partial<CreateActivityInput>): Promise<Activity | null> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return null;

        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (input.type !== undefined) {
            updates.push('type = ?');
            values.push(input.type);
        }
        if (input.value !== undefined) {
            updates.push('value = ?');
            values.push(input.value ?? null);
        }
        if (input.unit !== undefined) {
            updates.push('unit = ?');
            values.push(input.unit ?? null);
        }
        if (input.startTime !== undefined) {
            updates.push('start_time = ?');
            values.push(input.startTime);
        }
        if (input.endTime !== undefined) {
            updates.push('end_time = ?');
            values.push(input.endTime ?? null);
        }
        if (input.notes !== undefined) {
            updates.push('notes = ?');
            values.push(input.notes ?? null);
        }

        if (updates.length === 0) return existing;

        values.push(id);

        await db.runAsync(
            `UPDATE activities SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return this.getById(id);
    },

    /**
     * Get weekly summary for a type
     */
    async getWeeklySummary(
        profileId: string,
        type: ActivityType | string,
        weekStartDate: string
    ): Promise<{ total: number; count: number; average: number }> {
        const db = await getDatabase();
        const endDate = new Date(new Date(weekStartDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const result = await db.getFirstAsync<{ total: number; count: number }>(
            `SELECT 
        COALESCE(SUM(value), 0) as total,
        COUNT(*) as count
       FROM activities 
       WHERE profile_id = ? 
       AND type = ?
       AND start_time >= ? 
       AND start_time < ?`,
            [profileId, type, weekStartDate, endDate]
        );

        const total = result?.total ?? 0;
        const count = result?.count ?? 0;
        const average = count > 0 ? total / count : 0;

        return { total, count, average };
    },

    /**
     * Get recent activities for timeline
     */
    async getRecent(profileId: string, limit = 20): Promise<Activity[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM activities 
       WHERE profile_id = ?
       ORDER BY start_time DESC
       LIMIT ?`,
            [profileId, limit]
        );
        return result.map(rowToActivity);
    },

    /**
     * Get activity count for a week
     */
    async getWeeklyCount(profileId: string, weekStartDate: string): Promise<number> {
        const db = await getDatabase();
        const endDate = new Date(new Date(weekStartDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM activities 
       WHERE profile_id = ? 
       AND start_time >= ? 
       AND start_time < ?`,
            [profileId, weekStartDate, endDate]
        );

        return result?.count ?? 0;
    },

    /**
     * Get activity heatmap data (daily counts)
     */
    async getActivityHeatmapData(
        profileId: string,
        startDate: string,
        endDate: string
    ): Promise<{ date: string; count: number }[]> {
        const db = await getDatabase();

        // Group by YYYY-MM-DD
        // SQLite uses strftime('%Y-%m-%d', ...) 
        // Note: start_time is ISO string, so it should work if we just take the date part
        const result = await db.getAllAsync<{ date: string; count: number }>(
            `SELECT 
                strftime('%Y-%m-%d', start_time) as date,
                COUNT(*) as count
             FROM activities
             WHERE profile_id = ? 
             AND start_time >= ? 
             AND start_time <= ?
             GROUP BY date
             ORDER BY date ASC`,
            [profileId, startDate, endDate]
        );

        return result;
    },
};
