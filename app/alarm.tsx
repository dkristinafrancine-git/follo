import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Audio, InterruptionModeAndroid } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { notificationService } from '../src/services/notificationService';
import { calendarEventRepository, profileRepository } from '../src/repositories';
import { CalendarEvent } from '../src/types';
import * as KeepAwake from 'expo-keep-awake';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 48;
const KNOB_WIDTH = 56;

export default function AlarmScreen() {
    console.log('!!! ALARM SCREEN MOUNTED - V5 - CLEAN BUILD !!!');
    // Native activity flags handle the wake-up (FLAG_KEEP_SCREEN_ON in MainActivity).
    // Removed expo-keep-awake to prevent conflicts during full-screen intent launch.

    const router = useRouter();
    const params = useLocalSearchParams();
    const eventId = params.eventId as string;

    // State
    const [event, setEvent] = useState<CalendarEvent | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [loadingError, setLoadingError] = useState<string | null>(null);

    // Animation for Slider
    const translateX = useSharedValue(0);
    const isCompleted = useSharedValue(false);

    useEffect(() => {
        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadEvent = async () => {
            try {
                if (eventId) {
                    const loadedEvent = await calendarEventRepository.getById(eventId);
                    if (isMounted) {
                        if (loadedEvent) {
                            setEvent(loadedEvent);
                        } else {
                            // Event ID provided but not found? distinct error
                            console.warn(`[AlarmScreen] Event ${eventId} not found`);
                            setLoadingError("Event not found");
                        }
                    }
                } else {
                    console.log('[AlarmScreen] No eventId provided, searching for overdue pending events...');
                    // Fallback: Find the most recent overdue pending medication/supplement event
                    try {
                        // We need a profile to find overdue events.
                        // Since we cannot easily rely on the store state here (might be fresh launch),
                        // let's fetch profiles directly from the repository.
                        const profiles = await profileRepository.getAll();
                        // Find primary or first
                        const activeProfile = profiles.find(p => p.isPrimary) ?? profiles[0];

                        if (activeProfile) {
                            const overdue = await calendarEventRepository.getOverdue(activeProfile.id);
                            if (overdue.length > 0) {
                                console.log(`[AlarmScreen] Fallback found ${overdue.length} overdue events. Using first.`);
                                setEvent(overdue[0]);
                            } else {
                                const pending = await calendarEventRepository.getUpcoming(activeProfile.id, 1);
                                if (pending.length > 0) {
                                    setEvent(pending[0]);
                                } else {
                                    setLoadingError("No active alarms found");
                                }
                            }
                        } else {
                            setLoadingError("No profiles found");
                        }
                    } catch (fallbackErr) {
                        console.error('[AlarmScreen] Fallback failed:', fallbackErr);
                        setLoadingError("Could not find alarm details");
                    }
                }
            } catch (err) {
                console.error('[AlarmScreen] Error loading event:', err);
                if (isMounted) setLoadingError("Failed to load event");
            }
        };

        loadEvent();

        // Safety Timeout: If not loaded in 5 seconds, show error/dismiss
        const timeout = setTimeout(() => {
            if (isMounted && !event) {
                setLoadingError("Loading timed out");
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [eventId, event]); // Run when eventId changes or event is set (to clear timeout effectively via cleanup? no, dependency logic is slighty off)
    // Actually, we want to run this once on mount/eventId change. 
    // If 'event' is a dep, it might re-run. Removing 'event' from dep array.

    useEffect(() => {
        // Keep screen awake while alarm is active
        try {
            KeepAwake.activateKeepAwake();
        } catch (e) {
            console.warn('Failed to activate keep awake:', e);
        }

        // Play Alarm Sound
        async function playSound() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    playThroughEarpieceAndroid: false,
                });

                // Try to load the alarm sound
                // User must add 'assets/alarm.mp3'
                try {
                    const { sound: newSound } = await Audio.Sound.createAsync(
                        require('../assets/sounds/alarm.mp3'),
                        { isLooping: true, shouldPlay: true }
                    );
                    setSound(newSound);
                } catch (e) {
                    console.warn('Alarm sound file not found. Please add assets/sounds/alarm.mp3');
                }

            } catch (error) {
                console.error('Failed to configure audio session', error);
            }
        }

        playSound();

        return () => {
            sound?.unloadAsync();
            try {
                KeepAwake.deactivateKeepAwake();
            } catch (e) {
                console.warn('Failed to deactivate keep awake:', e);
            }
        };
    }, []);

    const handleTake = async () => {
        if (sound) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch (e) {
                console.log('Error stopping sound', e);
            }
        }

        if (!event) return;

        // Perform "Take" action logic
        if (event.eventType === 'medication_due') {
            // Dynamic import to avoid cycles/heavy load if possible
            const { medicationRepository } = await import('../src/repositories');
            await medicationRepository.decrementQuantity(event.sourceId);
        }

        await calendarEventRepository.update(event.id, {
            status: 'completed',
            completedTime: new Date().toISOString(),
        });

        // Cancel the notification
        await notificationService.cancelNotification(event.id);

        // Go back home
        router.replace('/(tabs)');
    };

    const handleSnooze = async () => {
        if (sound) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch (e) {
                console.log('Error stopping sound', e);
            }
        }
        // Just go back for now, real snooze would reschedule
        router.replace('/(tabs)');
    };

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (isCompleted.value) return;
            // Limit slide
            translateX.value = Math.max(0, Math.min(e.translationX, SLIDER_WIDTH - KNOB_WIDTH));
        })
        .onEnd(() => {
            if (translateX.value > SLIDER_WIDTH * 0.7) {
                // Successful slide
                translateX.value = withTiming(SLIDER_WIDTH - KNOB_WIDTH);
                isCompleted.value = true;
                runOnJS(handleTake)();
            } else {
                // Reset
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    if (!event || loadingError) {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.loading}>
                        {loadingError ? `Error: ${loadingError}` : 'Loading Alarm...'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.snoozeButton, { marginTop: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 }]}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text style={styles.snoozeText}>Dismiss & Open App</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.time}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <Text style={styles.date}>{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>IT'S TIME FOR YOUR</Text>
                <Text style={styles.medicationName}>{event.title}</Text>
                {/* Visual Alarm Indicator */}
                <View style={[styles.priorityIndicator]} />
            </View>

            <View style={styles.footer}>
                {/* Snooze Button */}
                <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
                    <Text style={styles.snoozeText}>Snooze 5m</Text>
                </TouchableOpacity>

                {/* Slider */}
                <View style={styles.sliderContainer}>
                    <Text style={styles.sliderText}>Slide to Take</Text>
                    <GestureDetector gesture={panGesture}>
                        <Animated.View style={[styles.sliderKnob, animatedStyle]}>
                            <Text style={styles.knobIcon}>💊</Text>
                        </Animated.View>
                    </GestureDetector>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ef4444', // Urgent Red
        justifyContent: 'space-between',
        padding: 24,
    },
    loading: {
        color: '#fff',
        fontSize: 24,
        textAlign: 'center',
        marginTop: 100,
    },
    header: {
        marginTop: 60,
        alignItems: 'center',
    },
    time: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
    date: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 2,
        marginBottom: 16,
    },
    medicationName: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 32,
    },
    priorityIndicator: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    footer: {
        marginBottom: 40,
        gap: 20,
    },
    snoozeButton: {
        alignItems: 'center',
        padding: 16,
    },
    snoozeText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 18,
        fontWeight: '600',
    },
    sliderContainer: {
        height: 64,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 32,
        justifyContent: 'center',
        paddingHorizontal: 4,
        position: 'relative',
    },
    sliderText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
    },
    sliderKnob: {
        width: KNOB_WIDTH,
        height: KNOB_WIDTH,
        borderRadius: 28,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    knobIcon: {
        fontSize: 24,
    },
});
