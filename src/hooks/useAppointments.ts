/**
 * useAppointments Hook
 * Provides state management for appointment CRUD operations
 * Follows architecture-guardian pattern: Repository → Hook → Component
 */

import { useState, useEffect, useCallback } from 'react';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../types';
import { appointmentRepository, calendarEventRepository } from '../repositories';
import { calendarService } from '../services';

interface UseAppointmentsResult {
    appointments: Appointment[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

interface UseAppointmentResult {
    appointment: Appointment | null;
    isLoading: boolean;
    error: Error | null;
}

interface UseCreateAppointmentResult {
    create: (input: CreateAppointmentInput) => Promise<Appointment>;
    isLoading: boolean;
    error: Error | null;
}

interface UseUpdateAppointmentResult {
    update: (id: string, input: UpdateAppointmentInput) => Promise<Appointment | null>;
    isLoading: boolean;
    error: Error | null;
}

interface UseDeleteAppointmentResult {
    deleteAppointment: (id: string) => Promise<boolean>;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Get all upcoming appointments for a profile
 */
export function useAppointments(profileId: string | null): UseAppointmentsResult {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        if (!profileId) {
            setAppointments([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await appointmentRepository.getUpcoming(profileId);
            setAppointments(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { appointments, isLoading, error, refetch: fetch };
}

/**
 * Get a single appointment by ID
 */
export function useAppointment(id: string | null): UseAppointmentResult {
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) {
            setAppointment(null);
            setIsLoading(false);
            return;
        }

        const fetch = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await appointmentRepository.getById(id);
                setAppointment(result);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch appointment'));
            } finally {
                setIsLoading(false);
            }
        };

        fetch();
    }, [id]);

    return { appointment, isLoading, error };
}

/**
 * Create a new appointment
 */
export function useCreateAppointment(): UseCreateAppointmentResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(async (input: CreateAppointmentInput): Promise<Appointment> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create appointment
            const appointment = await appointmentRepository.create(input);

            // 2. Generate calendar event (SSOT)
            await calendarService.generateAppointmentEvent(appointment);

            return appointment;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create appointment');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { create, isLoading, error };
}

/**
 * Update an existing appointment
 */
export function useUpdateAppointment(): UseUpdateAppointmentResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const update = useCallback(async (id: string, input: UpdateAppointmentInput): Promise<Appointment | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Update appointment
            const appointment = await appointmentRepository.update(id, input);

            if (appointment) {
                // 2. Regenerate calendar event
                await calendarService.generateAppointmentEvent(appointment);
            }

            return appointment;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to update appointment');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { update, isLoading, error };
}

/**
 * Delete an appointment
 */
export function useDeleteAppointment(): UseDeleteAppointmentResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteAppointment = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Delete appointment
            const success = await appointmentRepository.delete(id);

            if (success) {
                // 2. Delete calendar event
                await calendarEventRepository.deleteBySource(id);
            }

            return success;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to delete appointment');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { deleteAppointment, isLoading, error };
}
