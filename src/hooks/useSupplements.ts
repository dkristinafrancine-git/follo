/**
 * useSupplements Hook
 * Provides state management for supplement tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { Supplement, CreateSupplementInput, UpdateSupplementInput } from '../types';
import { supplementRepository, calendarEventRepository } from '../repositories';
import { calendarService } from '../services';

interface UseSupplementsResult {
    supplements: Supplement[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface UseSupplementResult {
    supplement: Supplement | null;
    isLoading: boolean;
    error: Error | null;
}

interface UseCreateSupplementResult {
    create: (input: CreateSupplementInput) => Promise<Supplement>;
    isLoading: boolean;
    error: Error | null;
}

interface UseUpdateSupplementResult {
    update: (id: string, input: UpdateSupplementInput) => Promise<Supplement | null>;
    isLoading: boolean;
    error: Error | null;
}

interface UseDeleteSupplementResult {
    deleteSupplement: (id: string) => Promise<boolean>;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Get all supplements for a profile
 */
export function useSupplements(profileId: string | null): UseSupplementsResult {
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!profileId) {
            setSupplements([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await supplementRepository.getAllByProfile(profileId, true); // Include inactive for editing
            setSupplements(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch supplements'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { supplements, isLoading, error, refetch: fetch };
}

/**
 * Get a single supplement by ID
 */
export function useSupplement(id: string | null): UseSupplementResult {
    const [supplement, setSupplement] = useState<Supplement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setSupplement(null);
            setIsLoading(false);
            return;
        }

        const fetch = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await supplementRepository.getById(id);
                setSupplement(result);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch supplement'));
            } finally {
                setIsLoading(false);
            }
        };

        fetch();
    }, [id]);

    return { supplement, isLoading, error };
}

/**
 * Create a new supplement
 */
export function useCreateSupplement(): UseCreateSupplementResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(async (input: CreateSupplementInput): Promise<Supplement> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create supplement
            const supplement = await supplementRepository.create(input);

            // 2. Generate calendar events (SSOT)
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 90); // Generate for 90 days

            await calendarService.generateSupplementEvents(supplement, startDate, endDate);

            return supplement;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create supplement');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { create, isLoading, error };
}

/**
 * Update a supplement
 */
export function useUpdateSupplement(): UseUpdateSupplementResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const update = useCallback(async (id: string, input: UpdateSupplementInput): Promise<Supplement | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Update supplement
            const updatedSupplement = await supplementRepository.update(id, input);

            if (updatedSupplement) {
                // 2. Regenerate calendar events if schedule/active status changed
                const scheduleChanged =
                    input.frequencyRule !== undefined ||
                    input.timeOfDay !== undefined ||
                    input.isActive !== undefined;

                if (scheduleChanged) {
                    const startDate = new Date(); // Regenerate from today onwards
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 90);

                    await calendarService.generateSupplementEvents(updatedSupplement, startDate, endDate);
                }
            }

            return updatedSupplement;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update supplement');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { update, isLoading, error };
}

/**
 * Delete a supplement
 */
export function useDeleteSupplement(): UseDeleteSupplementResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteSupplement = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Delete supplement
            const success = await supplementRepository.delete(id);

            if (success) {
                // 2. Delete all associated calendar events
                await calendarEventRepository.deleteBySource(id);
            }

            return success;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete supplement');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { deleteSupplement, isLoading, error };
}
