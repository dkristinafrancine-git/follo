import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useProfiles, useActiveProfile } from '../../src/hooks/useProfiles';
import { ProfileSelector } from '../../src/components/common/ProfileSelector';
import { DateCarousel, StatsSlider, EventCard } from '../../src/components/timeline';
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
    }, [loadEvents]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadEvents();
        setRefreshing(false);
    };

    const handleAddProfile = () => {
        router.push('/onboarding' as Href);
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
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
                    <Text style={styles.sectionTitle}>
                        {t('timeline.upcoming')} ({pendingEvents.length})
                    </Text>
                    {pendingEvents.length > 0 ? (
                        pendingEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onComplete={() => handleEventComplete(event.id)}
                                onSkip={() => handleEventSkip(event.id)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>{t('timeline.noUpcoming')}</Text>
                        </View>
                    )}
                </View>

                {/* Completed Today */}
                {completedEvents.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
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
                style={styles.fab}
                onPress={() => router.push('/medication/add' as Href)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
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
        color: '#9ca3af',
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
    },
    fabText: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '300',
    },
});
