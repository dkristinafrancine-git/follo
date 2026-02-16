import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import {
    MedicationHistory,
    CreateMedicationHistoryInput,
    MedicationStatus
} from '../types';

// Convert database row to MedicationHistory entity
function rowToMedicationHistory(row: Record<string, unknown>): MedicationHistory {
    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        medicationId: row.medication_id as string,
        scheduledTime: row.scheduled_time as string,
        actualTime: row.actual_time as string | undefined,
        status: row.status as MedicationStatus,
        notes: row.notes as string | undefined,
        createdAt: row.created_at as string,
    };
}

export const medicationHistoryRepository = {
    /**
     * Get history for a specific medication
     */
    async getByMedication(
        medicationId: string,
        limit = 50,
        offset = 0
    ): Promise<MedicationHistory[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM medication_history 
       WHERE medication_id = ? 
       ORDER BY scheduled_time DESC
       LIMIT ? OFFSET ?`,
            [medicationId, limit, offset]
        );
        return result.map(rowToMedicationHistory);
    },

    /**
     * Get history for a profile within a date range
     */
    async getByProfileDateRange(
        profileId: string,
        startDate: string,
        endDate: string
    ): Promise<MedicationHistory[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM medication_history 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?
       ORDER BY scheduled_time DESC`,
            [profileId, startDate, endDate]
        );
        return result.map(rowToMedicationHistory);
    },

    /**
     * Get history for a specific day
     */
    async getByProfileDay(profileId: string, date: string): Promise<MedicationHistory[]> {
        // date format: "YYYY-MM-DD"
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.999Z`;
        return this.getByProfileDateRange(profileId, startDate, endDate);
    },

    /**
     * Create a new history entry (immutable - no updates)
     */
    async create(input: CreateMedicationHistoryInput): Promise<MedicationHistory> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO medication_history (
        id, profile_id, medication_id, scheduled_time, actual_time, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.medicationId,
                input.scheduledTime,
                input.actualTime ?? null,
                input.status,
                input.notes ?? null,
                now,
            ]
        );

        return {
            id,
            ...input,
            createdAt: now,
        };
    },

    /**
     * Record a dose as taken
     */
    async recordTaken(
        profileId: string,
        medicationId: string,
        scheduledTime: string,
        notes?: string
    ): Promise<MedicationHistory> {
        return this.create({
            profileId,
            medicationId,
            scheduledTime,
            actualTime: new Date().toISOString(),
            status: 'taken',
            notes,
        });
    },

    /**
     * Record a dose as skipped
     */
    async recordSkipped(
        profileId: string,
        medicationId: string,
        scheduledTime: string,
        notes?: string
    ): Promise<MedicationHistory> {
        return this.create({
            profileId,
            medicationId,
            scheduledTime,
            status: 'skipped',
            notes,
        });
    },

    /**
     * Record a dose status generic method
     */
    async recordStatus(
        profileId: string,
        medicationId: string,
        scheduledTime: string,
        status: MedicationStatus,
        notes?: string
    ): Promise<MedicationHistory> {
        return this.create({
            profileId,
            medicationId,
            scheduledTime,
            actualTime: status === 'taken' ? new Date().toISOString() : undefined,
            status,
            notes,
        });
    },

    /**
     * Record a dose as missed (system-generated)
     */
    async recordMissed(
        profileId: string,
        medicationId: string,
        scheduledTime: string
    ): Promise<MedicationHistory> {
        return this.create({
            profileId,
            medicationId,
            scheduledTime,
            status: 'missed',
        });
    },

    /**
     * Update or create a history entry (Upsert) to ensure adherence stats are accurate
     * and prevent duplicate entries for the same scheduled dose.
     */
    async upsertStatus(
        profileId: string,
        medicationId: string,
        scheduledTime: string,
        status: MedicationStatus,
        actualTime?: string,
        notes?: string
    ): Promise<void> {
        const db = await getDatabase();

        // Check if entry exists
        const existing = await db.getFirstAsync<{ id: string }>(
            `SELECT id FROM medication_history 
             WHERE medication_id = ? AND scheduled_time = ?`,
            [medicationId, scheduledTime]
        );

        if (existing) {
            // Update existing
            await db.runAsync(
                `UPDATE medication_history 
                 SET status = ?, actual_time = ?, notes = ? 
                 WHERE id = ?`,
                [status, actualTime ?? null, notes ?? null, existing.id]
            );
        } else {
            // Create new
            const id = randomUUID();
            const now = new Date().toISOString();
            await db.runAsync(
                `INSERT INTO medication_history (
                    id, profile_id, medication_id, scheduled_time, actual_time, status, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    profileId,
                    medicationId,
                    scheduledTime,
                    actualTime ?? null,
                    status,
                    notes ?? null,
                    now
                ]
            );
        }
    },

    /**
     * Calculate adherence percentage for a medication
     */
    async getAdherence(
        medicationId: string,
        startDate: string,
        endDate: string
    ): Promise<{ total: number; taken: number; percentage: number }> {
        const db = await getDatabase();

        const totalResult = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM medication_history 
       WHERE medication_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?
       AND status != 'postponed'`,
            [medicationId, startDate, endDate]
        );

        const takenResult = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM medication_history 
       WHERE medication_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?
       AND status = 'taken'`,
            [medicationId, startDate, endDate]
        );

        const total = totalResult?.count ?? 0;
        const taken = takenResult?.count ?? 0;
        const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

        return { total, taken, percentage };
    },

    /**
     * Calculate overall adherence for a profile
     */
    async getProfileAdherence(
        profileId: string,
        startDate: string,
        endDate: string
    ): Promise<{ total: number; taken: number; percentage: number }> {
        const db = await getDatabase();

        const totalResult = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM medication_history 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?
       AND status != 'postponed'`,
            [profileId, startDate, endDate]
        );

        const takenResult = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM medication_history 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?
       AND status = 'taken'`,
            [profileId, startDate, endDate]
        );

        const total = totalResult?.count ?? 0;
        const taken = takenResult?.count ?? 0;
        const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

        return { total, taken, percentage };
    },

    /**
     * Get streak (consecutive days with all doses taken).
     *
     * - Excludes today (incomplete day would prematurely break the streak).
     * - Excludes 'postponed' entries (rescheduled doses get a new 'taken' entry;
     *   keeping the old 'postponed' row would inflate `total` and break the count).
     * - scheduled_time uses "Floating Local Time" convention (stored as local),
     *   so bare date() extracts the correct local date without a modifier.
     */
    async getStreak(profileId: string): Promise<number> {
        const db = await getDatabase();

        const result = await db.getAllAsync<{ day: string; total: number; taken: number }>(
            `SELECT 
                date(scheduled_time) as day,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
             FROM medication_history 
             WHERE profile_id = ?
               AND status != 'postponed'
               AND date(scheduled_time) < date('now', 'localtime')
             GROUP BY date(scheduled_time)
             ORDER BY day DESC`,
            [profileId]
        );

        let streak = 0;
        for (const day of result) {
            if (day.total === day.taken && day.total > 0) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * Get today's dose progress (how many doses taken vs total scheduled).
     * Excludes 'postponed' entries (same rationale as getStreak).
     */
    async getTodayProgress(profileId: string): Promise<{ taken: number; total: number }> {
        const db = await getDatabase();

        const result = await db.getFirstAsync<{ total: number; taken: number }>(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
             FROM medication_history 
             WHERE profile_id = ?
               AND status != 'postponed'
               AND date(scheduled_time) = date('now', 'localtime')`,
            [profileId]
        );

        return {
            taken: result?.taken ?? 0,
            total: result?.total ?? 0,
        };
    },

    /**
     * Check if a specific scheduled dose has been recorded
     */
    async exists(medicationId: string, scheduledTime: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM medication_history 
       WHERE medication_id = ? AND scheduled_time = ?`,
            [medicationId, scheduledTime]
        );
        return (result?.count ?? 0) > 0;
    },

    /**
     * Get most missed medications with count
     */
    async getMostMissed(profileId: string, limit = 5): Promise<{ medicationId: string; count: number }[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<{ medication_id: string; count: number }>(
            `SELECT medication_id, COUNT(*) as count 
             FROM medication_history 
             WHERE profile_id = ? AND status = 'missed'
             GROUP BY medication_id 
             ORDER BY count DESC 
             LIMIT ?`,
            [profileId, limit]
        );
        return result.map(r => ({ medicationId: r.medication_id, count: r.count }));
    },

    /**
     * Get best adherence time (hour of day with most 'taken' status)
     */
    async getBestTime(profileId: string): Promise<{ hour: number; count: number } | null> {
        const db = await getDatabase();
        // SQLite: strftime('%H', scheduled_time) returns hour 00-23
        const result = await db.getFirstAsync<{ hour: string; count: number }>(
            `SELECT strftime('%H', scheduled_time) as hour, COUNT(*) as count 
             FROM medication_history 
             WHERE profile_id = ? AND status = 'taken'
             GROUP BY hour
             ORDER BY count DESC 
             LIMIT 1`,
            [profileId]
        );

        if (!result) return null;
        return { hour: parseInt(result.hour, 10), count: result.count };
    }
};
