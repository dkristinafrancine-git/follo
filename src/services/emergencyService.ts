import { emergencyDataRepository } from '../repositories/emergencyDataRepository';
import { EmergencyData, CreateEmergencyDataInput, UpdateEmergencyDataInput } from '../types';

export const emergencyService = {
    /**
     * Get emergency data for a profile
     */
    async getEmergencyData(profileId: string): Promise<EmergencyData | null> {
        return emergencyDataRepository.getByProfile(profileId);
    },

    /**
     * Create or update emergency data
     */
    async saveEmergencyData(input: CreateEmergencyDataInput): Promise<EmergencyData> {
        // Validation could go here
        return emergencyDataRepository.upsert(input);
    },

    /**
     * Update specific fields
     */
    async updateEmergencyData(profileId: string, input: UpdateEmergencyDataInput): Promise<EmergencyData | null> {
        return emergencyDataRepository.update(profileId, input);
    },

    /**
     * Delete emergency data
     */
    async deleteEmergencyData(profileId: string): Promise<boolean> {
        return emergencyDataRepository.delete(profileId);
    },

    /**
     * Import emergency data from JSON string (e.g. from QR code)
     */
    async importEmergencyData(profileId: string, jsonString: string): Promise<EmergencyData> {
        try {
            const parsed = JSON.parse(jsonString);

            // Basic validation
            if (!Array.isArray(parsed.allergies) || !Array.isArray(parsed.medicalConditions)) {
                throw new Error('Invalid emergency data format');
            }

            // Construct input object
            const input: CreateEmergencyDataInput = {
                profileId,
                bloodType: parsed.bloodType,
                allergies: parsed.allergies,
                medicalConditions: parsed.medicalConditions,
                emergencyContacts: parsed.emergencyContacts || [],
                organDonor: !!parsed.organDonor,
                notes: parsed.notes
            };

            return this.saveEmergencyData(input);
        } catch (error) {
            console.error('Failed to import emergency data', error);
            throw new Error('Failed to parse emergency data');
        }
    }
};
