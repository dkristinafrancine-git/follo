import { randomUUID } from 'expo-crypto';
import { getDatabase } from '../database';
import { Profile, CreateProfileInput, UpdateProfileInput } from '../types';

// Convert database row to Profile entity
function rowToProfile(row: Record<string, unknown>): Profile {
    return {
        id: row.id as string,
        name: row.name as string,
        avatarUri: row.avatar_uri as string | undefined,
        birthDate: row.birth_date as string | undefined,
        isPrimary: (row.is_primary as number) === 1,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

export const profileRepository = {
    /**
     * Get all profiles
     */
    async getAll(): Promise<Profile[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<Record<string, unknown>>(
            'SELECT * FROM profiles ORDER BY is_primary DESC, name ASC'
        );
        return result.map(rowToProfile);
    },

    /**
     * Get a single profile by ID
     */
    async getById(id: string): Promise<Profile | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM profiles WHERE id = ?',
            [id]
        );
        return result ? rowToProfile(result) : null;
    },

    /**
     * Get the primary profile
     */
    async getPrimary(): Promise<Profile | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<Record<string, unknown>>(
            'SELECT * FROM profiles WHERE is_primary = 1 LIMIT 1'
        );
        return result ? rowToProfile(result) : null;
    },

    /**
     * Create a new profile
     */
    async create(input: CreateProfileInput): Promise<Profile> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const id = randomUUID();

        // If this is the first profile or marked as primary, ensure only one primary exists
        if (input.isPrimary) {
            await db.runAsync('UPDATE profiles SET is_primary = 0 WHERE is_primary = 1');
        }

        // Check if this will be the first profile
        const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM profiles');
        const isFirst = (count?.count ?? 0) === 0;

        await db.runAsync(
            `INSERT INTO profiles (id, name, avatar_uri, birth_date, is_primary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.name,
                input.avatarUri ?? null,
                input.birthDate ?? null,
                input.isPrimary || isFirst ? 1 : 0, // First profile is always primary
                now,
                now,
            ]
        );

        return {
            id,
            ...input,
            isPrimary: input.isPrimary || isFirst,
            createdAt: now,
            updatedAt: now,
        };
    },

    /**
     * Update an existing profile
     */
    async update(id: string, input: UpdateProfileInput): Promise<Profile | null> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return null;

        const now = new Date().toISOString();

        // If setting as primary, unset other primaries first
        if (input.isPrimary === true) {
            await db.runAsync('UPDATE profiles SET is_primary = 0 WHERE is_primary = 1 AND id != ?', [id]);
        }

        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (input.name !== undefined) {
            updates.push('name = ?');
            values.push(input.name);
        }
        if (input.avatarUri !== undefined) {
            updates.push('avatar_uri = ?');
            values.push(input.avatarUri ?? null);
        }
        if (input.birthDate !== undefined) {
            updates.push('birth_date = ?');
            values.push(input.birthDate ?? null);
        }
        if (input.isPrimary !== undefined) {
            updates.push('is_primary = ?');
            values.push(input.isPrimary ? 1 : 0);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);

        await db.runAsync(
            `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return this.getById(id);
    },

    /**
     * Delete a profile and all associated data (CASCADE)
     */
    async delete(id: string): Promise<boolean> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return false;

        // If deleting primary, make another profile primary
        if (existing.isPrimary) {
            const other = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM profiles WHERE id != ? LIMIT 1',
                [id]
            );
            if (other) {
                await db.runAsync('UPDATE profiles SET is_primary = 1 WHERE id = ?', [other.id]);
            }
        }

        await db.runAsync('DELETE FROM profiles WHERE id = ?', [id]);
        return true;
    },

    /**
     * Set a profile as primary
     */
    async setPrimary(id: string): Promise<boolean> {
        const db = await getDatabase();
        const existing = await this.getById(id);
        if (!existing) return false;

        await db.runAsync('UPDATE profiles SET is_primary = 0 WHERE is_primary = 1');
        await db.runAsync('UPDATE profiles SET is_primary = 1, updated_at = ? WHERE id = ?', [
            new Date().toISOString(),
            id,
        ]);
        return true;
    },

    /**
     * Get profile count
     */
    async count(): Promise<number> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM profiles');
        return result?.count ?? 0;
    },
};
