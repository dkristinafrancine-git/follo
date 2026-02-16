import { useState, useCallback, useEffect } from 'react';
import { startOfWeek, endOfWeek, subDays, startOfDay, endOfDay, format } from 'date-fns';
import { medicationHistoryRepository } from '../repositories/medicationHistoryRepository';
import { activityRepository } from '../repositories/activityRepository';
import { calendarEventRepository } from '../repositories/calendarEventRepository';

export interface TimelineStats {
    adherenceRate: number;
    activitiesThisWeek: number;
    currentStreak: number;
    todayTaken: number;
    todayTotal: number;
    upcomingMeds: number;
}

export function useTimelineStats(profileId: string | null) {
    const [stats, setStats] = useState<TimelineStats>({
        adherenceRate: 0,
        activitiesThisWeek: 0,
        currentStreak: 0,
        todayTaken: 0,
        todayTotal: 0,
        upcomingMeds: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!profileId) {
            setStats({
                adherenceRate: 0,
                activitiesThisWeek: 0,
                currentStreak: 0,
                todayTaken: 0,
                todayTotal: 0,
                upcomingMeds: 0,
            });
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // 1. Adherence Rate (Last 7 days) - using calendar_events (SSOT)
            const endDate = new Date();
            const startDate = subDays(endDate, 7);
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const endDateStr = format(endDate, 'yyyy-MM-dd');
            const eventStats = await calendarEventRepository.getStats(
                profileId,
                startDateStr,
                endDateStr
            );
            const actionable = eventStats.total - eventStats.pending;
            const adherencePercentage = actionable > 0
                ? Math.round((eventStats.completed / actionable) * 100)
                : 0;

            // 2. Activities (This Week)
            const now = new Date();
            const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
            const activityCount = await activityRepository.getWeeklyCount(
                profileId,
                weekStart.toISOString()
            );

            // 3. Current Streak + Today's progress
            const streak = await medicationHistoryRepository.getStreak(profileId);
            const todayProgress = await medicationHistoryRepository.getTodayProgress(profileId);

            // 4. Upcoming Meds (Next 4 hours) - matching UI text
            const upcomingEvents = await calendarEventRepository.getUpcoming(profileId, 4);
            const upcomingMedsCount = upcomingEvents.filter(e => e.eventType === 'medication_due').length;

            setStats({
                adherenceRate: adherencePercentage,
                activitiesThisWeek: activityCount,
                currentStreak: streak,
                todayTaken: todayProgress.taken,
                todayTotal: todayProgress.total,
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
