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
     */
    async getDashboardStats(profileId: string): Promise<MyFlowStats> {
        const now = new Date();
        const todayStart = startOfDay(now).toISOString();
        const todayEnd = endOfDay(now).toISOString();

        // Calculate adherence for the last 7 days
        const sevenDaysAgo = subDays(now, 6); // Includes today
        const adherenceStart = startOfDay(sevenDaysAgo).toISOString();
        const adherenceEnd = todayEnd;

        const adherence = await medicationHistoryRepository.getProfileAdherence(
            profileId,
            adherenceStart,
            adherenceEnd
        );

        // Get activities logged today
        const activitiesCount = await activityRepository.getWeeklyCount(profileId, todayStart); // Using getWeeklyCount but with today's range implies daily count if we pass today's start/end? No, getWeeklyCount takes startDate and adds 7 days. I should use getByDateRange or count manually.
        // Wait, activityRepository.getWeeklyCount calculates end date as start + 7 days. 
        // I should use a direct count query or fetch all for today and count.
        // activityRepository.getByDateRange is available.
        const todaysActivities = await activityRepository.getByDateRange(profileId, todayStart, todayEnd);

        // Get streak
        const streak = await medicationHistoryRepository.getStreak(profileId);

        return {
            adherencePercentage: adherence.percentage,
            activitiesLogged: todaysActivities.length,
            streakDays: streak,
        };
    },

    /**
     * Get adherence history for charts
     */
    async getAdherenceHistory(profileId: string, days: number = 7): Promise<AdherenceDataPoint[]> {
        const now = new Date();
        const history: AdherenceDataPoint[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const start = startOfDay(date).toISOString();
            const end = endOfDay(date).toISOString();

            const stats = await medicationHistoryRepository.getProfileAdherence(profileId, start, end);

            history.push({
                date: format(date, 'yyyy-MM-dd'),
                percentage: stats.percentage,
            });
        }

        return history;
    }
};
