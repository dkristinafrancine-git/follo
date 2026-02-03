import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import {
    SupplementHistory,
    CreateSupplementHistoryInput,
    MedicationStatus
} from '../types';

// Convert database row to SupplementHistory entity
function rowToSupplementHistory(row: Record<string, unknown>): SupplementHistory {
    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        supplementId: row.supplement_id as string,
        scheduledTime: row.scheduled_time as string,
        actualTime: row.actual_time as string | undefined,
        status: row.status as MedicationStatus,
        notes: row.notes as string | undefined,
        createdAt: row.created_at as string,
    };
}

export const supplementHistoryRepository = {
    /**
     * Get history for a specific supplement
     */
    async getBySupplement(
        supplementId: string,
        limit = 50,
        offset = 0
    ): Promise<SupplementHistory[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM supplement_history 
       WHERE supplement_id = ? 
       ORDER BY scheduled_time DESC
       LIMIT ? OFFSET ?`,
            [supplementId, limit, offset]
        );
        return result.map(rowToSupplementHistory);
    },

    /**
     * Get history for a profile within a date range
     */
    async getByProfileDateRange(
        profileId: string,
        startDate: string,
        endDate: string
    ): Promise<SupplementHistory[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM supplement_history 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?
       ORDER BY scheduled_time DESC`,
            [profileId, startDate, endDate]
        );
        return result.map(rowToSupplementHistory);
    },

    /**
     * Create a new history entry (immutable)
     */
    async create(input: CreateSupplementHistoryInput): Promise<SupplementHistory> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO supplement_history (
        id, profile_id, supplement_id, scheduled_time, actual_time, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.supplementId,
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
        supplementId: string,
        scheduledTime: string,
        notes?: string
    ): Promise<SupplementHistory> {
        return this.create({
            profileId,
            supplementId,
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
        supplementId: string,
        scheduledTime: string,
        notes?: string
    ): Promise<SupplementHistory> {
        return this.create({
            profileId,
            supplementId,
            scheduledTime,
            status: 'skipped',
            notes,
        });
    },

    /**
     * Calculate adherence percentage
     */
    async getAdherence(
        supplementId: string,
        startDate: string,
        endDate: string
    ): Promise<{ total: number; taken: number; percentage: number }> {
        const db = await getDatabase();

        const totalResult = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM supplement_history 
       WHERE supplement_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?`,
            [supplementId, startDate, endDate]
        );

        const takenResult = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM supplement_history 
       WHERE supplement_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time < ?
       AND status = 'taken'`,
            [supplementId, startDate, endDate]
        );

        const total = totalResult?.count ?? 0;
        const taken = takenResult?.count ?? 0;
        const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

        return { total, taken, percentage };
    },
};
