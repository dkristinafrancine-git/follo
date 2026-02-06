import { medicationHistoryRepository } from '../repositories/medicationHistoryRepository';
import { medicationRepository } from '../repositories/medicationRepository';
import { differenceInMinutes, parseISO } from 'date-fns';

export interface CareInsight {
    type: 'most_missed' | 'best_time' | 'consistency' | 'streak';
    titleKey: string;
    value: string | number;
    descriptionKey: string;
    descriptionParams?: Record<string, string | number>;
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
            titleKey: 'careInsights.mostMissed.title',
            value: medication.name,
            descriptionKey: 'careInsights.mostMissed.description',
            descriptionParams: { count: missed[0].count },
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
        const periodKey = hour < 12 ? 'medication.times.morning' : hour < 17 ? 'medication.times.afternoon' : hour < 21 ? 'medication.times.evening' : 'medication.times.night';
        // We will need to translate the period when rendering, so we pass the key as a param
        // But wait, params usually take raw values. 
        // Better: let the UI translate the period? Or pass the key as a param and handle recursive translation?
        // Simpler: The description template is "You're most consistent in the {{period}}".
        // We can pass the period KEY if the translation system supports nested keys, but standard i18next usually expects values.
        // Option 3: Return English period and rely on it? No.
        // Option 4: "period" param will be the translation KEY itself, and we use a helper in UI?
        // Let's decide to pass the localized period string if we have access to t()? We don't here.
        // So we pass the key 'medication.times.morning' as a value for {{period}}?
        // No, that would show "medication.times.morning".
        // Solution: Change descriptionKey to take NO params for now, or assume UI handles it?

        // Revised Strategy:
        // Pass period as a raw string 'morning', 'afternoon' etc. (lowercase).
        // UI code will look up `medication.times.${period}`.
        // BUT description template expects {{period}}.
        // So we might need to modify the template to not include the variable, but that breaks flexibility.

        // Actually, we can just pass the key, and in the UI we detect if a param looks like a key? No.

        // Let's pass the raw key and let the COMPONENT translate the param before feeding it to the description t().

        const periodParam = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
        const formattedTime = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

        return {
            type: 'best_time',
            titleKey: 'careInsights.bestTime.title',
            value: formattedTime,
            descriptionKey: 'careInsights.bestTime.description',
            descriptionParams: { period: periodParam }, // UI must translate this param!
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
                titleKey: 'careInsights.consistency.title',
                value: 'N/A',
                descriptionKey: 'careInsights.consistency.noData',
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
            titleKey: 'careInsights.consistency.title',
            value: `${score}/100`,
            descriptionKey: score > 80 ? 'careInsights.consistency.excellent' : 'careInsights.consistency.improve',
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
        // Placeholder for future data.
        return {
            type: 'consistency',
            titleKey: 'careInsights.postponeRate.title',
            value: '0%',
            descriptionKey: 'careInsights.postponeRate.rarely',
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
            titleKey: 'careInsights.refill.title',
            value: `${soonestRefillDays} Days`,
            descriptionKey: 'careInsights.refill.needed',
            descriptionParams: { medication: soonestMed.name },
            trend: soonestRefillDays < 7 ? 'down' : 'neutral'
        };
    }
};
