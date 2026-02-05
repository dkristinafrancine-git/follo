import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { Audio } from 'expo-av';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { notificationService } from '../src/services/notificationService';
import { calendarEventRepository } from '../src/repositories';
import { CalendarEvent } from '../src/types';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 48;
const KNOB_WIDTH = 56;

export default function AlarmScreen() {
    useKeepAwake(); // Keep screen on!
    const router = useRouter();
    const params = useLocalSearchParams();
    const eventId = params.eventId as string;

    // State
    const [event, setEvent] = useState<CalendarEvent | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Animation for Slider
    const translateX = useSharedValue(0);
    const isCompleted = useSharedValue(false);

    useEffect(() => {
        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Load event data
        if (eventId) {
            calendarEventRepository.getById(eventId).then(setEvent);
        }
    }, [eventId]);

    useEffect(() => {
        // Play Alarm Sound
        let soundObject: Audio.Sound;

        async function playSound() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                });

                // For MVP, we play a default system sound mechanism or just silent loop if asset missing.
                // Since we don't have a guaranteed asset, we'll log for now.
                // In a real app, 'require(...)' would point to a bundled mp3.
                console.log('Alarm sound would play here (looping)');

            } catch (error) {
                console.error('Failed to play alarm sound', error);
            }
        }

        playSound();

        return () => {
            // soundObject?.unloadAsync();
        };
    }, []);

    const handleTake = async () => {
        if (!event) return;

        // Stop sound logic here

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
        // sound?.stopAsync();
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

    if (!event) {
        return <View style={styles.container}><Text style={styles.loading}>Loading Alarm...</Text></View>;
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
