/**
 * Add Supplement Screen
 * Modal screen for adding a new supplement
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SupplementForm } from '../../src/components/forms/SupplementForm';
import { useCreateSupplement } from '../../src/hooks/useSupplements';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { CreateSupplementInput } from '../../src/types';

export default function AddSupplementScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const { activeProfile } = useActiveProfile();
    const { create, isLoading, error } = useCreateSupplement();

    const handleSubmit = useCallback(
        async (data: CreateSupplementInput) => {
            if (!activeProfile) return;

            try {
                const fullData = {
                    ...data,
                    profileId: activeProfile.id,
                };

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

    if (!activeProfile) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        presentation: 'modal',
                        title: t('supplement.addTitle') || 'Add Supplement',
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
                    title: t('supplement.addTitle') || 'Add Supplement',
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#fff',
                }}
            />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <SupplementForm
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
        backgroundColor: '#1a1a2e',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
