import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import {
    Appointment,
    CreateAppointmentInput,
    UpdateAppointmentInput
} from '../types';

// Convert database row to Appointment entity
function rowToAppointment(row: Record<string, unknown>): Appointment {
    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        title: row.title as string,
        doctorName: row.doctor_name as string | undefined,
        specialty: row.specialty as string | undefined,
        location: row.location as string | undefined,
        scheduledTime: row.scheduled_time as string,
        duration: (row.duration as number) ?? 30,
        reason: row.reason as string | undefined,
        photoUri: row.photo_uri as string | undefined,
        notes: row.notes as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

export const appointmentRepository = {
    /**
     * Get all upcoming appointments for a profile
     */
    async getUpcoming(profileId: string, limit = 10): Promise<Appointment[]> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM appointments 
       WHERE profile_id = ? AND scheduled_time >= ?
       ORDER BY scheduled_time ASC
       LIMIT ?`,
            [profileId, now, limit]
        );
        return result.map(rowToAppointment);
    },

    /**
     * Get past appointments for a profile
     */
    async getPast(profileId: string, limit = 20, offset = 0): Promise<Appointment[]> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM appointments 
       WHERE profile_id = ? AND scheduled_time < ?
       ORDER BY scheduled_time DESC
       LIMIT ? OFFSET ?`,
            [profileId, now, limit, offset]
        );
        return result.map(rowToAppointment);
    },

    /**
     * Get appointments for a specific day
     */
    async getByDay(profileId: string, date: string): Promise<Appointment[]> {
        const db = await getDatabase();
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.999Z`;
        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM appointments 
       WHERE profile_id = ? 
       AND scheduled_time >= ? 
       AND scheduled_time <= ?
       ORDER BY scheduled_time ASC`,
            [profileId, startDate, endDate]
        );
        return result.map(rowToAppointment);
    },

    /**
     * Get a single appointment by ID
     */
    async getById(id: string): Promise<Appointment | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM appointments WHERE id = ?',
            [id]
        );
        return result ? rowToAppointment(result) : null;
    },

    /**
     * Create a new appointment
     */
    async create(input: CreateAppointmentInput): Promise<Appointment> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        await db.runAsync(
            `INSERT INTO appointments (
        id, profile_id, title, doctor_name, specialty, location,
        scheduled_time, duration, reason, photo_uri, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.profileId,
                input.title,
                input.doctorName ?? null,
                input.specialty ?? null,
                input.location ?? null,
                input.scheduledTime,
                input.duration,
                input.reason ?? null,
                input.photoUri ?? null,
                input.notes ?? null,
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
     * Update an existing appointment
     */
    async update(id: string, input: UpdateAppointmentInput): Promise<Appointment | null> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return null;

        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (input.title !== undefined) {
            updates.push('title = ?');
            values.push(input.title);
        }
        if (input.doctorName !== undefined) {
            updates.push('doctor_name = ?');
            values.push(input.doctorName ?? null);
        }
        if (input.specialty !== undefined) {
            updates.push('specialty = ?');
            values.push(input.specialty ?? null);
        }
        if (input.location !== undefined) {
            updates.push('location = ?');
            values.push(input.location ?? null);
        }
        if (input.scheduledTime !== undefined) {
            updates.push('scheduled_time = ?');
            values.push(input.scheduledTime);
        }
        if (input.duration !== undefined) {
            updates.push('duration = ?');
            values.push(input.duration);
        }
        if (input.reason !== undefined) {
            updates.push('reason = ?');
            values.push(input.reason ?? null);
        }
        if (input.photoUri !== undefined) {
            updates.push('photo_uri = ?');
            values.push(input.photoUri ?? null);
        }
        if (input.notes !== undefined) {
            updates.push('notes = ?');
            values.push(input.notes ?? null);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return this.getById(id);
    },

    /**
     * Delete an appointment
     */
    async delete(id: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync('DELETE FROM appointments WHERE id = ?', [id]);
        return result.changes > 0;
    },

    /**
     * Get next appointment
     */
    async getNext(profileId: string): Promise<Appointment | null> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            `SELECT * FROM appointments 
       WHERE profile_id = ? AND scheduled_time >= ?
       ORDER BY scheduled_time ASC
       LIMIT 1`,
            [profileId, now]
        );
        return result ? rowToAppointment(result) : null;
    },
};
