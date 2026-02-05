/**
 * useActivities Hook
 * Provides state management for activity logging and tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { Activity, CreateActivityInput, ActivityType } from '../types';
import { activityRepository, calendarEventRepository } from '../repositories';
import { calendarService } from '../services';

interface UseActivitiesResult {
    activities: Activity[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface UseActivityResult {
    activity: Activity | null;
    isLoading: boolean;
    error: Error | null;
}

interface UseCreateActivityResult {
    create: (input: CreateActivityInput) => Promise<Activity>;
    isLoading: boolean;
    error: Error | null;
}

interface UseDeleteActivityResult {
    deleteActivity: (id: string) => Promise<boolean>;
    isLoading: boolean;
    error: Error | null;
}

interface UseActivitySummaryResult {
    summary: { total: number; count: number; average: number } | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Get recent activities for a profile
 */
export function useActivities(profileId: string | null, limit = 20): UseActivitiesResult {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!profileId) {
            setActivities([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await activityRepository.getRecent(profileId, limit);
            setActivities(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId, limit]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { activities, isLoading, error, refetch: fetch };
}

/**
 * Get a single activity by ID
 */
export function useActivity(id: string | null): UseActivityResult {
    const [activity, setActivity] = useState<Activity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setActivity(null);
            setIsLoading(false);
            return;
        }

        const fetch = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await activityRepository.getById(id);
                setActivity(result);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
            } finally {
                setIsLoading(false);
            }
        };

        fetch();
    }, [id]);

    return { activity, isLoading, error };
}

/**
 * Create a new activity
 */
export function useCreateActivity(): UseCreateActivityResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(async (input: CreateActivityInput): Promise<Activity> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create activity
            const activity = await activityRepository.create(input);

            // 2. Generate calendar event (SSOT)
            await calendarService.generateActivityEvent(activity);

            return activity;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create activity');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { create, isLoading, error };
}

/**
 * Delete an activity
 */
export function useDeleteActivity(): UseDeleteActivityResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Delete activity
            const success = await activityRepository.delete(id);

            if (success) {
                // 2. Delete calendar event
                await calendarEventRepository.deleteBySource(id);
            }

            return success;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete activity');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { deleteActivity, isLoading, error };
}

/**
 * Get activity summary (e.g., weekly total)
 */
export function useActivitySummary(
    profileId: string | null,
    type: ActivityType | string,
    startDate: string
): UseActivitySummaryResult {
    const [summary, setSummary] = useState<{ total: number; count: number; average: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!profileId) {
            setSummary(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await activityRepository.getWeeklySummary(profileId, type, startDate);
            setSummary(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch activity summary'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId, type, startDate]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { summary, isLoading, error, refetch: fetch };
}
