/**
 * Add Appointment Screen
 * Modal screen for creating a new appointment
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppointmentForm } from '../../src/components/forms/AppointmentForm';
import { useCreateAppointment } from '../../src/hooks/useAppointments';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { CreateAppointmentInput } from '../../src/types';

export default function AddAppointmentScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const { activeProfile } = useActiveProfile();
    const { create, isLoading, error } = useCreateAppointment();

    const handleSubmit = useCallback(
        async (data: Partial<CreateAppointmentInput>) => {
            if (!activeProfile) return;

            try {
                // Ensure profileId is set
                const fullData = {
                    ...data,
                    profileId: activeProfile.id,
                } as CreateAppointmentInput;

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
                        title: t('appointment.addTitle') || 'Add Appointment',
                        headerStyle: { backgroundColor: '#1a1a2e' },
                        headerTintColor: '#fff',
                    }}
                />
                <SafeAreaView style={styles.container} edges={['bottom']}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4A90D9" />
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
                    title: t('appointment.addTitle') || 'Add Appointment',
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#fff',
                }}
            />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <AppointmentForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                    mode="add"
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
