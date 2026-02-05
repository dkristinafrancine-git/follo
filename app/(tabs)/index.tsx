import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, AppState, DeviceEventEmitter } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useProfiles, useActiveProfile } from '../../src/hooks/useProfiles';
import { useTheme } from '../../src/context/ThemeContext';
import { ProfileSelector } from '../../src/components/common/ProfileSelector';
import { DateCarousel, StatsSlider, EventCard } from '../../src/components/timeline';
import { Skeleton } from '../../src/components/ui/Skeleton';
import * as Haptics from 'expo-haptics';
import { CalendarEvent } from '../../src/types';

export default function TimelineScreen() {
    const { t } = useTranslation();
    const { profiles } = useProfiles();
    const { activeProfile, setActiveProfile } = useActiveProfile();

    // State
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Stats (would come from repositories in production)
    const [stats, setStats] = useState({
        adherenceRate: 0,
        activitiesThisWeek: 0,
        currentStreak: 0,
        upcomingMeds: 0,
    });

    // FAB Modal State
    const [showFabMenu, setShowFabMenu] = useState(false);

    // Load events for selected date
    const loadEvents = useCallback(async () => {
        if (!activeProfile) return;

        try {
            setIsLoading(true);
            const { calendarEventRepository } = await import('../../src/repositories');

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
        });

        return () => {
            appStateSubscription.remove();
            eventSubscription.remove();
        };
    }, [loadEvents]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadEvents();
        setRefreshing(false);
    };

    const handleAddProfile = () => {
        router.push('/onboarding/profile' as Href);
    };

    const handleEventComplete = async (eventId: string) => {
        try {
            const { calendarEventRepository } = await import('../../src/repositories');
            await calendarEventRepository.update(eventId, {
                status: 'completed',
                completedTime: new Date().toISOString(),
            });
            await loadEvents();
        } catch (error) {
            console.error('Failed to complete event:', error);
        }
    };

    const handleEventSkip = async (eventId: string) => {
        try {
            const { calendarEventRepository } = await import('../../src/repositories');
            await calendarEventRepository.update(eventId, { status: 'skipped' });
            await loadEvents();
        } catch (error) {
            console.error('Failed to skip event:', error);
        }
    };

    // Separate pending and completed events
    const pendingEvents = events.filter(e => e.status === 'pending');
    const completedEvents = events.filter(e => e.status !== 'pending');

    const handleFabPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowFabMenu(true);
    };

    const navigateTo = (path: Href) => {
        setShowFabMenu(false);
        router.push(path);
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
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
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
                    upcomingMeds={stats.upcomingMeds}
                />

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
                                onComplete={() => handleEventComplete(event.id)}
                                onSkip={() => handleEventSkip(event.id)}
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
                            <EventCard key={event.id} event={event} />
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
            {showFabMenu && (
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFabMenu(false)}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.close') || 'Close menu'}
                >
                    <View style={[styles.actionSheet, dynamicStyles.actionsheet]} accessibilityRole="menu">
                        <Text style={[styles.actionSheetTitle, dynamicStyles.text]} accessibilityRole="header">{t('common.add') || 'Add New'}</Text>

                        <TouchableOpacity
                            style={[styles.actionItem, dynamicStyles.actionItem]}
                            onPress={() => navigateTo('/medication/add' as Href)}
                            accessibilityRole="menuitem"
                            accessibilityLabel={t('accessibility.actions.addMedication')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#4A90D9' }]}>
                                <Text style={styles.actionIconText}>💊</Text>
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>{t('medication.addTitle') || 'Medication'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionItem, dynamicStyles.actionItem]}
                            onPress={() => navigateTo('/supplement/add' as Href)}
                            accessibilityRole="menuitem"
                            accessibilityLabel={t('supplement.addTitle') || 'Supplement'}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
                                <Text style={styles.actionIconText}>🧴</Text>
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>{t('supplement.addTitle') || 'Supplement'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionItem, dynamicStyles.actionItem]}
                            onPress={() => navigateTo('/appointment/add' as Href)}
                            accessibilityRole="menuitem"
                            accessibilityLabel={t('accessibility.actions.addAppointment')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf6' }]}>
                                <Text style={styles.actionIconText}>🩺</Text>
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>{t('appointment.addTitle') || 'Appointment'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionItem, dynamicStyles.actionItem]}
                            onPress={() => navigateTo('/activity/add' as Href)}
                            accessibilityRole="menuitem"
                            accessibilityLabel={t('accessibility.actions.addActivity')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.actionIconText}>🏃</Text>
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>{t('activity.addTitle') || 'Activity'}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}
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
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
        zIndex: 20,
    },
    actionSheet: {
        backgroundColor: '#252542',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    actionSheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#3f3f5a',
        padding: 16,
        borderRadius: 16,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionIconText: {
        fontSize: 20,
    },
    actionText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});
