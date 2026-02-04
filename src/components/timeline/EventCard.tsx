import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { CalendarEvent } from '../../types';

interface EventCardProps {
    event: CalendarEvent;
    subtitle?: string;
    onPress?: () => void;
    onComplete?: () => void;
    onSkip?: () => void;
}

export function EventCard({ event, subtitle, onPress, onComplete, onSkip }: EventCardProps) {
    const { t } = useTranslation();

    const getEventStyle = () => {
        switch (event.eventType) {
            case 'medication_due':
                return { color: '#6366f1', icon: '💊' };
            case 'supplement_due':
                return { color: '#10b981', icon: '💊' };
            case 'appointment':
                return { color: '#f59e0b', icon: '📅' };
            case 'activity':
                return { color: '#ef4444', icon: '🏃' };
            default:
                return { color: '#9ca3af', icon: '📌' };
        }
    };

    const getStatusStyle = () => {
        switch (event.status) {
            case 'completed':
                return { color: '#10b981', text: t('medication.status.taken') };
            case 'missed':
                return { color: '#ef4444', text: t('medication.status.missed') };
            case 'skipped':
                return { color: '#f59e0b', text: t('medication.status.skipped') };
            default:
                return { color: '#9ca3af', text: '' };
        }
    };

    const eventStyle = getEventStyle();
    const statusStyle = getStatusStyle();
    const scheduledTime = new Date(event.scheduledTime);
    const isPending = event.status === 'pending';
    const isOverdue = isPending && new Date() > scheduledTime;

    const handleComplete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete?.();
    };

    const handleSkip = () => {
        Haptics.selectionAsync();
        onSkip?.();
    };

    return (
        <TouchableOpacity
            style={[styles.container, isOverdue && styles.containerOverdue]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.timeIndicator, { backgroundColor: eventStyle.color + '40' }]}>
                <Text style={[styles.timeText, { color: eventStyle.color }]}>
                    {format(scheduledTime, 'HH:mm')}
                </Text>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.icon}>{eventStyle.icon}</Text>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
                        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                    </View>
                </View>

                {!isPending ? (
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.color + '20' }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
                    </View>
                ) : (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                            <Text style={styles.skipButtonText}>{t('common.skip') ?? 'Skip'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.completeButton, { backgroundColor: eventStyle.color }]}
                            onPress={handleComplete}
                        >
                            <Text style={styles.completeButtonText}>✓</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {isOverdue && (
                <View style={styles.overdueIndicator}>
                    <Text style={styles.overdueText}>⚠️</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    containerOverdue: {
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    timeIndicator: {
        minWidth: 56,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    icon: {
        fontSize: 24,
        marginRight: 10,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skipButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    skipButtonText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '500',
    },
    completeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
    overdueIndicator: {
        position: 'absolute',
        top: -6,
        right: -6,
    },
    overdueText: {
        fontSize: 14,
    },
});
