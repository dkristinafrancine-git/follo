/**
 * useGratitudes Hook
 * Provides state management for gratitude logging and tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { Gratitude, CreateGratitudeInput } from '../types';
import { gratitudeRepository } from '../repositories';
import { calendarService } from '../services';
import { calendarEventRepository } from '../repositories';

interface UseGratitudesResult {
    gratitudes: Gratitude[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface UseCreateGratitudeResult {
    create: (input: CreateGratitudeInput) => Promise<Gratitude>;
    isLoading: boolean;
    error: Error | null;
}

interface UseGratitudeChartResult {
    data: Gratitude[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Get recent gratitudes for a profile
 */
export function useGratitudes(profileId: string | null, limit = 50): UseGratitudesResult {
    const [gratitudes, setGratitudes] = useState<Gratitude[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!profileId) {
            setGratitudes([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await gratitudeRepository.getByProfile(profileId, limit);
            setGratitudes(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch gratitudes'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId, limit]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { gratitudes, isLoading, error, refetch: fetch };
}

/**
 * Create a new gratitude entry
 */
export function useCreateGratitude(): UseCreateGratitudeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(async (input: CreateGratitudeInput): Promise<Gratitude> => {
        setIsLoading(true);
        setError(null);

        try {
            const gratitude = await gratitudeRepository.create(input);
            await calendarService.generateGratitudeEvent(gratitude);
            return gratitude;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create gratitude');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { create, isLoading, error };
}

/**
 * Get gratitudes for chart
 */
export function useGratitudeChart(
    profileId: string | null,
    startDate: string,
    endDate: string
): UseGratitudeChartResult {
    const [data, setData] = useState<Gratitude[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!profileId) {
            setData([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await gratitudeRepository.getByDateRange(profileId, startDate, endDate);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch gratitude chart data'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId, startDate, endDate]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, isLoading, error, refetch: fetch };
}

interface UseUpdateGratitudeResult {
    update: (id: string, input: import('../types').UpdateGratitudeInput) => Promise<Gratitude | null>;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Update an existing gratitude entry
 */
export function useUpdateGratitude(): UseUpdateGratitudeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const update = useCallback(async (id: string, input: import('../types').UpdateGratitudeInput): Promise<Gratitude | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const updated = await gratitudeRepository.update(id, input);
            return updated;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update gratitude');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { update, isLoading, error };
}

interface UseDeleteGratitudeResult {
    remove: (id: string) => Promise<boolean>;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Delete a gratitude entry
 */
export function useDeleteGratitude(): UseDeleteGratitudeResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const remove = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const success = await gratitudeRepository.delete(id);
            if (success) {
                // Delete associated calendar event
                await calendarEventRepository.deleteBySource(id);
            }
            return success;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete gratitude');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { remove, isLoading, error };
}

interface UseGratitudeResult {
    gratitude: Gratitude | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Get a single gratitude by ID
 */
export function useGratitude(id: string): UseGratitudeResult {
    const [gratitude, setGratitude] = useState<Gratitude | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!id) {
            setGratitude(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await gratitudeRepository.getById(id);
            setGratitude(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch gratitude'));
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { gratitude, isLoading, error, refetch: fetch };
}
