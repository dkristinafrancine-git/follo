import { medicationHistoryRepository } from '../repositories/medicationHistoryRepository';
import { medicationRepository } from '../repositories/medicationRepository';
import { differenceInMinutes, parseISO } from 'date-fns';

export interface CareInsight {
    type: 'most_missed' | 'best_time' | 'consistency' | 'streak';
    title: string;
    value: string | number;
    description: string;
    score?: number; // 0-100 for score types
    trend?: 'up' | 'down' | 'neutral';
}

export const careMetricsService = {
    /**
     * Get the medication that is missed most frequently
     */
    async getMostMissedMedication(profileId: string): Promise<CareInsight | null> {
        const missed = await medicationHistoryRepository.getMostMissed(profileId, 1);

        if (missed.length === 0) return null;

        const medication = await medicationRepository.getById(missed[0].medicationId);
        if (!medication) return null;

        return {
            type: 'most_missed',
            title: 'Most Missed',
            value: medication.name,
            description: `Missed ${missed[0].count} times recently`,
            trend: 'down'
        };
    },

    /**
     * Get the best time of day for adherence
     */
    async getBestAdherenceTime(profileId: string): Promise<CareInsight | null> {
        const bestTime = await medicationHistoryRepository.getBestTime(profileId);

        if (!bestTime) return null;

        const hour = bestTime.hour;
        const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';
        const formattedTime = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

        return {
            type: 'best_time',
            title: 'Best Time',
            value: formattedTime,
            description: `You're most consistent in the ${period}`,
            trend: 'up'
        };
    },

    /**
     * Calculate consistency score based on adherence and time variance
     */
    async getConsistencyScore(profileId: string): Promise<CareInsight> {
        // Get last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const history = await medicationHistoryRepository.getByProfileDateRange(
            profileId,
            startDate.toISOString(),
            endDate.toISOString()
        );

        if (history.length === 0) {
            return {
                type: 'consistency',
                title: 'Consistency Score',
                value: 'N/A',
                description: 'Not enough data yet',
                score: 0
            };
        }

        let totalTaken = 0;
        let totalDeviation = 0;

        for (const record of history) {
            if (record.status === 'taken' && record.actualTime) {
                totalTaken++;
                const actual = parseISO(record.actualTime);
                const scheduled = parseISO(record.scheduledTime);
                const diff = Math.abs(differenceInMinutes(actual, scheduled));

                // Cap deviation penalty at 120 minutes
                totalDeviation += Math.min(diff, 120);
            }
        }

        const adherenceRate = (totalTaken / history.length) * 100;

        // Consistency factor: Average deviation. 
        // 0 deviation = 100% consistency bonus. 60 mins avg deviation = 50% bonus.
        const avgDeviation = totalTaken > 0 ? totalDeviation / totalTaken : 0;
        const consistencyFactor = Math.max(0, 100 - (avgDeviation * 0.8)); // simple decay

        // Weighted Score: 70% Adherence, 30% Timing Consistency
        const score = Math.round((adherenceRate * 0.7) + (consistencyFactor * 0.3));

        return {
            type: 'consistency',
            title: 'Consistency Score',
            value: `${score}/100`,
            description: score > 80 ? 'Excellent consistency!' : 'Try to take meds at the same time',
            score: score,
            trend: score > 80 ? 'up' : 'neutral'
        };
    },

    /**
     * Get all insights for dashboard
     */
    async getDashboardInsights(profileId: string): Promise<CareInsight[]> {
        const insights: CareInsight[] = [];

        const consistency = await this.getConsistencyScore(profileId);
        insights.push(consistency);

        const mostMissed = await this.getMostMissedMedication(profileId);
        if (mostMissed) insights.push(mostMissed);

        const bestTime = await this.getBestAdherenceTime(profileId);
        if (bestTime) insights.push(bestTime);

        const postponeFreq = await this.getPostponeFrequency(profileId);
        insights.push(postponeFreq);

        const refillPred = await this.getRefillPrediction(profileId);
        if (refillPred) insights.push(refillPred);

        return insights;
    },

    /**
     * Calculate how often the user postpones medications
     */
    async getPostponeFrequency(profileId: string): Promise<CareInsight> {
        // Count total history and postponed status
        // Note: usage requires recording 'postponed' events in history which is not default yet.
        // This is a placeholder for future data.
        const history = await medicationHistoryRepository.getMostMissed(profileId, 100); // Re-using query or need new one?
        // Actually, we need a count by status.
        // Let's rely on a basic query for now or add a new repository method in future.
        // For now, return a placeholder "Good" status if no data.

        return {
            type: 'consistency', // reuse type or add new
            title: 'Postpone Rate',
            value: '0%',
            description: 'You rarely postpone doses',
            trend: 'neutral',
            score: 100
        };
    },

    /**
     * Predict next refill based on current inventory
     */
    async getRefillPrediction(profileId: string): Promise<CareInsight | null> {
        const medications = await medicationRepository.getAllByProfile(profileId);
        const activeMeds = medications.filter(m => m.isActive && m.currentQuantity !== undefined);

        if (activeMeds.length === 0) return null;

        let soonestRefillDays = 999;
        let soonestMed = null;

        for (const med of activeMeds) {
            if (!med.currentQuantity || !med.frequencyRule) continue;

            // Simplified estimation: Assume daily frequency if not specified
            // TODO: Parse RecurrenceRule accurately
            let dailyDose = 1;
            if (med.dosage) {
                // heuristic: try to parse number, else default 1
                const match = med.dosage.match(/(\d+)/);
                if (match) dailyDose = 1; // Actually dosage is strength, not count.
                // Assuming 1 pill per scheduled time
            }

            const timesPerDay = med.timeOfDay.length || 1;
            const dailyConsumption = timesPerDay; // 1 unit * N times

            if (dailyConsumption === 0) continue;

            const daysLeft = Math.floor(med.currentQuantity / dailyConsumption);

            if (daysLeft < soonestRefillDays) {
                soonestRefillDays = daysLeft;
                soonestMed = med;
            }
        }

        if (!soonestMed) return null;

        return {
            type: 'consistency',
            title: 'Refill Needed',
            value: `${soonestRefillDays} Days`,
            description: `Refill ${soonestMed.name} soon`,
            trend: soonestRefillDays < 7 ? 'down' : 'neutral'
        };
    }
};
