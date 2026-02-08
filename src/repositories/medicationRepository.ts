import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import {
    Medication,
    CreateMedicationInput,
    UpdateMedicationInput,
    RecurrenceRule
} from '../types';
import { widgetService } from '../services/widgetService';

// Convert database row to Medication entity
function rowToMedication(row: Record<string, unknown>): Medication {
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
        refillThreshold: (row.refill_threshold as number) ?? 7,
        currentQuantity: row.current_quantity as number | undefined,
        photoUri: row.photo_uri as string | undefined,
        notes: row.notes as string | undefined,
        isActive: (row.is_active as number) === 1,
        hideName: (row.hide_name as number) === 1,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

export const medicationRepository = {
    /**
     * Get all medications for a profile
     */
    async getAllByProfile(profileId: string, includeInactive = false): Promise<Medication[]> {
        const db = await getDatabase();
        const query = includeInactive
            ? 'SELECT * FROM medications WHERE profile_id = ? ORDER BY name ASC'
            : 'SELECT * FROM medications WHERE profile_id = ? AND is_active = 1 ORDER BY name ASC';

        const result = await db.getAllAsync<Record<string, unknown>>(query, [profileId]);
        return result.map(rowToMedication);
    },

    /**
     * Get a single medication by ID
     */
    async getById(id: string): Promise<Medication | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM medications WHERE id = ?',
            [id]
        );
        return result ? rowToMedication(result) : null;
    },

    /**
     * Get medications due at a specific time (for notifications)
     */
    async getDueAt(profileId: string, timeSlot: string): Promise<Medication[]> {
        const db = await getDatabase();
        // timeSlot format: "HH:mm"
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM medications 
       WHERE profile_id = ? 
       AND is_active = 1 
       AND time_of_day LIKE ?`,
            [profileId, `%"${timeSlot}"%`]
        );
        return result.map(rowToMedication);
    },

    /**
     * Create a new medication
     */
    async create(input: CreateMedicationInput): Promise<Medication> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO medications (
        id, profile_id, name, dosage, form, frequency_rule, time_of_day,
        refill_threshold, current_quantity, photo_uri, notes, is_active, hide_name,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.name,
                input.dosage ?? null,
                input.form ?? null,
                input.frequencyRule ? JSON.stringify(input.frequencyRule) : null,
                JSON.stringify(input.timeOfDay),
                input.refillThreshold,
                input.currentQuantity ?? null,
                input.photoUri ?? null,
                input.notes ?? null,
                input.isActive ? 1 : 0,
                input.hideName ? 1 : 0,
                now,
                now,
            ]
        );

        // Update widget
        widgetService.updateWidget(input.profileId).catch(console.error);

        return {
            id,
            ...input,
            createdAt: now,
            updatedAt: now,
        };
    },

    /**
     * Update an existing medication
     */
    async update(id: string, input: UpdateMedicationInput): Promise<Medication | null> {
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
        if (input.refillThreshold !== undefined) {
            updates.push('refill_threshold = ?');
            values.push(input.refillThreshold);
        }
        if (input.currentQuantity !== undefined) {
            updates.push('current_quantity = ?');
            values.push(input.currentQuantity ?? null);
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
        if (input.hideName !== undefined) {
            updates.push('hide_name = ?');
            values.push(input.hideName ? 1 : 0);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE medications SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Update widget
        widgetService.updateWidget(existing.profileId).catch(console.error);

        return this.getById(id);
    },

    /**
     * Deactivate a medication (soft delete)
     */
    async deactivate(id: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync(
            'UPDATE medications SET is_active = 0, updated_at = ? WHERE id = ?',
            [new Date().toISOString(), id]
        );
        return result.changes > 0;
    },

    /**
     * Delete a medication permanently
     */
    async delete(id: string): Promise<boolean> {
        const db = await getDatabase();
        const medication = await this.getById(id);
        const result = await db.runAsync('DELETE FROM medications WHERE id = ?', [id]);

        // Update widget
        if (medication) {
            widgetService.updateWidget(medication.profileId).catch(console.error);
        }

        return result.changes > 0;
    },

    /**
     * Update current quantity (for refill tracking)
     */
    async updateQuantity(id: string, quantity: number): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync(
            'UPDATE medications SET current_quantity = ?, updated_at = ? WHERE id = ?',
            [quantity, new Date().toISOString(), id]
        );
        return result.changes > 0;
    },

    /**
     * Decrement quantity by 1 (when dose is taken)
     */
    async decrementQuantity(id: string): Promise<boolean> {
        const db = await getDatabase();
        const medication = await this.getById(id);
        const result = await db.runAsync(
            `UPDATE medications 
       SET current_quantity = CASE 
         WHEN current_quantity IS NOT NULL AND current_quantity > 0 
         THEN current_quantity - 1 
         ELSE current_quantity 
       END,
       updated_at = ? 
       WHERE id = ?`,
            [new Date().toISOString(), id]
        );

        // Update widget (refill alerts may have changed)
        if (medication) {
            widgetService.updateWidget(medication.profileId).catch(console.error);
        }

        return result.changes > 0;
    },

    /**
     * Get medications needing refill
     */
    async getNeedingRefill(profileId: string): Promise<Medication[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM medications 
       WHERE profile_id = ? 
       AND is_active = 1 
       AND current_quantity IS NOT NULL 
       AND current_quantity <= refill_threshold
       ORDER BY current_quantity ASC`,
            [profileId]
        );
        return result.map(rowToMedication);
    },

    /**
     * Search medications by name
     */
    async search(profileId: string, query: string): Promise<Medication[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM medications 
       WHERE profile_id = ? 
       AND name LIKE ? 
       ORDER BY name ASC`,
            [profileId, `%${query}%`]
        );
        return result.map(rowToMedication);
    },
};
