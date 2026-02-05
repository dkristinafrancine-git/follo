/**
 * Medication Details/Edit Screen
 * View and edit medication details, delete medication
 */

import { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { MedicationForm } from '../../src/components/forms/MedicationForm';
import {
    useMedication,
    useUpdateMedication,
    useDeleteMedication,
} from '../../src/hooks/useMedications';
import { medicationHistoryRepository } from '../../src/repositories';
import { MedicationHistory, UpdateMedicationInput } from '../../src/types';
import { useTheme } from '../../src/context/ThemeContext';

export default function MedicationDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();

    // Medication data
    const { medication, isLoading: loadingMed, error } = useMedication(id || null);
    const { update, isLoading: updating } = useUpdateMedication();
    const { deleteMedication, isLoading: deleting } = useDeleteMedication();

    // UI state
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [history, setHistory] = useState<MedicationHistory[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Load medication history
    useEffect(() => {
        if (id) {
            medicationHistoryRepository.getByMedication(id, 7).then(setHistory);
        }
    }, [id]);

    // Handle edit submission
    const handleSubmit = useCallback(
        async (data: Partial<UpdateMedicationInput>) => {
            if (!id) return;
            try {
                await update(id, data);
                setMode('view');
            } catch (err) {
                Alert.alert(
                    t('common.error'),
                    err instanceof Error ? err.message : t('common.error')
                );
            }
        },
        [id, update, t]
    );

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!id) return;
        try {
            await deleteMedication(id);
            router.back();
        } catch (err) {
            Alert.alert(
                t('common.error'),
                err instanceof Error ? err.message : t('common.error')
            );
        }
    }, [id, deleteMedication, router, t]);

    // Loading state
    if (loadingMed) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: t('medication.editTitle') || 'Medication',
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

    // Error state
    if (!medication) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Medication',
                        headerStyle: { backgroundColor: '#1a1a2e' },
                        headerTintColor: '#fff',
                    }}
                />
                <SafeAreaView style={styles.container} edges={['bottom']}>
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: colors.subtext }]}>Medication not found</Text>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    // Edit mode
    if (mode === 'edit') {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: t('medication.editTitle') || 'Edit Medication',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                    <MedicationForm
                        initialValues={medication}
                        onSubmit={handleSubmit}
                        onCancel={() => setMode('view')}
                        isLoading={updating}
                        mode="edit"
                    />
                </SafeAreaView>
            </>
        );
    }

    // View mode
    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: medication.name,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Medication Info Card */}
                    <View style={[styles.card, { backgroundColor: colors.card }]} accessibilityRole="summary" accessibilityLabel={`${medication.name}, ${medication.dosage || ''}`}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.pillIcon} accessibilityLabel="Medication Icon">💊</Text>
                            <View style={styles.cardHeaderInfo}>
                                <Text style={[styles.medicationName, { color: colors.text }]} accessibilityRole="header">{medication.name}</Text>
                                {medication.dosage && (
                                    <Text style={[styles.medicationDosage, { color: colors.primary }]}>{medication.dosage}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoGrid} accessibilityRole="list">
                            {medication.form && (
                                <View style={styles.infoItem} accessible={true} accessibilityLabel={`${t('medication.form')}: ${medication.form}`}>
                                    <Text style={[styles.infoLabel, { color: colors.subtext }]}>{t('medication.form')}</Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]}>{medication.form}</Text>
                                </View>
                            )}
                            <View style={styles.infoItem} accessible={true} accessibilityLabel={`${t('medication.frequency')}: ${medication.frequencyRule?.frequency || 'Daily'}`}>
                                <Text style={[styles.infoLabel, { color: colors.subtext }]}>{t('medication.frequency')}</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {medication.frequencyRule?.frequency || 'Daily'}
                                </Text>
                            </View>
                            <View style={styles.infoItem} accessible={true} accessibilityLabel={`${t('medication.time')}: ${medication.timeOfDay.join(', ')}`}>
                                <Text style={[styles.infoLabel, { color: colors.subtext }]}>{t('medication.time')}</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>
                                    {medication.timeOfDay.join(', ')}
                                </Text>
                            </View>
                            {medication.currentQuantity !== undefined && (
                                <View style={styles.infoItem} accessible={true} accessibilityLabel={`${t('medication.currentQuantity')}: ${medication.currentQuantity} remaining`}>
                                    <Text style={[styles.infoLabel, { color: colors.subtext }]}>{t('medication.currentQuantity')}</Text>
                                    <Text style={[
                                        styles.infoValue,
                                        { color: colors.text },
                                        medication.currentQuantity <= medication.refillThreshold && { color: colors.warning }
                                    ]}>
                                        {medication.currentQuantity} remaining
                                    </Text>
                                </View>
                            )}
                        </View>

                        {medication.notes && (
                            <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
                                <Text style={[styles.notesLabel, { color: colors.subtext }]}>{t('medication.notes')}</Text>
                                <Text style={[styles.notesText, { color: colors.text }]}>{medication.notes}</Text>
                            </View>
                        )}
                    </View>

                    {/* Recent History */}
                    <View style={[styles.historySection, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent History</Text>
                        {history.length === 0 ? (
                            <Text style={styles.emptyHistory}>No history yet</Text>
                        ) : (
                            history.map(entry => (
                                <View key={entry.id} style={styles.historyItem}>
                                    <View style={[
                                        styles.historyDot,
                                        entry.status === 'taken' && styles.historyDotTaken,
                                        entry.status === 'missed' && styles.historyDotMissed,
                                        entry.status === 'skipped' && styles.historyDotSkipped,
                                    ]} />
                                    <View style={styles.historyInfo}>
                                        <Text style={[styles.historyDate, { color: colors.subtext }]}>
                                            {format(new Date(entry.scheduledTime), 'MMM d, HH:mm')}
                                        </Text>
                                        <Text style={[
                                            styles.historyStatus,
                                            entry.status === 'taken' && { color: colors.success },
                                            entry.status === 'missed' && { color: colors.danger },
                                            entry.status === 'skipped' && { color: colors.warning },
                                        ]}>
                                            {t(`medication.status.${entry.status}`)}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={[styles.actions, { backgroundColor: colors.background, borderTopColor: colors.card }]}>
                    <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: colors.card }]}
                        onPress={() => setShowDeleteModal(true)}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.delete') || 'Delete'}
                        accessibilityHint="Deletes this medication"
                    >
                        <Text style={[styles.deleteButtonText, { color: colors.danger }]}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: colors.primary }]}
                        onPress={() => setMode('edit')}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.edit') || 'Edit'}
                        accessibilityHint="Edits this medication"
                    >
                        <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Delete Confirmation Modal */}
                <Modal visible={showDeleteModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Medication?</Text>
                            <Text style={[styles.modalText, { color: colors.subtext }]}>
                                {t('medication.deleteConfirm') ||
                                    'Are you sure you want to delete this medication? This action cannot be undone.'}
                            </Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalCancelButton, { backgroundColor: colors.background }]}
                                    onPress={() => setShowDeleteModal(false)}
                                >
                                    <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('common.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalDeleteButton, { backgroundColor: colors.danger }]}
                                    onPress={handleDelete}
                                    disabled={deleting}
                                >
                                    <Text style={styles.modalDeleteText}>
                                        {deleting ? '...' : t('common.delete')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    pillIcon: {
        fontSize: 40,
        marginRight: 16,
    },
    cardHeaderInfo: {
        flex: 1,
    },
    medicationName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
    },
    medicationDosage: {
        fontSize: 16,
        color: '#4A90D9',
        marginTop: 4,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    infoItem: {
        width: '50%',
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    infoValueWarning: {
        color: '#f59e0b',
    },
    notesSection: {
        borderTopWidth: 1,
        borderTopColor: '#3f3f5a',
        paddingTop: 16,
    },
    notesLabel: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    notesText: {
        fontSize: 15,
        color: '#d1d5db',
        lineHeight: 22,
    },
    historySection: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 16,
    },
    emptyHistory: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        paddingVertical: 24,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    historyDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#6b7280',
        marginRight: 12,
    },
    historyDotTaken: {
        backgroundColor: '#10b981',
    },
    historyDotMissed: {
        backgroundColor: '#ef4444',
    },
    historyDotSkipped: {
        backgroundColor: '#f59e0b',
    },
    historyInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyDate: {
        fontSize: 14,
        color: '#d1d5db',
    },
    historyStatus: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
    },
    historyStatusTaken: {
        color: '#10b981',
    },
    historyStatusMissed: {
        color: '#ef4444',
    },
    historyStatusSkipped: {
        color: '#f59e0b',
    },
    actions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#1a1a2e',
        borderTopWidth: 1,
        borderTopColor: '#252542',
    },
    deleteButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#3f3f5a',
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
    editButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#4A90D9',
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 15,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#3f3f5a',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    modalDeleteButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#ef4444',
        alignItems: 'center',
    },
    modalDeleteText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
});

