import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';
import {
    EmergencyData,
    CreateEmergencyDataInput,
    UpdateEmergencyDataInput,
    EmergencyContact
} from '../types';

const STORAGE_KEY_PREFIX = 'follo_emergency_v1_';

export const emergencyDataRepository = {
    /**
     * Get emergency data for a profile from SecureStore
     */
    async getByProfile(profileId: string): Promise<EmergencyData | null> {
        try {
            const key = `${STORAGE_KEY_PREFIX}${profileId}`;
            const jsonString = await SecureStore.getItemAsync(key);

            if (!jsonString) {
                return null;
            }

            return JSON.parse(jsonString) as EmergencyData;
        } catch (error) {
            console.error('[EmergencyRepo] Failed to load data:', error);
            return null;
        }
    },

    /**
     * Create or update emergency data (upsert)
     */
    async upsert(input: CreateEmergencyDataInput): Promise<EmergencyData> {
        const key = `${STORAGE_KEY_PREFIX}${input.profileId}`;
        const now = new Date().toISOString();

        // Check if exists to preserve ID, or generate new one
        const existing = await this.getByProfile(input.profileId);
        const id = existing?.id || randomUUID();

        // Construct the full object
        const newData: EmergencyData = {
            id,
            profileId: input.profileId,
            bloodType: input.bloodType,
            allergies: input.allergies || [],
            medicalConditions: input.medicalConditions || [],
            emergencyContacts: input.emergencyContacts || [],
            organDonor: input.organDonor || false,
            notes: input.notes,
            updatedAt: now,
        };

        try {
            await SecureStore.setItemAsync(key, JSON.stringify(newData));
            return newData;
        } catch (error) {
            console.error('[EmergencyRepo] Failed to save data:', error);
            throw new Error('Failed to securely save emergency data');
        }
    },

    /**
     * Update emergency data
     */
    async update(profileId: string, input: UpdateEmergencyDataInput): Promise<EmergencyData | null> {
        const existing = await this.getByProfile(profileId);
        if (!existing) return null;

        const now = new Date().toISOString();
        const updatedData: EmergencyData = {
            ...existing,
            ...input,
            updatedAt: now,
        };

        const key = `${STORAGE_KEY_PREFIX}${profileId}`;
        try {
            await SecureStore.setItemAsync(key, JSON.stringify(updatedData));
            return updatedData;
        } catch (error) {
            console.error('[EmergencyRepo] Failed to update data:', error);
            throw new Error('Failed to securely update emergency data');
        }
    },

    /**
     * Delete emergency data for a profile
     */
    async delete(profileId: string): Promise<boolean> {
        const key = `${STORAGE_KEY_PREFIX}${profileId}`;
        try {
            await SecureStore.deleteItemAsync(key);
            return true;
        } catch (error) {
            console.error('[EmergencyRepo] Failed to delete data:', error);
            return false;
        }
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
