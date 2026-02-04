/**
 * Appointment Details/Edit Screen
 * View and edit appointment details, delete appointment
 */

import { useState, useCallback } from 'react';
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
import { AppointmentForm } from '../../src/components/forms/AppointmentForm';
import {
    useAppointment,
    useUpdateAppointment,
    useDeleteAppointment,
} from '../../src/hooks/useAppointments';
import { UpdateAppointmentInput } from '../../src/types';

export default function AppointmentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const router = useRouter();

    // Appointment data
    const { appointment, isLoading: loadingApt, error } = useAppointment(id || null);
    const { update, isLoading: updating } = useUpdateAppointment();
    const { deleteAppointment, isLoading: deleting } = useDeleteAppointment();

    // UI state
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Handle edit submission
    const handleSubmit = useCallback(
        async (data: Partial<UpdateAppointmentInput>) => {
            if (!id) return;
            try {
                // Ensure required types for update
                await update(id, data as UpdateAppointmentInput);
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
            await deleteAppointment(id);
            if (router.canDismiss()) {
                router.dismiss();
            } else {
                router.back();
            }
        } catch (err) {
            Alert.alert(
                t('common.error'),
                err instanceof Error ? err.message : t('common.error')
            );
        }
    }, [id, deleteAppointment, router, t]);

    // Loading state
    if (loadingApt) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: t('appointment.detailsTitle') || 'Appointment',
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

    // Error state
    if (!appointment) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Appointment',
                        headerStyle: { backgroundColor: '#1a1a2e' },
                        headerTintColor: '#fff',
                    }}
                />
                <SafeAreaView style={styles.container} edges={['bottom']}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Appointment not found</Text>
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
                        title: t('appointment.editTitle') || 'Edit Appointment',
                        headerStyle: { backgroundColor: '#1a1a2e' },
                        headerTintColor: '#fff',
                    }}
                />
                <SafeAreaView style={styles.container} edges={['bottom']}>
                    <AppointmentForm
                        initialValues={appointment}
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
                    title: t('appointment.detailsTitle') || 'Appointment Details',
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#fff',
                }}
            />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {/* Appointment Info Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.icon}>🩺</Text>
                            <View style={styles.cardHeaderInfo}>
                                <Text style={styles.title}>{appointment.title}</Text>
                                <Text style={styles.dateTime}>
                                    {format(new Date(appointment.scheduledTime), 'EEEE, MMMM d, yyyy')}
                                </Text>
                                <Text style={styles.timeDuration}>
                                    {format(new Date(appointment.scheduledTime), 'h:mm a')} • {appointment.duration} min
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoGrid}>
                            {appointment.doctorName && (
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>{t('appointment.doctor')}</Text>
                                    <Text style={styles.infoValue}>{appointment.doctorName}</Text>
                                </View>
                            )}
                            {appointment.specialty && (
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>{t('appointment.specialty')}</Text>
                                    <Text style={styles.infoValue}>{appointment.specialty}</Text>
                                </View>
                            )}
                            {appointment.location && (
                                <View style={styles.infoItemFull}>
                                    <Text style={styles.infoLabel}>{t('appointment.location')}</Text>
                                    <Text style={styles.infoValue}>{appointment.location}</Text>
                                </View>
                            )}
                            {appointment.reason && (
                                <View style={styles.infoItemFull}>
                                    <Text style={styles.infoLabel}>{t('appointment.reason')}</Text>
                                    <Text style={styles.infoValue}>{appointment.reason}</Text>
                                </View>
                            )}
                        </View>

                        {appointment.notes && (
                            <View style={styles.notesSection}>
                                <Text style={styles.notesLabel}>{t('appointment.notes')}</Text>
                                <Text style={styles.notesText}>{appointment.notes}</Text>
                            </View>
                        )}

                        {appointment.checklist && appointment.checklist.length > 0 && (
                            <View style={styles.checklistSection}>
                                <Text style={styles.checklistLabel}>{t('appointment.checklist') || 'Pre-appointment Checklist'}</Text>
                                {appointment.checklist.map((item, index) => (
                                    <View key={index} style={styles.checklistItemView}>
                                        <Text style={styles.checklistItemBullet}>•</Text>
                                        <Text style={styles.checklistItemContent}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setShowDeleteModal(true)}
                    >
                        <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setMode('edit')}
                    >
                        <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Delete Confirmation Modal */}
                <Modal visible={showDeleteModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Delete Appointment?</Text>
                            <Text style={styles.modalText}>
                                {t('appointment.deleteConfirm') ||
                                    'Are you sure you want to delete this appointment? This action cannot be undone.'}
                            </Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={() => setShowDeleteModal(false)}
                                >
                                    <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalDeleteButton}
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
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    icon: {
        fontSize: 32,
        marginRight: 16,
        marginTop: 4,
    },
    cardHeaderInfo: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    dateTime: {
        fontSize: 16,
        color: '#4A90D9',
        fontWeight: '600',
        marginBottom: 4,
    },
    timeDuration: {
        fontSize: 14,
        color: '#9ca3af',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 16,
    },
    infoItem: {
        width: '45%',
    },
    infoItemFull: {
        width: '100%',
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
    checklistSection: {
        borderTopWidth: 1,
        borderTopColor: '#3f3f5a',
        paddingTop: 16,
        marginTop: 16,
    },
    checklistLabel: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    checklistItemView: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    checklistItemBullet: {
        color: '#4A90D9',
        marginRight: 8,
        fontSize: 16,
    },
    checklistItemContent: {
        fontSize: 15,
        color: '#d1d5db',
        flex: 1,
        lineHeight: 22,
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
