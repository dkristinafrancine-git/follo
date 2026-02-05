/**
 * Supplement Details Screen
 * View/Edit supplement details
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
import { format, parse } from 'date-fns';
import { useSupplement, useDeleteSupplement, useUpdateSupplement } from '../../src/hooks/useSupplements';

export default function SupplementDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const router = useRouter();

    const { supplement, isLoading: loadingSupplement } = useSupplement(id || null);
    const { deleteSupplement, isLoading: deleting } = useDeleteSupplement();
    const { update: updateSupplement } = useUpdateSupplement();

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!id) return;
        try {
            await deleteSupplement(id);
            if (router.canDismiss()) {
                router.dismiss();
            } else {
                router.back();
            }
        } catch (err) {
            Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
        }
    }, [id, deleteSupplement, router, t]);

    const handleStockUpdate = async (change: number) => {
        if (!supplement || !id) return;
        const current = supplement.currentQuantity || 0;
        const newQuantity = Math.max(0, current + change);

        try {
            await updateSupplement(id, { currentQuantity: newQuantity });
            // Ideally refetch or optimistic update, but useSupplement hook should react if we trigger a refetch or if repository emits events
            // For now rely on basic re-render cycle or simple alert if failed
        } catch (err) {
            console.error('Failed to update stock', err);
        }
    };

    if (loadingSupplement) {
        return (
            <>
                <Stack.Screen options={{ headerShown: true, title: 'Supplement', headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }} />
                <SafeAreaView style={styles.container}>
                    <ActivityIndicator size="large" color="#4A90D9" />
                </SafeAreaView>
            </>
        );
    }

    if (!supplement) {
        return (
            <>
                <Stack.Screen options={{ headerShown: true, title: 'Supplement', headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }} />
                <SafeAreaView style={styles.container}>
                    <Text style={styles.errorText}>Supplement not found</Text>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: supplement.name,
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#fff',
                }}
            />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>💊</Text>
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.name}>{supplement.name}</Text>
                                <Text style={styles.dosage}>{supplement.dosage}</Text>
                            </View>
                        </View>

                        <View style={styles.body}>
                            <View style={styles.row}>
                                <Text style={styles.label}>{t('medication.schedule') || 'Schedule'}:</Text>
                                <Text style={styles.text}>
                                    {supplement.frequencyRule?.frequency === 'daily' ? 'Daily' : 'Weekly'}
                                </Text>
                            </View>

                            <View style={styles.timesList}>
                                {supplement.timeOfDay.map((time, i) => (
                                    <View key={i} style={styles.timeBadge}>
                                        <Text style={styles.timeText}>
                                            {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.stockSection}>
                                <Text style={styles.label}>{t('medication.stock') || 'Current Stock'}</Text>
                                <View style={styles.stockControls}>
                                    <TouchableOpacity
                                        style={styles.stockBtn}
                                        onPress={() => handleStockUpdate(-1)}
                                    >
                                        <Text style={styles.stockBtnText}>-</Text>
                                    </TouchableOpacity>

                                    <View style={styles.stockDisplay}>
                                        <Text style={styles.stockValue}>{supplement.currentQuantity || 0}</Text>
                                        {supplement.currentQuantity !== undefined && supplement.currentQuantity <= supplement.lowStockThreshold && (
                                            <Text style={styles.lowStockWarning}>{t('medication.lowStock') || 'Generic Low Stock'}</Text>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.stockBtn}
                                        onPress={() => handleStockUpdate(1)}
                                    >
                                        <Text style={styles.stockBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {supplement.notes && (
                                <View style={styles.notesSection}>
                                    <Text style={styles.label}>{t('common.notes') || 'Notes'}</Text>
                                    <Text style={styles.notesText}>{supplement.notes}</Text>
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
                            <Text style={styles.modalTitle}>Delete Supplement?</Text>
                            <Text style={styles.modalText}>
                                Are you sure you want to delete this supplement? This cannot be undone.
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
        backgroundColor: '#4A90D920',
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
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    dosage: {
        fontSize: 16,
        color: '#9ca3af',
    },
    body: {
        gap: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    text: {
        fontSize: 16,
        color: '#ffffff',
    },
    timesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: -8,
    },
    timeBadge: {
        backgroundColor: '#3f3f5a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    timeText: {
        color: '#fff',
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#3f3f5a',
        marginVertical: 8,
    },
    stockSection: {
        alignItems: 'center',
    },
    stockControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginTop: 12,
    },
    stockBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4A90D9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stockBtnText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        lineHeight: 28,
    },
    stockDisplay: {
        alignItems: 'center',
        minWidth: 80,
    },
    stockValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    lowStockWarning: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
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
