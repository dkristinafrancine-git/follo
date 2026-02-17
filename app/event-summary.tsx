/**
 * Event Summary Screen
 * Generic read-only summary for activity, gratitude, and symptom history logs.
 * Displays CalendarEvent metadata in a non-editable card format.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { CalendarEvent } from '../src/types';

/**
 * Map event types to accent colors used throughout the app
 */
const EVENT_COLORS: Record<string, string> = {
    activity: '#ef4444',
    gratitude: '#d946ef',
    symptom: '#f97316',
    supplement_due: '#10b981',
    medication_due: '#6366f1',
    appointment: '#f59e0b',
};

/**
 * Human-readable labels for event types
 */
const EVENT_LABELS: Record<string, string> = {
    activity: 'Activity',
    gratitude: 'Gratitude',
    symptom: 'Symptom',
    supplement_due: 'Supplement',
    medication_due: 'Medication',
    appointment: 'Appointment',
};

export default function EventSummaryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const { colors, isHighContrast } = useTheme();
    const [event, setEvent] = useState<CalendarEvent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadEvent() {
            if (!id) return;
            try {
                const { calendarEventRepository } = await import('../src/repositories');
                const found = await calendarEventRepository.getById(id);
                setEvent(found);
            } catch (error) {
                console.error('[EventSummary] Failed to load event:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadEvent();
    }, [id]);

    const accentColor = event ? (EVENT_COLORS[event.eventType] || colors.primary) : colors.primary;
    const eventLabel = event ? (EVENT_LABELS[event.eventType] || 'Event') : 'Event';

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                <Stack.Screen options={{
                    headerShown: true,
                    title: t('eventSummary.title') || 'Event Details',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // Not found
    if (!event) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                <Stack.Screen options={{
                    headerShown: true,
                    title: t('eventSummary.title') || 'Event Details',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }} />
                <View style={styles.center}>
                    <Text style={[styles.notFoundText, { color: colors.subtext }]}>
                        {t('eventSummary.notFound') || 'Event not found'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const scheduledTime = new Date(event.scheduledTime);
    const meta = (event.metadata || {}) as Record<string, unknown>;

    // Build detail rows from metadata
    const detailRows: { label: string; value: string }[] = [];

    // Type-specific fields
    if (event.eventType === 'gratitude' && meta.content) {
        detailRows.push({ label: t('eventSummary.content') || 'Entry', value: String(meta.content) });
    }

    if (event.eventType === 'symptom') {
        if (meta.severity !== undefined && meta.severity !== null) {
            detailRows.push({
                label: t('symptom.severityLabel') || 'Severity',
                value: `${t('symptom.level', { count: Number(meta.severity) })} (${meta.severity}/10)`,
            });
        }
    }

    if (event.eventType === 'activity') {
        if (meta.value !== undefined && meta.value !== null) {
            const unit = meta.unit ? ` ${meta.unit}` : '';
            detailRows.push({ label: t('eventSummary.value') || 'Value', value: `${meta.value}${unit}` });
        }
    }

    // Dosage (for supplement_due)
    if (meta.dosage) {
        detailRows.push({ label: t('medication.dosage') || 'Dosage', value: String(meta.dosage) });
    }

    // Notes (common across types)
    if (meta.notes) {
        detailRows.push({ label: t('common.notes') || 'Notes', value: String(meta.notes) });
    }

    // Status text
    const statusText = event.status === 'completed'
        ? (t('common.logged') || 'Logged')
        : event.status === 'skipped'
            ? (t('medication.status.skipped') || 'Skipped')
            : event.status === 'missed'
                ? (t('medication.status.missed') || 'Missed')
                : (t('accessibility.status.pending') || 'Pending');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen options={{
                headerShown: true,
                title: eventLabel,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header card */}
                <View style={[styles.headerCard, {
                    backgroundColor: colors.card,
                    borderColor: isHighContrast ? colors.border : 'transparent',
                    borderWidth: isHighContrast ? 2 : 0,
                }]}>
                    {/* Accent bar */}
                    <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                    <View style={styles.headerContent}>
                        {/* Title */}
                        <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

                        {/* Date & time */}
                        <Text style={[styles.dateTime, { color: colors.subtext }]}>
                            {format(scheduledTime, 'EEEE, MMMM d, yyyy')}
                        </Text>
                        <Text style={[styles.time, { color: accentColor }]}>
                            {format(scheduledTime, 'h:mm a')}
                        </Text>

                        {/* Status badge */}
                        <View style={[styles.statusBadge, {
                            backgroundColor: isHighContrast ? '#333' : accentColor + '20',
                        }]}>
                            <Text style={[styles.statusText, {
                                color: isHighContrast ? colors.text : accentColor,
                            }]}>
                                {statusText}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Detail rows */}
                {detailRows.length > 0 && (
                    <View style={[styles.detailsCard, {
                        backgroundColor: colors.card,
                        borderColor: isHighContrast ? colors.border : 'transparent',
                        borderWidth: isHighContrast ? 2 : 0,
                    }]}>
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
                            {t('eventSummary.details') || 'Details'}
                        </Text>
                        {detailRows.map((row, index) => (
                            <View key={index} style={[
                                styles.detailRow,
                                index < detailRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                            ]}>
                                <Text style={[styles.detailLabel, { color: colors.subtext }]}>
                                    {row.label}
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {row.value}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notFoundText: {
        fontSize: 16,
    },
    scrollContent: {
        padding: 16,
    },
    headerCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    accentBar: {
        height: 4,
        width: '100%',
    },
    headerContent: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    dateTime: {
        fontSize: 14,
        marginBottom: 2,
    },
    time: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    detailsCard: {
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    detailRow: {
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        lineHeight: 22,
    },
});
