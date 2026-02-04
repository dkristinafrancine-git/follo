/**
 * Medication Reference Repository
 * Provides access to the pre-populated medication database for auto-complete
 */

import { getDatabase } from '../database';
import { MedicationReference } from '../types';

// Convert database row to MedicationReference entity
function rowToMedicationReference(row: Record<string, unknown>): MedicationReference {
    return {
        id: row.id as number,
        name: row.name as string,
        genericName: row.generic_name as string | undefined,
        brandNames: row.brand_names ? (row.brand_names as string).split(',') : [],
        dosageForms: row.dosage_forms ? (row.dosage_forms as string).split(',') : [],
        commonStrengths: row.common_strengths
            ? (row.common_strengths as string).split(',')
            : [],
        interactions: row.interactions ? (row.interactions as string).split(',') : [],
        category: row.category as string | undefined,
        lastUpdated: row.last_updated as string | undefined,
    };
}

export const medicationReferenceRepository = {
    /**
     * Search medications by name (for auto-complete)
     * Searches both name and generic_name fields
     */
    async search(query: string, limit = 10): Promise<MedicationReference[]> {
        if (!query || query.length < 2) return [];

        const db = await getDatabase();
        const searchTerm = `%${query.toLowerCase()}%`;

        const result = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM medication_reference 
       WHERE LOWER(name) LIKE ? 
       OR LOWER(generic_name) LIKE ?
       OR LOWER(brand_names) LIKE ?
       ORDER BY 
         CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END,
         name
       LIMIT ?`,
            [searchTerm, searchTerm, searchTerm, query.toLowerCase() + '%', limit]
        );
        return result.map(rowToMedicationReference);
    },

    /**
     * Get medication by exact name
     */
    async getByName(name: string): Promise<MedicationReference | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM medication_reference WHERE LOWER(name) = LOWER(?)',
            [name]
        );
        return result ? rowToMedicationReference(result) : null;
    },

    /**
     * Get all medications in a category
     */
    async getByCategory(category: string): Promise<MedicationReference[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            'SELECT * FROM medication_reference WHERE category = ? ORDER BY name',
            [category]
        );
        return result.map(rowToMedicationReference);
    },

    /**
     * Get popular/common medications (for initial suggestions)
     */
    async getCommon(limit = 20): Promise<MedicationReference[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            'SELECT * FROM medication_reference ORDER BY id LIMIT ?',
            [limit]
        );
        return result.map(rowToMedicationReference);
    },

    /**
     * Insert a new medication reference (for populating database)
     */
    async add(med: Omit<MedicationReference, 'id'>): Promise<number> {
        const db = await getDatabase();
        const result = await db.runAsync(
            `INSERT INTO medication_reference (
        name, generic_name, brand_names, dosage_forms, common_strengths, category, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                med.name,
                med.genericName ?? null,
                med.brandNames?.join(',') ?? null,
                med.dosageForms?.join(',') ?? null,
                med.commonStrengths?.join(',') ?? null,
                med.category ?? null,
                new Date().toISOString(),
            ]
        );
        return result.lastInsertRowId;
    },

    /**
     * Seed the database with common medications
     * Call this during app initialization
     */
    async seedCommonMedications(): Promise<void> {
        const db = await getDatabase();

        // Check if already seeded
        const count = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM medication_reference'
        );
        if (count && count.count > 0) return;

        // Common medications list
        const commonMeds: Omit<MedicationReference, 'id'>[] = [
            { name: 'Metformin', genericName: 'Metformin', dosageForms: ['Tablet', 'Liquid'], commonStrengths: ['500mg', '850mg', '1000mg'], category: 'Diabetes', brandNames: [], interactions: [] },
            { name: 'Lisinopril', genericName: 'Lisinopril', dosageForms: ['Tablet'], commonStrengths: ['5mg', '10mg', '20mg', '40mg'], category: 'Blood Pressure', brandNames: [], interactions: [] },
            { name: 'Atorvastatin', genericName: 'Atorvastatin', brandNames: ['Lipitor'], dosageForms: ['Tablet'], commonStrengths: ['10mg', '20mg', '40mg', '80mg'], category: 'Cholesterol', interactions: [] },
            { name: 'Omeprazole', genericName: 'Omeprazole', brandNames: ['Prilosec'], dosageForms: ['Capsule'], commonStrengths: ['10mg', '20mg', '40mg'], category: 'Gastrointestinal', interactions: [] },
            { name: 'Amlodipine', genericName: 'Amlodipine', brandNames: ['Norvasc'], dosageForms: ['Tablet'], commonStrengths: ['2.5mg', '5mg', '10mg'], category: 'Blood Pressure', interactions: [] },
            { name: 'Losartan', genericName: 'Losartan', brandNames: ['Cozaar'], dosageForms: ['Tablet'], commonStrengths: ['25mg', '50mg', '100mg'], category: 'Blood Pressure', interactions: [] },
            { name: 'Levothyroxine', genericName: 'Levothyroxine', brandNames: ['Synthroid'], dosageForms: ['Tablet'], commonStrengths: ['25mcg', '50mcg', '100mcg'], category: 'Thyroid', interactions: [] },
            { name: 'Gabapentin', genericName: 'Gabapentin', brandNames: ['Neurontin'], dosageForms: ['Capsule', 'Tablet'], commonStrengths: ['100mg', '300mg', '400mg'], category: 'Nerve Pain', interactions: [] },
            { name: 'Sertraline', genericName: 'Sertraline', brandNames: ['Zoloft'], dosageForms: ['Tablet'], commonStrengths: ['25mg', '50mg', '100mg'], category: 'Mental Health', interactions: [] },
            { name: 'Aspirin', genericName: 'Aspirin', dosageForms: ['Tablet'], commonStrengths: ['81mg', '325mg'], category: 'Pain/Heart', brandNames: [], interactions: [] },
            { name: 'Ibuprofen', genericName: 'Ibuprofen', brandNames: ['Advil', 'Motrin'], dosageForms: ['Tablet', 'Capsule', 'Liquid'], commonStrengths: ['200mg', '400mg', '600mg'], category: 'Pain', interactions: [] },
            { name: 'Acetaminophen', genericName: 'Acetaminophen', brandNames: ['Tylenol'], dosageForms: ['Tablet', 'Capsule', 'Liquid'], commonStrengths: ['325mg', '500mg', '650mg'], category: 'Pain', interactions: [] },
            { name: 'Vitamin D', genericName: 'Cholecalciferol', dosageForms: ['Tablet', 'Capsule', 'Drops'], commonStrengths: ['400IU', '1000IU', '2000IU', '5000IU'], category: 'Vitamin', brandNames: [], interactions: [] },
            { name: 'Vitamin B12', genericName: 'Cyanocobalamin', dosageForms: ['Tablet', 'Injection'], commonStrengths: ['500mcg', '1000mcg', '2500mcg'], category: 'Vitamin', brandNames: [], interactions: [] },
            { name: 'Fish Oil', genericName: 'Omega-3', dosageForms: ['Capsule'], commonStrengths: ['1000mg', '1200mg'], category: 'Supplement', brandNames: [], interactions: [] },
            { name: 'Prednisone', genericName: 'Prednisone', dosageForms: ['Tablet'], commonStrengths: ['5mg', '10mg', '20mg'], category: 'Steroid', brandNames: [], interactions: [] },
            { name: 'Fluoxetine', genericName: 'Fluoxetine', brandNames: ['Prozac'], dosageForms: ['Capsule'], commonStrengths: ['10mg', '20mg', '40mg'], category: 'Mental Health', interactions: [] },
            { name: 'Pantoprazole', genericName: 'Pantoprazole', brandNames: ['Protonix'], dosageForms: ['Tablet'], commonStrengths: ['20mg', '40mg'], category: 'Gastrointestinal', interactions: [] },
            { name: 'Clopidogrel', genericName: 'Clopidogrel', brandNames: ['Plavix'], dosageForms: ['Tablet'], commonStrengths: ['75mg'], category: 'Blood Thinner', interactions: [] },
            { name: 'Furosemide', genericName: 'Furosemide', brandNames: ['Lasix'], dosageForms: ['Tablet'], commonStrengths: ['20mg', '40mg', '80mg'], category: 'Diuretic', interactions: [] },
        ];

        for (const med of commonMeds) {
            await this.add(med);
        }

        console.log('Medication reference database seeded with', commonMeds.length, 'medications');
    },
};
