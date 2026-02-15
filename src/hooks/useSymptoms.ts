import { useState, useCallback, useEffect } from 'react';
import { symptomRepository } from '../repositories/symptomRepository';
import { Symptom, CreateSymptomDTO, UpdateSymptomDTO } from '../types';
import { calendarService } from '../services';
import { calendarEventRepository } from '../repositories';
import { useFocusEffect } from 'expo-router';

export function useSymptoms(profileId?: string) {
    const [symptoms, setSymptoms] = useState<Symptom[]>([]);
    const [recentSymptoms, setRecentSymptoms] = useState<Symptom[]>([]);
    const [distinctNames, setDistinctNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadSymptoms = useCallback(async (startDate?: string, endDate?: string) => {
        if (!profileId) return;
        setLoading(true);
        try {
            const data = await symptomRepository.getSymptoms(profileId, startDate, endDate);
            setSymptoms(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [profileId]);

    const loadRecentSymptoms = useCallback(async (limit: number = 20) => {
        if (!profileId) return;
        try {
            const data = await symptomRepository.getRecentSymptoms(profileId, limit);
            setRecentSymptoms(data);
        } catch (err) {
            console.error('Failed to load recent symptoms', err);
        }
    }, [profileId]);

    const loadDistinctNames = useCallback(async () => {
        if (!profileId) return;
        try {
            const names = await symptomRepository.getDistinctSymptomNames(profileId);
            setDistinctNames(names);
        } catch (err) {
            console.error('Failed to load distinct symptom names', err);
        }
    }, [profileId]);

    const addSymptom = useCallback(async (symptom: Omit<CreateSymptomDTO, 'profile_id'>) => {
        if (!profileId) throw new Error('Profile ID is required');
        setLoading(true);
        try {
            const newSymptom = await symptomRepository.addSymptom({
                ...symptom,
                profile_id: profileId,
            });
            await calendarService.generateSymptomEvent(newSymptom);
            setSymptoms(prev => [newSymptom, ...prev]);
            await loadRecentSymptoms();
            await loadDistinctNames();
            return newSymptom;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [profileId, loadRecentSymptoms, loadDistinctNames]);

    const updateSymptom = useCallback(async (id: string, updates: UpdateSymptomDTO) => {
        setLoading(true);
        try {
            await symptomRepository.updateSymptom(id, updates);
            setSymptoms(prev => prev.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s));
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteSymptom = useCallback(async (id: string) => {
        setLoading(true);
        try {
            await symptomRepository.deleteSymptom(id);
            await calendarEventRepository.deleteBySource(id);
            setSymptoms(prev => prev.filter(s => s.id !== id));
            await loadRecentSymptoms();
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [loadRecentSymptoms]);

    return {
        symptoms,
        recentSymptoms,
        distinctNames,
        loading,
        error,
        loadSymptoms,
        loadRecentSymptoms,
        loadDistinctNames,
        addSymptom,
        updateSymptom,
        deleteSymptom,
    };
}
