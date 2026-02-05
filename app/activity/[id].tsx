/**
 * Activity Details Screen
 * View activity details and delete
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
import { useActivity, useDeleteActivity } from '../../src/hooks/useActivities';
import { ActivityType } from '../../src/types';

// Activity Types with Icons and info (duplicated for display logic)
const ACTIVITY_INFO: Record<string, { icon: string; color: string; label: string }> = {
    water: { icon: '💧', color: '#3b82f6', label: 'Water' },
    exercise: { icon: '🏃', color: '#ef4444', label: 'Exercise' },
    sleep: { icon: '😴', color: '#8b5cf6', label: 'Sleep' },
    mood: { icon: '😊', color: '#f59e0b', label: 'Mood' },
    symptom: { icon: '🤒', color: '#10b981', label: 'Symptom' },
    custom: { icon: '📝', color: '#6b7280', label: 'Other' },
};

const MOODS = ['😞', '😐', '🙂', '😊', '🤩'];

export default function ActivityDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const router = useRouter();

    const { activity, isLoading: loadingActivity } = useActivity(id || null);
    const { deleteActivity, isLoading: deleting } = useDeleteActivity();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!id) return;
        try {
            await deleteActivity(id);
            if (router.canDismiss()) {
                router.dismiss();
            } else {
                router.back();
            }
        } catch (err) {
            Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
        }
    }, [id, deleteActivity, router, t]);

    if (loadingActivity) {
        return (
            <>
                <Stack.Screen options={{ headerShown: true, title: 'Activity', headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }} />
                <SafeAreaView style={styles.container}>
                    <ActivityIndicator size="large" color="#4A90D9" />
                </SafeAreaView>
            </>
        );
    }

    if (!activity) {
        return (
            <>
                <Stack.Screen options={{ headerShown: true, title: 'Activity', headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }} />
                <SafeAreaView style={styles.container}>
                    <Text style={styles.errorText}>Activity not found</Text>
                </SafeAreaView>
            </>
        );
    }

    const typeInfo = ACTIVITY_INFO[activity.type as string] || ACTIVITY_INFO.custom;

    // Helper to format value display
    const renderValue = () => {
        switch (activity.type) {
            case 'mood':
                const moodIndex = (activity.value || 0) - 1;
                return (
                    <View style={styles.moodValueContainer}>
                        <Text style={{ fontSize: 48 }}>{MOODS[moodIndex] || '?'}</Text>
                        <Text style={styles.valueText}>{activity.value}/5</Text>
                    </View>
                );
            case 'sleep':
                return (
                    <Text style={styles.valueText}>
                        {activity.value} {t('common.hours') || 'hours'}
                    </Text>
                );
            default:
                if (activity.value !== undefined && activity.value !== null) {
                    return (
                        <Text style={styles.valueText}>
                            {activity.value} {activity.unit}
                        </Text>
                    );
                }
                return null;
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: t('activity.detailsTitle') || 'Activity Details',
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#fff',
                }}
            />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, { backgroundColor: typeInfo.color }]}>
                                <Text style={styles.icon}>{typeInfo.icon}</Text>
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.typeLabel}>{typeInfo.label}</Text>
                                <Text style={styles.date}>
                                    {format(new Date(activity.startTime), 'MMM d, yyyy • h:mm a')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.body}>
                            {renderValue()}

                            {activity.endTime && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>{t('activity.sleepEnd') || 'End Time'}:</Text>
                                    <Text style={styles.text}>
                                        {format(new Date(activity.endTime), 'h:mm a')}
                                    </Text>
                                </View>
                            )}

                            {activity.notes && (
                                <View style={styles.notesSection}>
                                    <Text style={styles.label}>{t('activity.notes') || 'Notes'}</Text>
                                    <Text style={styles.notesText}>{activity.notes}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setShowDeleteModal(true)}
                    >
                        <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Delete Confirmation Modal */}
                <Modal visible={showDeleteModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Delete Activity?</Text>
                            <Text style={styles.modalText}>
                                Are you sure you want to delete this log? This cannot be undone.
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
    content: {
        padding: 20,
    },
    errorText: {
        color: '#9ca3af',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    card: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    icon: {
        fontSize: 28,
    },
    headerText: {
        flex: 1,
    },
    typeLabel: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: '#9ca3af',
    },
    body: {
        gap: 16,
    },
    valueText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginVertical: 12,
    },
    moodValueContainer: {
        alignItems: 'center',
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#3f3f5a',
    },
    label: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    text: {
        fontSize: 16,
        color: '#ffffff',
    },
    notesSection: {
        marginTop: 8,
        backgroundColor: '#3f3f5a',
        padding: 12,
        borderRadius: 8,
    },
    notesText: {
        fontSize: 15,
        color: '#d1d5db',
        lineHeight: 22,
    },
    footer: {
        padding: 20,
        backgroundColor: '#1a1a2e',
        borderTopWidth: 1,
        borderTopColor: '#252542',
    },
    deleteButton: {
        backgroundColor: '#3f3f5a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
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
