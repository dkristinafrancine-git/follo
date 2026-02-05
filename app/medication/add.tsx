/**
 * Add Medication Screen
 * Modal screen for creating a new medication
 */

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MedicationForm } from '../../src/components/forms/MedicationForm';
import { useCreateMedication } from '../../src/hooks/useMedications';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { CreateMedicationInput } from '../../src/types';

export default function AddMedicationScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams();

    const { activeProfile } = useActiveProfile();
    const { create, isLoading, error } = useCreateMedication(activeProfile?.id || null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Parse prefilled values from OCR Scan
    const prefilledValues: Partial<CreateMedicationInput> | undefined = params.prefilledName ? {
        name: params.prefilledName as string,
        dosage: params.prefilledDosage as string,
        form: params.prefilledForm as string,
        // Map frequency string to RecurrenceRule if possible (simplified default)
        frequencyRule: params.prefilledFrequency ? { frequency: 'daily' } : undefined,
    } : undefined;

    const handleSubmit = useCallback(
        async (data: Partial<CreateMedicationInput>) => {
            try {
                await create(data);
                setShowSuccess(true);

                // Show success briefly then navigate back
                setTimeout(() => {
                    // Navigate back to root or dismiss all modals
                    if (router.canDismiss()) {
                        router.dismissTo('/');
                    } else {
                        router.replace('/');
                    }
                }, 800);
            } catch (err) {
                Alert.alert(
                    t('common.error'),
                    err instanceof Error ? err.message : t('common.error'),
                    [{ text: 'OK' }]
                );
            }
        },
        [create, router, t]
    );

    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    const handleScan = () => {
        router.push('/medication/scan' as any);
    };

    // Loading state if no profile
    if (!activeProfile) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        presentation: 'modal',
                        title: t('medication.addTitle') || 'Add Medication',
                        headerStyle: { backgroundColor: '#1a1a2e' },
                        headerTintColor: '#fff',
                        headerRight: () => (
                            <Text
                                onPress={handleScan}
                                style={{ color: '#4A90D9', fontSize: 16, fontWeight: '600' }}
                            >
                                Scan
                            </Text>
                        ),
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

    // Success state
    if (showSuccess) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        presentation: 'modal',
                        title: t('medication.addTitle') || 'Add Medication',
                        headerStyle: { backgroundColor: '#1a1a2e' },
                        headerTintColor: '#fff',
                    }}
                />
                <SafeAreaView style={styles.container} edges={['bottom']}>
                    <View style={styles.successContainer}>
                        <Text style={styles.successIcon}>✓</Text>
                        <Text style={styles.successText}>
                            {t('medication.saveSuccess') || 'Medication saved successfully'}
                        </Text>
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
                    title: t('medication.addTitle') || 'Add Medication',
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#fff',
                    headerRight: () => (
                        <Text
                            onPress={handleScan}
                            style={{ color: '#4A90D9', fontSize: 16, fontWeight: '600' }}
                            accessibilityRole="button"
                            accessibilityLabel={t('medication.scanLabel') || 'Scan Label'}
                            accessibilityHint="Opens camera to scan medication label"
                        >
                            Scan Label
                        </Text>
                    ),
                }}
            />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <MedicationForm
                    key={prefilledValues ? 'prefilled' : 'manual'}
                    initialValues={prefilledValues}
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
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successIcon: {
        fontSize: 64,
        color: '#10b981',
        marginBottom: 16,
    },
    successText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
    },
});
