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
       AND scheduled_time < ?`,
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
       AND scheduled_time < ?`,
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
     * Get streak (consecutive days with all doses taken)
     */
    async getStreak(profileId: string): Promise<number> {
        const db = await getDatabase();

        // Get all history ordered by date
        const result = await db.getAllAsync<{ day: string; total: number; taken: number }>(
            `SELECT 
        date(scheduled_time) as day,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken
       FROM medication_history 
       WHERE profile_id = ?
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
};
