import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import { encryptionService } from '../services/encryptionService';
import {
    EmergencyData,
    CreateEmergencyDataInput,
    UpdateEmergencyDataInput,
    EmergencyContact
} from '../types';

// Convert database row to EmergencyData entity
function rowToEmergencyData(row: Record<string, unknown>): EmergencyData {
    let allergies: string[] = [];
    if (row.allergies) {
        try {
            // Decrypt first
            const decrypted = encryptionService.decrypt(row.allergies as string);
            allergies = JSON.parse(decrypted);
        } catch {
            allergies = [];
        }
    }

    let medicalConditions: string[] = [];
    if (row.medical_conditions) {
        try {
            medicalConditions = JSON.parse(row.medical_conditions as string);
        } catch {
            medicalConditions = [];
        }
    }

    let emergencyContacts: EmergencyContact[] = [];
    if (row.emergency_contacts) {
        try {
            emergencyContacts = JSON.parse(row.emergency_contacts as string);
        } catch {
            emergencyContacts = [];
        }
    }

    return {
        id: row.id as string,
        profileId: row.profile_id as string,
        bloodType: row.blood_type as string | undefined,
        allergies,
        medicalConditions,
        emergencyContacts,
        organDonor: (row.organ_donor as number) === 1,
        notes: row.notes as string | undefined,
        updatedAt: row.updated_at as string,
    };
}

export const emergencyDataRepository = {
    /**
     * Get emergency data for a profile
     */
    async getByProfile(profileId: string): Promise<EmergencyData | null> {
        await encryptionService.initialize();
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM emergency_data WHERE profile_id = ?',
            [profileId]
        );
        return result ? rowToEmergencyData(result) : null;
    },

    /**
     * Create or update emergency data (upsert)
     */
    async upsert(input: CreateEmergencyDataInput): Promise<EmergencyData> {
        const db = await getDatabase();
        const existing = await this.getByProfile(input.profileId);
        const now = new Date().toISOString();

        if (existing) {
            // Update existing
            await db.runAsync(
                `UPDATE emergency_data SET 
          blood_type = ?,
          allergies = ?,
          medical_conditions = ?,
          emergency_contacts = ?,
          organ_donor = ?,
          notes = ?,
          updated_at = ?
         WHERE profile_id = ?`,
                [
                    input.bloodType ?? null,
                    encryptionService.encrypt(JSON.stringify(input.allergies)),
                    JSON.stringify(input.medicalConditions),
                    JSON.stringify(input.emergencyContacts),
                    input.organDonor ? 1 : 0,
                    input.notes ?? null,
                    now,
                    input.profileId,
                ]
            );

            return {
                ...existing,
                ...input,
                updatedAt: now,
            };
        } else {
            // Create new
            const id = randomUUID();
            await db.runAsync(
                `INSERT INTO emergency_data (
          id, profile_id, blood_type, allergies, medical_conditions,
          emergency_contacts, organ_donor, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    input.profileId,
                    input.bloodType ?? null,
                    encryptionService.encrypt(JSON.stringify(input.allergies)),
                    JSON.stringify(input.medicalConditions),
                    JSON.stringify(input.emergencyContacts),
                    input.organDonor ? 1 : 0,
                    input.notes ?? null,
                    now,
                ]
            );

            return {
                id,
                ...input,
                updatedAt: now,
            };
        }
    },

    /**
     * Update emergency data
     */
    async update(profileId: string, input: UpdateEmergencyDataInput): Promise<EmergencyData | null> {
        const db = await getDatabase();
        const existing = await this.getByProfile(profileId);
        if (!existing) return null;

        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (input.bloodType !== undefined) {
            updates.push('blood_type = ?');
            values.push(input.bloodType ?? null);
        }
        if (input.allergies !== undefined) {
            updates.push('allergies = ?');
            values.push(JSON.stringify(input.allergies));
        }
        if (input.medicalConditions !== undefined) {
            updates.push('medical_conditions = ?');
            values.push(JSON.stringify(input.medicalConditions));
        }
        if (input.emergencyContacts !== undefined) {
            updates.push('emergency_contacts = ?');
            values.push(JSON.stringify(input.emergencyContacts));
        }
        if (input.organDonor !== undefined) {
            updates.push('organ_donor = ?');
            values.push(input.organDonor ? 1 : 0);
        }
        if (input.notes !== undefined) {
            updates.push('notes = ?');
            values.push(input.notes ?? null);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(profileId);

        await db.runAsync(
            `UPDATE emergency_data SET ${updates.join(', ')} WHERE profile_id = ?`,
            values
        );

        return this.getByProfile(profileId);
    },

    /**
     * Delete emergency data for a profile
     */
    async delete(profileId: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.runAsync('DELETE FROM emergency_data WHERE profile_id = ?', [profileId]);
        return result.changes > 0;
    },

    /**
     * Add an emergency contact
     */
    async addContact(profileId: string, contact: EmergencyContact): Promise<EmergencyData | null> {
        const existing = await this.getByProfile(profileId);
        if (!existing) {
            // Create new with just this contact
            return this.upsert({
                profileId,
                allergies: [],
                medicalConditions: [],
                emergencyContacts: [contact],
                organDonor: false,
            });
        }

        const contacts = [...existing.emergencyContacts, contact];
        return this.update(profileId, { emergencyContacts: contacts });
    },

    /**
     * Remove an emergency contact by index
     */
    async removeContact(profileId: string, index: number): Promise<EmergencyData | null> {
        const existing = await this.getByProfile(profileId);
        if (!existing || index < 0 || index >= existing.emergencyContacts.length) {
            return null;
        }

        const contacts = existing.emergencyContacts.filter((_, i) => i !== index);
        return this.update(profileId, { emergencyContacts: contacts });
    },

    /**
     * Add an allergy
     */
    async addAllergy(profileId: string, allergy: string): Promise<EmergencyData | null> {
        const existing = await this.getByProfile(profileId);
        if (!existing) {
            return this.upsert({
                profileId,
                allergies: [allergy],
                medicalConditions: [],
                emergencyContacts: [],
                organDonor: false,
            });
        }

        if (!existing.allergies.includes(allergy)) {
            const allergies = [...existing.allergies, allergy];
            return this.update(profileId, { allergies });
        }

        return existing;
    },

    /**
     * Remove an allergy
     */
    async removeAllergy(profileId: string, allergy: string): Promise<EmergencyData | null> {
        const existing = await this.getByProfile(profileId);
        if (!existing) return null;

        const allergies = existing.allergies.filter(a => a !== allergy);
        return this.update(profileId, { allergies });
    },
};
