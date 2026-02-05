import {
    initialize,
    requestPermission,
    readRecords,
    insertRecords,
    getGrantedPermissions,
} from 'react-native-health-connect';
import { Platform } from 'react-native';
import { activityRepository } from '../repositories/activityRepository';

export const healthConnectService = {
    /**
     * Check if Health Connect is available
     */
    async isAvailable(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            await initialize();
            return true;
        } catch (error) {
            console.warn('Health Connect not available:', error);
            return false;
        }
    },

    /**
     * Request permissions
     */
    async requestPermissions(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            await requestPermission([
                { accessType: 'read', recordType: 'Steps' },
                { accessType: 'read', recordType: 'ExerciseSession' },
                { accessType: 'read', recordType: 'Height' },
                { accessType: 'read', recordType: 'Weight' },
                // Add other types as needed
            ]);
            return true;
        } catch (error) {
            console.error('Failed to request Health Connect permissions:', error);
            return false;
        }
    },

    /**
     * Check if permissions are granted
     */
    async checkPermissions(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            const permissions = await getGrantedPermissions();
            return permissions.length > 0;
        } catch {
            return false;
        }
    },

    /**
     * Sync data from Health Connect to Follo
     * Uses "Last-Write-Wins" strategy (overwrites local daily total with HC data)
     */
    async syncData(profileId: string): Promise<void> {
        if (Platform.OS !== 'android') return;

        try {
            const hasPermissions = await this.checkPermissions();
            if (!hasPermissions) {
                console.log('Sync skipped: No permissions');
                return;
            }

            const today = new Date();
            const startTime = new Date(today);
            startTime.setHours(0, 0, 0, 0);
            const endTime = new Date(today);
            endTime.setHours(23, 59, 59, 999);

            // 1. Sync Steps
            const stepsResult = await readRecords('Steps', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                },
            });

            // result is { records: [...] }
            const stepsRecords = stepsResult.records || [];
            const totalSteps = stepsRecords.reduce((sum: number, record: any) => sum + (record.count || 0), 0);

            if (totalSteps > 0) {
                // Find existing steps entry for today
                const activities = await activityRepository.getByType(profileId, 'steps', 5);
                const todayStepEntry = activities.find(a => {
                    const aDate = new Date(a.startTime);
                    return aDate.getDate() === today.getDate() &&
                        aDate.getMonth() === today.getMonth() &&
                        aDate.getFullYear() === today.getFullYear();
                });

                if (todayStepEntry) {
                    await activityRepository.update(todayStepEntry.id, { value: totalSteps });
                    console.log('Updated steps:', totalSteps);
                } else {
                    await activityRepository.create({
                        profileId,
                        type: 'steps',
                        value: totalSteps,
                        unit: 'count',
                        startTime: new Date().toISOString(),
                        notes: 'Synced from Health Connect'
                    });
                    console.log('Created steps:', totalSteps);
                }
            }

            // 2. Sync Weight (most recent)
            const weightResult = await readRecords('Weight', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                },
            });

            const weightRecords = weightResult.records || [];

            if (weightRecords.length > 0) {
                // Take the last one as the current weight
                const lastWeight: any = weightRecords[weightRecords.length - 1];
                const weightKg = lastWeight.weight?.inKilograms || 0;

                const activities = await activityRepository.getByType(profileId, 'weight', 5);
                const todayWeightEntry = activities.find(a => {
                    const aDate = new Date(a.startTime);
                    return aDate.getDate() === today.getDate() &&
                        aDate.getMonth() === today.getMonth() &&
                        aDate.getFullYear() === today.getFullYear();
                });

                if (todayWeightEntry) {
                    await activityRepository.update(todayWeightEntry.id, { value: weightKg });
                } else {
                    await activityRepository.create({
                        profileId,
                        type: 'weight',
                        value: weightKg,
                        unit: 'kg',
                        startTime: lastWeight.time, // Use actual time from HC
                        notes: 'Synced from Health Connect'
                    });
                }
            }

        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
};
