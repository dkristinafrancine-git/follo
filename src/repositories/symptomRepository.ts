import { getDatabase } from '../database';
import { randomUUID } from 'expo-crypto';

export interface Symptom {
    id: string;
    profile_id: string;
    name: string;
    severity: number; // 1-10
    frequency?: string;
    notes?: string;
    occurred_at: string; // ISO string
    created_at: string;
    updated_at: string;
}

export type CreateSymptomDTO = Omit<Symptom, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSymptomDTO = Partial<Omit<Symptom, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;

export const symptomRepository = {
    async addSymptom(symptom: CreateSymptomDTO): Promise<Symptom> {
        const db = await getDatabase();
        const id = randomUUID();
        const now = new Date().toISOString();

        await db.runAsync(
            `INSERT INTO symptoms (
        id, profile_id, name, severity, frequency, notes, occurred_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                symptom.profile_id,
                symptom.name,
                symptom.severity,
                symptom.frequency || null,
                symptom.notes || null,
                symptom.occurred_at,
                now,
                now
            ]
        );

        return {
            ...symptom,
            id,
            created_at: now,
            updated_at: now
        };
    },

    async getSymptoms(
        profileId: string,
        startDate?: string,
        endDate?: string
    ): Promise<Symptom[]> {
        const db = await getDatabase();

        let query = 'SELECT * FROM symptoms WHERE profile_id = ?';
        const params: any[] = [profileId];

        if (startDate) {
            query += ' AND occurred_at >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND occurred_at <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY occurred_at DESC';

        const results = await db.getAllAsync<Symptom>(query, params);
        return results;
    },

    async getRecentSymptoms(profileId: string, limit: number = 20): Promise<Symptom[]> {
        const db = await getDatabase();

        // Get distinct symptom names used recently to help with autocomplete/suggestions
        // But for this method, let's just return the actual recent entries
        return await db.getAllAsync<Symptom>(
            `SELECT * FROM symptoms WHERE profile_id = ? ORDER BY occurred_at DESC LIMIT ?`,
            [profileId, limit]
        );
    },

    async getDistinctSymptomNames(profileId: string): Promise<string[]> {
        const db = await getDatabase();
        const results = await db.getAllAsync<{ name: string }>(
            `SELECT DISTINCT name FROM symptoms WHERE profile_id = ? ORDER BY name ASC`,
            [profileId]
        );
        return results.map(r => r.name);
    },

    async updateSymptom(id: string, updates: UpdateSymptomDTO): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();

        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(', ');

        const values = [...Object.values(updates), now, id];

        if (setClause.length === 0) return;

        await db.runAsync(
            `UPDATE symptoms SET ${setClause}, updated_at = ? WHERE id = ?`,
            values
        );
    },

    async deleteSymptom(id: string): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM symptoms WHERE id = ?', [id]);
    }
};
