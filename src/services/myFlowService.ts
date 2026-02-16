import { calendarEventRepository } from '../repositories/calendarEventRepository';
import { medicationHistoryRepository } from '../repositories/medicationHistoryRepository';
import { activityRepository } from '../repositories/activityRepository';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface MyFlowStats {
    adherencePercentage: number;
    activitiesLogged: number;
    streakDays: number;
}

export interface AdherenceDataPoint {
    date: string; // YYYY-MM-DD
    percentage: number;
}

export const myFlowService = {
    /**
     * Get aggregated stats for the dashboard
     * Uses calendar_events (SSOT) for adherence, not medication_history
     */
    async getDashboardStats(profileId: string): Promise<MyFlowStats> {
        const now = new Date();
        const todayStart = startOfDay(now).toISOString();
        const todayEnd = endOfDay(now).toISOString();

        // Calculate adherence for the last 7 days using calendar_events (SSOT)
        const sevenDaysAgo = subDays(now, 6); // Includes today
        const startDateStr = format(sevenDaysAgo, 'yyyy-MM-dd');
        const endDateStr = format(now, 'yyyy-MM-dd');

        const stats = await calendarEventRepository.getStats(
            profileId,
            startDateStr,
            endDateStr
        );

        // Adherence = completed / (total - pending)
        // We exclude pending because those haven't come due yet
        const actionable = stats.total - stats.pending;
        const adherencePercentage = actionable > 0
            ? Math.round((stats.completed / actionable) * 100)
            : 0;

        // Get activities logged today
        const todaysActivities = await activityRepository.getByDateRange(profileId, todayStart, todayEnd);

        // Get streak
        const streak = await medicationHistoryRepository.getStreak(profileId);

        return {
            adherencePercentage,
            activitiesLogged: todaysActivities.length,
            streakDays: streak,
        };
    },

    /**
     * Get adherence history for charts
     * Uses calendar_events (SSOT) for accurate data
     */
    async getAdherenceHistory(profileId: string, days: number = 7): Promise<AdherenceDataPoint[]> {
        const now = new Date();
        const history: AdherenceDataPoint[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            const stats = await calendarEventRepository.getStats(
                profileId,
                dateStr,
                dateStr // same day for single-day stats
            );

            // Adherence = completed / (total - pending)
            const actionable = stats.total - stats.pending;
            const percentage = actionable > 0
                ? Math.round((stats.completed / actionable) * 100)
                : 0;

            history.push({
                date: dateStr,
                percentage,
            });
        }

        return history;
    }
};
