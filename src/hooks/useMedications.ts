/**
 * useMedications Hook
 * Provides state management for medication CRUD operations
 * Follows architecture-guardian pattern: Repository → Hook → Component
 */

import { useState, useEffect, useCallback } from 'react';
import { addDays } from 'date-fns';
import {
    Medication,
    CreateMedicationInput,
    UpdateMedicationInput,
    CalendarEvent,
} from '../types';
import {
    medicationRepository,
    medicationHistoryRepository,
    calendarEventRepository,
} from '../repositories';
import { calendarService } from '../services';

// Default values per implementation plan
const DEFAULT_REFILL_THRESHOLD = 7;
const DEFAULT_FREQUENCY = { frequency: 'daily' as const };
const DEFAULT_TIME_OF_DAY = ['08:00'];
const CALENDAR_DAYS_AHEAD = 30;

interface UseMedicationsResult {
    medications: Medication[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface UseMedicationResult {
    medication: Medication | null;
    isLoading: boolean;
    error: Error | null;
}

interface UseCreateMedicationResult {
    create: (input: Partial<CreateMedicationInput>) => Promise<Medication>;
    isLoading: boolean;
    error: Error | null;
}

interface UseUpdateMedicationResult {
    update: (id: string, input: UpdateMedicationInput) => Promise<Medication | null>;
    isLoading: boolean;
    error: Error | null;
}

interface UseDeleteMedicationResult {
    deleteMedication: (id: string) => Promise<boolean>;
    isLoading: boolean;
    error: Error | null;
}

interface UseMedicationActionsResult {
    markTaken: (medicationId: string, scheduledTime: string, notes?: string) => Promise<void>;
    markSkipped: (medicationId: string, scheduledTime: string, notes?: string) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Get all medications for a profile
 */
export function useMedications(profileId: string | null, includeInactive = false): UseMedicationsResult {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!profileId) {
            setMedications([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await medicationRepository.getAllByProfile(profileId, includeInactive);
            setMedications(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch medications'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId, includeInactive]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { medications, isLoading, error, refetch: fetch };
}

/**
 * Get a single medication by ID
 */
export function useMedication(id: string | null): UseMedicationResult {
    const [medication, setMedication] = useState<Medication | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setMedication(null);
            setIsLoading(false);
            return;
        }

        const fetch = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await medicationRepository.getById(id);
                setMedication(result);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch medication'));
            } finally {
                setIsLoading(false);
            }
        };

        fetch();
    }, [id]);

    return { medication, isLoading, error };
}

/**
 * Create a new medication with calendar event generation
 */
export function useCreateMedication(profileId: string | null): UseCreateMedicationResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(
        async (input: Partial<CreateMedicationInput>): Promise<Medication> => {
            if (!profileId) {
                throw new Error('Profile ID is required');
            }

            setIsLoading(true);
            setError(null);

            try {
                // Apply defaults
                const fullInput: CreateMedicationInput = {
                    profileId,
                    name: input.name || '',
                    dosage: input.dosage,
                    form: input.form || 'Tablet',
                    frequencyRule: input.frequencyRule || DEFAULT_FREQUENCY,
                    timeOfDay: input.timeOfDay?.length ? input.timeOfDay : DEFAULT_TIME_OF_DAY,
                    refillThreshold: input.refillThreshold ?? DEFAULT_REFILL_THRESHOLD,
                    currentQuantity: input.currentQuantity,
                    photoUri: input.photoUri,
                    notes: input.notes,
                    isActive: input.isActive ?? true,
                    hideName: input.hideName ?? false,
                };

                // 1. Create medication in database
                const medication = await medicationRepository.create(fullInput);

                // 2. Generate calendar events for next 30 days (SSOT)
                const startDate = new Date();
                const endDate = addDays(startDate, CALENDAR_DAYS_AHEAD);
                await calendarService.generateMedicationEvents(medication, startDate, endDate);

                // 3. TODO: Schedule notifications via notificationService
                // await notificationService.scheduleMedicationReminders(medication.id);

                return medication;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to create medication');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [profileId]
    );

    return { create, isLoading, error };
}

/**
 * Update an existing medication
 */
export function useUpdateMedication(): UseUpdateMedicationResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const update = useCallback(
        async (id: string, input: UpdateMedicationInput): Promise<Medication | null> => {
            setIsLoading(true);
            setError(null);

            try {
                // 1. Update medication
                const medication = await medicationRepository.update(id, input);

                if (medication) {
                    // 2. Regenerate calendar events if schedule-related fields changed
                    const scheduleChanged =
                        input.timeOfDay !== undefined ||
                        input.frequencyRule !== undefined ||
                        input.isActive !== undefined;

                    if (scheduleChanged) {
                        const startDate = new Date();
                        const endDate = addDays(startDate, CALENDAR_DAYS_AHEAD);
                        await calendarService.generateMedicationEvents(medication, startDate, endDate);
                    }
                }

                return medication;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to update medication');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return { update, isLoading, error };
}

/**
 * Delete/deactivate a medication
 */
export function useDeleteMedication(): UseDeleteMedicationResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteMedication = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Soft delete (deactivate)
            const success = await medicationRepository.deactivate(id);

            if (success) {
                // Delete future calendar events for this medication
                await calendarEventRepository.deleteBySource(id);
            }

            return success;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete medication');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { deleteMedication, isLoading, error };
}

/**
 * Medication action handlers (mark taken, skipped)
 */
export function useMedicationActions(profileId: string | null): UseMedicationActionsResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const markTaken = useCallback(
        async (medicationId: string, scheduledTime: string, notes?: string): Promise<void> => {
            if (!profileId) return;

            setIsLoading(true);
            setError(null);

            try {
                // 1. Record in medication_history
                await medicationHistoryRepository.recordTaken(
                    profileId,
                    medicationId,
                    scheduledTime,
                    notes
                );

                // 2. Update calendar_event status
                const events = await calendarEventRepository.getBySourceAndTime(medicationId, scheduledTime);
                if (events.length > 0) {
                    await calendarEventRepository.markCompleted(events[0].id);
                }

                // 3. Decrement medication quantity
                await medicationRepository.decrementQuantity(medicationId);

                // 4. TODO: Update widget
                // await widgetService.updateWidget();
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to mark medication as taken');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [profileId]
    );

    const markSkipped = useCallback(
        async (medicationId: string, scheduledTime: string, notes?: string): Promise<void> => {
            if (!profileId) return;

            setIsLoading(true);
            setError(null);

            try {
                // 1. Record in medication_history
                await medicationHistoryRepository.recordSkipped(
                    profileId,
                    medicationId,
                    scheduledTime,
                    notes
                );

                // 2. Update calendar_event status
                const events = await calendarEventRepository.getBySourceAndTime(medicationId, scheduledTime);
                if (events.length > 0) {
                    await calendarEventRepository.markSkipped(events[0].id);
                }

                // 3. TODO: Update widget
                // await widgetService.updateWidget();
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Failed to mark medication as skipped');
                setError(error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [profileId]
    );

    return { markTaken, markSkipped, isLoading, error };
}

/**
 * Get medications needing refill
 */
export function useMedicationsNeedingRefill(profileId: string | null) {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!profileId) {
            setMedications([]);
            setIsLoading(false);
            return;
        }

        const fetch = async () => {
            setIsLoading(true);
            try {
                const result = await medicationRepository.getNeedingRefill(profileId);
                setMedications(result);
            } catch {
                setMedications([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetch();
    }, [profileId]);

    return { medications, isLoading };
}
