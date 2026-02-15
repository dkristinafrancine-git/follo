import { useState, useCallback, useEffect } from 'react';
import { Reminder, CreateReminderInput, UpdateReminderInput } from '../types';
import { reminderService } from '../services/reminderService';
import { useFocusEffect } from 'expo-router';

export function useReminders(profileId?: string) {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadReminders = useCallback(async () => {
        if (!profileId) return;
        try {
            setIsLoading(true);
            const data = await reminderService.getByProfileId(profileId);
            setReminders(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
            console.error('Failed to load reminders', err);
        } finally {
            setIsLoading(false);
        }
    }, [profileId]);

    useFocusEffect(
        useCallback(() => {
            loadReminders();
        }, [loadReminders])
    );

    const createReminder = useCallback(async (input: CreateReminderInput) => {
        try {
            setIsLoading(true);
            await reminderService.create(input);
            await loadReminders();
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadReminders]);

    const updateReminder = useCallback(async (id: string, input: UpdateReminderInput) => {
        try {
            setIsLoading(true);
            await reminderService.update(id, input);
            await loadReminders();
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadReminders]);

    const deleteReminder = useCallback(async (id: string) => {
        try {
            setIsLoading(true);
            await reminderService.delete(id);
            await loadReminders();
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadReminders]);

    return {
        reminders,
        isLoading,
        error,
        createReminder,
        updateReminder,
        deleteReminder,
        refresh: loadReminders
    };
}
