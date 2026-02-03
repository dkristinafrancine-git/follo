import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import {
    Supplement,
    CreateSupplementInput,
    UpdateSupplementInput,
    RecurrenceRule
} from '../types';

// Convert database row to Supplement entity
function rowToSupplement(row: Record<string, unknown>): Supplement {
    let frequencyRule: RecurrenceRule | undefined;
    if (row.frequency_rule) {
        try {
            frequencyRule = JSON.parse(row.frequency_rule as string);
        } catch {
            frequencyRule = undefined;
        }
    }

    let timeOfDay: string[] = [];
    if (row.time_of_day) {
        try {
            timeOfDay = JSON.parse(row.time_of_day as string);
        } catch {
            timeOfDay = [];
        }
    }

    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        name: row.name as string,
        dosage: row.dosage as string | undefined,
        form: row.form as string | undefined,
        frequencyRule,
        timeOfDay,
        currentQuantity: row.current_quantity as number | undefined,
        lowStockThreshold: (row.low_stock_threshold as number) ?? 10,
        photoUri: row.photo_uri as string | undefined,
        notes: row.notes as string | undefined,
        isActive: (row.is_active as number) === 1,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

export const supplementRepository = {
    /**
     * Get all supplements for a profile
     */
    async getAllByProfile(profileId: string, includeInactive = false): Promise<Supplement[]> {
        const db = await getDatabase();
        const query = includeInactive
            ? 'SELECT * FROM supplements WHERE profile_id = ? ORDER BY name ASC'
            : 'SELECT * FROM supplements WHERE profile_id = ? AND is_active = 1 ORDER BY name ASC';

        const result = await db.getAllAsync<Record<string, unknown>>(query, [profileId]);
        return result.map(rowToSupplement);
    },

    /**
     * Get a single supplement by ID
     */
    async getById(id: string): Promise<Supplement | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM supplements WHERE id = ?',
            [id]
        );
        return result ? rowToSupplement(result) : null;
    },

    /**
     * Create a new supplement
     */
    async create(input: CreateSupplementInput): Promise<Supplement> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO supplements (
        id, profile_id, name, dosage, form, frequency_rule, time_of_day,
        current_quantity, low_stock_threshold, photo_uri, notes, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.name,
                input.dosage ?? null,
                input.form ?? null,
                input.frequencyRule ? JSON.stringify(input.frequencyRule) : null,
                JSON.stringify(input.timeOfDay),
                input.currentQuantity ?? null,
                input.lowStockThreshold,
                input.photoUri ?? null,
                input.notes ?? null,
                input.isActive ? 1 : 0,
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
     * Update an existing supplement
     */
    async update(id: string, input: UpdateSupplementInput): Promise<Supplement | null> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return null;

        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (input.name !== undefined) {
            updates.push('name = ?');
            values.push(input.name);
        }
        if (input.dosage !== undefined) {
            updates.push('dosage = ?');
            values.push(input.dosage ?? null);
        }
        if (input.form !== undefined) {
            updates.push('form = ?');
            values.push(input.form ?? null);
        }
        if (input.frequencyRule !== undefined) {
            updates.push('frequency_rule = ?');
            values.push(input.frequencyRule ? JSON.stringify(input.frequencyRule) : null);
        }
        if (input.timeOfDay !== undefined) {
            updates.push('time_of_day = ?');
            values.push(JSON.stringify(input.timeOfDay));
        }
        if (input.currentQuantity !== undefined) {
            updates.push('current_quantity = ?');
            values.push(input.currentQuantity ?? null);
        }
        if (input.lowStockThreshold !== undefined) {
            updates.push('low_stock_threshold = ?');
            values.push(input.lowStockThreshold);
        }
        if (input.photoUri !== undefined) {
            updates.push('photo_uri = ?');
            values.push(input.photoUri ?? null);
        }
        if (input.notes !== undefined) {
            updates.push('notes = ?');
            values.push(input.notes ?? null);
        }
        if (input.isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(input.isActive ? 1 : 0);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE supplements SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return this.getById(id);
    },

    /**
     * Delete a supplement
     */
    async delete(id: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync('DELETE FROM supplements WHERE id = ?', [id]);
        return result.changes > 0;
    },

    /**
     * Get supplements needing restock
     */
    async getNeedingRestock(profileId: string): Promise<Supplement[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM supplements 
       WHERE profile_id = ? 
       AND is_active = 1 
       AND current_quantity IS NOT NULL 
       AND current_quantity <= low_stock_threshold
       ORDER BY current_quantity ASC`,
            [profileId]
        );
        return result.map(rowToSupplement);
    },

    /**
     * Update quantity
     */
    async updateQuantity(id: string, quantity: number): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync(
            'UPDATE supplements SET current_quantity = ?, updated_at = ? WHERE id = ?',
            [quantity, new Date().toISOString(), id]
        );
        return result.changes > 0;
    },

    /**
     * Decrement quantity by 1
     */
    async decrementQuantity(id: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync(
            `UPDATE supplements 
       SET current_quantity = CASE 
         WHEN current_quantity IS NOT NULL AND current_quantity > 0 
         THEN current_quantity - 1 
         ELSE current_quantity 
       END,
       updated_at = ? 
       WHERE id = ?`,
            [new Date().toISOString(), id]
        );
        return result.changes > 0;
    },
};
