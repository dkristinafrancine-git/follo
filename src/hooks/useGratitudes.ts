/**
 * useGratitudes Hook
 * Provides state management for gratitude logging and tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { Gratitude, CreateGratitudeInput } from '../types';
import { gratitudeRepository } from '../repositories';

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
