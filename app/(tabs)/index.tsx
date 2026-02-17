import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, AppState, DeviceEventEmitter } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useProfiles, useActiveProfile } from '../../src/hooks/useProfiles';
import { useMedicationActions } from '../../src/hooks/useMedications';
import { useTheme } from '../../src/context/ThemeContext';
import { ProfileSelector } from '../../src/components/common/ProfileSelector';
import { DateCarousel, StatsSlider, EventCard } from '../../src/components/timeline';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { QuickActionSelector } from '../../src/components/ui/QuickActionSelector';
import * as Haptics from 'expo-haptics';
import { CalendarEvent } from '../../src/types';
import { useTimelineStats } from '../../src/hooks/useTimelineStats';

export default function TimelineScreen() {
    const { t } = useTranslation();
    const { profiles } = useProfiles();
    const { activeProfile, setActiveProfile } = useActiveProfile();

    // State
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [overdueEvents, setOverdueEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Stats
    const { stats, refresh: refreshStats } = useTimelineStats(activeProfile?.id || null);

    // FAB Modal State
    const [showFabMenu, setShowFabMenu] = useState(false);

    // Load events for selected date
    const loadEvents = useCallback(async () => {
        if (!activeProfile) return;

        try {
            setIsLoading(true);
            const { calendarEventRepository } = await import('../../src/repositories');

            // 1. Load today's overdue events if viewing today or future
            const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            if (isToday) {
                const overdue = await calendarEventRepository.getOverdue(activeProfile.id);
                setOverdueEvents(overdue);
            } else {
                setOverdueEvents([]);
            }

            // 2. Load events for selected date
            // Format date as YYYY-MM-DD for getByDay
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const dayEvents = await calendarEventRepository.getByDay(activeProfile.id, dateStr);

            // Sort by scheduled time
            dayEvents.sort((a, b) =>
                new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
            );

            setEvents(dayEvents);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeProfile, selectedDate]);

    useEffect(() => {
        loadEvents();

        // Listen for AppState changes (background -> foreground)
        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                loadEvents();
            }
        });

        // Listen for events from NotificationService
        const eventSubscription = DeviceEventEmitter.addListener('REFRESH_TIMELINE', () => {
            console.log('Received REFRESH_TIMELINE event');
            loadEvents();
            refreshStats();
        });

        return () => {
            appStateSubscription.remove();
            eventSubscription.remove();
        };
    }, [loadEvents]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadEvents(), refreshStats()]);
        setRefreshing(false);
    };

    const handleAddProfile = () => {
        router.push('/onboarding/profile' as Href);
    };

    const { markTaken, markSkipped, markPostponed } = useMedicationActions(activeProfile?.id || null);

    const handleEventComplete = async (event: CalendarEvent) => {
        try {
            if (event.eventType === 'medication_due' || event.eventType === 'supplement_due') {
                await markTaken(event.sourceId, event.scheduledTime);
            } else {
                // For non-medication events (e.g., appointments, activities), just update calendar status
                const { calendarEventRepository } = await import('../../src/repositories');
                await calendarEventRepository.update(event.id, {
                    status: 'completed',
                    completedTime: new Date().toISOString(),
                });
            }
            await loadEvents();
        } catch (error) {
            console.error('Failed to complete event:', error);
        }
    };

    const handleEventSkip = async (event: CalendarEvent) => {
        try {
            if (event.eventType === 'medication_due' || event.eventType === 'supplement_due') {
                await markSkipped(event.sourceId, event.scheduledTime);
            } else {
                const { calendarEventRepository } = await import('../../src/repositories');
                await calendarEventRepository.update(event.id, { status: 'skipped' });
            }
            await loadEvents();
        } catch (error) {
            console.error('Failed to skip event:', error);
        }
    };

    const handleEventPostpone = async (event: CalendarEvent, minutes: number) => {
        try {
            await markPostponed(event.sourceId, event.scheduledTime, minutes);
            await loadEvents();
        } catch (error) {
            console.error('Failed to postpone event:', error);
        }
    };

    // Separate pending and completed events
    const overdueIds = new Set(overdueEvents.map(e => e.id));
    const pendingEvents = events.filter(e => e.status === 'pending' && !overdueIds.has(e.id));
    const completedEvents = events.filter(e => e.status !== 'pending');

    const handleFabPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowFabMenu(true);
    };

    const navigateTo = (path: Href) => {
        setShowFabMenu(false);
        router.push(path);
    };

    /** Route to the correct detail screen based on event type */
    const navigateToEvent = (event: CalendarEvent) => {
        switch (event.eventType) {
            case 'medication_due':
                router.push(`/medication/${event.sourceId}`);
                break;
            case 'supplement_due':
                router.push(`/supplement/${event.sourceId}`);
                break;
            case 'appointment':
                router.push(`/medication/${event.sourceId}`);
                break;
            default:
                // activity, gratitude, symptom → generic summary
                router.push({ pathname: '/event-summary', params: { id: event.id } });
                break;
        }
    };

    const { colors, isHighContrast } = useTheme();

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        subtext: { color: colors.subtext },
        actionsheet: {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: isHighContrast ? 2 : 0
        },
        actionItem: {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: isHighContrast ? 1 : 0
        },
        fab: {
            backgroundColor: colors.primary,
            borderWidth: isHighContrast ? 2 : 0,
            borderColor: '#fff'
        },
        fabText: { color: '#ffffff' },
        emptyState: {
            backgroundColor: colors.card
        }
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            {/* ... existing ScrollView ... */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
                }
            >
                {/* Profile Selector */}
                <ProfileSelector
                    profiles={profiles}
                    activeProfile={activeProfile}
                    onSelectProfile={setActiveProfile}
                    onAddProfile={handleAddProfile}
                />

                {/* Date Carousel */}
                <DateCarousel
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />

                {/* Stats Slider */}
                <StatsSlider
                    adherenceRate={stats.adherenceRate}
                    activitiesThisWeek={stats.activitiesThisWeek}
                    currentStreak={stats.currentStreak}
                    todayTaken={stats.todayTaken}
                    todayTotal={stats.todayTotal}
                    upcomingMeds={stats.upcomingMeds}
                />

                {/* Overdue Events */}
                {!isLoading && overdueEvents.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.overdueHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.danger || '#ef4444' }]}>
                                {t('timeline.overdue') || 'Overdue'} ({overdueEvents.length})
                            </Text>
                        </View>
                        {overdueEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onPress={() => navigateToEvent(event)}
                                onComplete={() => handleEventComplete(event)}
                                onSkip={() => handleEventSkip(event)}
                                onPostpone={(minutes) => handleEventPostpone(event, minutes)}
                            />
                        ))}
                    </View>
                )}

                {/* Upcoming Events */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.subtext]}>
                        {t('timeline.upcoming')} ({pendingEvents.length})
                    </Text>
                    {isLoading ? (
                        <>
                            <Skeleton height={100} style={{ marginBottom: 12, borderRadius: 16 }} />
                            <Skeleton height={100} style={{ marginBottom: 12, borderRadius: 16 }} />
                            <Skeleton height={100} style={{ marginBottom: 12, borderRadius: 16 }} />
                        </>
                    ) : pendingEvents.length > 0 ? (
                        pendingEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onPress={() => navigateToEvent(event)}
                                onComplete={() => handleEventComplete(event)}
                                onSkip={() => handleEventSkip(event)}
                                onPostpone={(minutes) => handleEventPostpone(event, minutes)}
                            />
                        ))
                    ) : (
                        <View style={[styles.emptyState, dynamicStyles.actionsheet]}>
                            <Text style={[styles.emptyText, dynamicStyles.text]}>{t('timeline.noUpcoming')}</Text>
                        </View>
                    )}
                </View>

                {/* Completed Today */}
                {!isLoading && completedEvents.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.subtext]}>
                            {t('timeline.history')} ({completedEvents.length})
                        </Text>
                        {completedEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onPress={() => navigateToEvent(event)}
                            />
                        ))}
                    </View>
                )}

                {/* Quick Actions FAB area placeholder */}
                <View style={styles.quickActionsPlaceholder} />
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, dynamicStyles.fab]}
                onPress={handleFabPress}
                accessibilityRole="button"
                accessibilityLabel={t('accessibility.actions.add') || 'Add new item'}
                accessibilityHint={t('accessibility.hints.doubleTapToView') || 'Opens the add menu'}
            >
                <Text style={[styles.fabText, dynamicStyles.fabText]}>+</Text>
            </TouchableOpacity>

            {/* FAB Action Sheet Modal */}
            <QuickActionSelector
                isOpen={showFabMenu}
                onClose={() => setShowFabMenu(false)}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginTop: 8,
    },
    overdueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyState: {
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
    },
    quickActionsPlaceholder: {
        height: 80,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 10,
    },
    fabText: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '300',
    },
});
