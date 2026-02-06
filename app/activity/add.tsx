/**
 * Add Activity Screen
 * Modal screen for logging a new activity
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityForm } from '../../src/components/forms/ActivityForm';
import { useCreateActivity } from '../../src/hooks/useActivities';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { CreateActivityInput } from '../../src/types';
import { useTheme } from '../../src/context/ThemeContext';

export default function AddActivityScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors } = useTheme();

    const { activeProfile } = useActiveProfile();
    const { create, isLoading, error } = useCreateActivity();

    const handleSubmit = useCallback(
        async (data: Partial<CreateActivityInput>) => {
            if (!activeProfile) return;

            try {
                // Ensure profileId is set
                const fullData = {
                    ...data,
                    profileId: activeProfile.id,
                } as CreateActivityInput;

                await create(fullData);

                // Dismiss modal
                if (router.canDismiss()) {
                    router.dismiss();
                } else {
                    router.back();
                }
            } catch (err) {
                Alert.alert(
                    t('common.error'),
                    err instanceof Error ? err.message : t('common.error'),
                    [{ text: 'OK' }]
                );
            }
        },
        [create, activeProfile, router, t]
    );

    const handleCancel = useCallback(() => {
        if (router.canDismiss()) {
            router.dismiss();
        } else {
            router.back();
        }
    }, [router]);

    // Loading state if no profile
    if (!activeProfile) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        presentation: 'modal',
                        title: t('activity.addTitle') || 'Log Activity',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    presentation: 'modal',
                    title: t('activity.addTitle') || 'Log Activity',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                <ActivityForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
