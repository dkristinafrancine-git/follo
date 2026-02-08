import { useState, useCallback, useEffect } from 'react';
import { startOfWeek, endOfWeek, subDays, startOfDay, endOfDay, format } from 'date-fns';
import { medicationHistoryRepository } from '../repositories/medicationHistoryRepository';
import { activityRepository } from '../repositories/activityRepository';
import { calendarEventRepository } from '../repositories/calendarEventRepository';

export interface TimelineStats {
    adherenceRate: number;
    activitiesThisWeek: number;
    currentStreak: number;
    upcomingMeds: number;
}

export function useTimelineStats(profileId: string | null) {
    const [stats, setStats] = useState<TimelineStats>({
        adherenceRate: 0,
        activitiesThisWeek: 0,
        currentStreak: 0,
        upcomingMeds: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!profileId) {
            setStats({
                adherenceRate: 0,
                activitiesThisWeek: 0,
                currentStreak: 0,
                upcomingMeds: 0,
            });
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // 1. Adherence Rate (Last 7 days)
            const endDate = new Date();
            const startDate = subDays(endDate, 7);
            const adherence = await medicationHistoryRepository.getProfileAdherence(
                profileId,
                startDate.toISOString(),
                endDate.toISOString()
            );

            // 2. Activities (This Week)
            const now = new Date();
            const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
            const activityCount = await activityRepository.getWeeklyCount(
                profileId,
                weekStart.toISOString()
            );

            // 3. Current Streak
            const streak = await medicationHistoryRepository.getStreak(profileId);

            // 4. Upcoming Meds (Next 4 hours) - matching UI text
            // The UI says "Next 4 hours", so let's fetch pending events for next 4 hours
            const upcomingEvents = await calendarEventRepository.getUpcoming(profileId, 4);
            // Filter strictly for medication events if needed, but "Upcoming Meds" usually implies all medical events
            // However, the icon is a pill. Let's filter for medication type if possible, or just count all pending events
            // The repositories generally return calendar events. Upcoming usually means pending.
            // Let's assume all calendar events are relevant (meds, appointments) or filter by type?
            // The stat card says "Upcoming Meds", so let's filter for type 'medication'
            const upcomingMedsCount = upcomingEvents.filter(e => e.eventType === 'medication_due').length;

            setStats({
                adherenceRate: adherence.percentage,
                activitiesThisWeek: activityCount,
                currentStreak: streak,
                upcomingMeds: upcomingMedsCount,
            });
        } catch (error) {
            console.error('Failed to fetch timeline stats:', error);
            // Keep existing stats on error or set to 0? Keeping existing is safer for flicker prevention, 
            // but for now we just log.
        } finally {
            setIsLoading(false);
        }
    }, [profileId]);

    // Initial fetch
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        isLoading,
        refresh: fetchStats
    };
}
