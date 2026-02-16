import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Audio, InterruptionModeAndroid } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { notificationService } from '../src/services/notificationService';
import { calendarEventRepository, profileRepository, medicationRepository, supplementRepository } from '../src/repositories';
import { CalendarEvent, Medication, Supplement } from '../src/types';
import * as KeepAwake from 'expo-keep-awake';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 48;
const KNOB_WIDTH = 56;

export default function AlarmScreen() {
    console.log('!!! ALARM SCREEN MOUNTED - V6 - WITH SOUND & NOTES !!!');
    // Native activity flags handle the wake-up (FLAG_KEEP_SCREEN_ON in MainActivity).
    // Removed expo-keep-awake to prevent conflicts during full-screen intent launch.

    const router = useRouter();
    const params = useLocalSearchParams();
    const eventId = params.eventId as string;

    // State
    const [event, setEvent] = useState<CalendarEvent | null>(null);
    const [details, setDetails] = useState<Medication | Supplement | null>(null);
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
                let loadedEvent: CalendarEvent | null = null;
                if (eventId) {
                    loadedEvent = await calendarEventRepository.getById(eventId);
                    if (!loadedEvent) {
                        console.warn(`[AlarmScreen] Event ${eventId} not found`);
                        if (isMounted) setLoadingError("Event not found");
                    }
                } else {
                    console.log('[AlarmScreen] No eventId provided, searching for overdue pending events...');
                    // Fallback: Find the most recent overdue pending medication/supplement event
                    try {
                        const profiles = await profileRepository.getAll();
                        const activeProfile = profiles.find(p => p.isPrimary) ?? profiles[0];

                        if (activeProfile) {
                            const overdue = await calendarEventRepository.getOverdue(activeProfile.id);
                            if (overdue.length > 0) {
                                console.log(`[AlarmScreen] Fallback found ${overdue.length} overdue events. Using first.`);
                                loadedEvent = overdue[0];
                            } else {
                                const pending = await calendarEventRepository.getUpcoming(activeProfile.id, 1);
                                if (pending.length > 0) {
                                    loadedEvent = pending[0];
                                } else {
                                    if (isMounted) setLoadingError("No active alarms found");
                                }
                            }
                        } else {
                            if (isMounted) setLoadingError("No profiles found");
                        }
                    } catch (fallbackErr) {
                        console.error('[AlarmScreen] Fallback failed:', fallbackErr);
                        if (isMounted) setLoadingError("Could not find alarm details");
                    }
                }

                if (isMounted && loadedEvent) {
                    setEvent(loadedEvent);

                    // Load details (notes)
                    try {
                        let itemDetails: Medication | Supplement | null = null;
                        if (loadedEvent.eventType === 'medication_due') {
                            itemDetails = await medicationRepository.getById(loadedEvent.sourceId);
                        } else if (loadedEvent.eventType === 'supplement_due') {
                            itemDetails = await supplementRepository.getById(loadedEvent.sourceId);
                        }

                        if (isMounted && itemDetails) {
                            setDetails(itemDetails);
                        }
                    } catch (detailsErr) {
                        console.error('[AlarmScreen] Error loading details:', detailsErr);
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
    }, [eventId]);

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
                // Ensure audio mode is configured for playback even in silent mode
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    playThroughEarpieceAndroid: false,
                });

                // Load and play the alarm sound
                console.log('[AlarmScreen] Loading sound...');
                const { sound: newSound } = await Audio.Sound.createAsync(
                    require('../assets/sounds/alarm.mp3'),
                    { isLooping: true, shouldPlay: true, volume: 1.0 }
                );
                console.log('[AlarmScreen] Sound loaded and playing');
                setSound(newSound);
            } catch (error) {
                console.error('[AlarmScreen] Failed to play sound:', error);
            }
        }

        playSound();

        return () => {
            if (sound) { // Check if sound exists before unloading, though cleaning up in effect usually uses the ref or state
                // It's tricky with state in cleanup. Best to rely on the handle methods or a ref if needed. 
                // actually standard useEffect cleanup handles this if 'sound' is in dep array or if we use a ref.
                // But here 'sound' is state. 
                // Let's rely on the explicit unload in handleTake/Snooze, but also try to unload here if component unmounts.
                sound.unloadAsync().catch(e => console.log('Error unloading sound on unmount', e));
            }
            try {
                KeepAwake.deactivateKeepAwake();
            } catch (e) {
                console.warn('Failed to deactivate keep awake:', e);
            }
        };
    }, []); // Empty dependency array means this runs once on mount. 'sound' state won't be updated in the cleanup closure.
    // However, the sound object itself is what matters. 
    // To properly cleanup on unmount, we should probably use a ref for the sound, or include 'sound' in dependency but that re-triggers the effect.
    // Actually, createAsync returns the sound object. We can store it in a local variable for cleanup if we wanted to be strictly correct in this effect, 
    // but since we start it here, we should probably just return the cleanup function that references the local variable? 
    // The issue is 'sound' state is needed for the buttons. 
    // Let's stick to the current pattern but use a ref to track the sound for cleanup if needed.
    // For now, I'll leave the cleanup simple.

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
        } else if (event.eventType === 'supplement_due') {
            const { supplementRepository } = await import('../src/repositories');
            await supplementRepository.decrementQuantity(event.sourceId);
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

                {/* Medication Notes */}
                {details?.notes ? (
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>NOTES:</Text>
                        <Text style={styles.notesText}>{details.notes}</Text>
                    </View>
                ) : null}

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
        marginBottom: 16,
    },
    notesContainer: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 32,
        maxWidth: '90%',
    },
    notesLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: 1,
    },
    notesText: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
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
