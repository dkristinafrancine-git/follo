import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import { Gratitude, CreateGratitudeInput, UpdateGratitudeInput } from '../types';

// Convert database row to Gratitude entity
function rowToGratitude(row: Record<string, unknown>): Gratitude {
    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        content: row.content as string,
        positivityLevel: row.positivity_level as number,
        imageUri: row.image_uri as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

export const gratitudeRepository = {
    /**
     * Get all gratitudes for a profile, ordered by creation date (newest first)
     */
    async getByProfile(profileId: string, limit = 50): Promise<Gratitude[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            'SELECT * FROM gratitudes WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?',
            [profileId, limit]
        );
        return result.map(rowToGratitude);
    },

    /**
     * Get gratitudes within a date range (for charts)
     */
    async getByDateRange(
        profileId: string,
        startDate: string,
        endDate: string
    ): Promise<Gratitude[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM gratitudes 
             WHERE profile_id = ? 
             AND created_at >= ? 
             AND created_at <= ?
             ORDER BY created_at ASC`,
            [profileId, startDate, endDate]
        );
        return result.map(rowToGratitude);
    },

    /**
     * Get a single gratitude by ID
     */
    async getById(id: string): Promise<Gratitude | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM gratitudes WHERE id = ?',
            [id]
        );
        return result ? rowToGratitude(result) : null;
    },

    /**
     * Create a new gratitude entry
     */
    async create(input: CreateGratitudeInput): Promise<Gratitude> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO gratitudes (
                id, profile_id, content, positivity_level, image_uri, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.content,
                input.positivityLevel,
                input.imageUri ?? null,
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
     * Update an existing gratitude entry
     */
    async update(id: string, input: UpdateGratitudeInput): Promise<Gratitude | null> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return null;

        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (input.content !== undefined) {
            updates.push('content = ?');
            values.push(input.content);
        }
        if (input.positivityLevel !== undefined) {
            updates.push('positivity_level = ?');
            values.push(input.positivityLevel);
        }
        if (input.imageUri !== undefined) {
            updates.push('image_uri = ?');
            values.push(input.imageUri ?? null);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        if (updates.length > 1) { // 1 because updated_at is always there
            await db.runAsync(
                `UPDATE gratitudes SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        return this.getById(id);
    },

    /**
     * Delete a gratitude entry
     */
    async delete(id: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync('DELETE FROM gratitudes WHERE id = ?', [id]);
        return result.changes > 0;
    }
};
