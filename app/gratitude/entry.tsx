import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, Dimensions, KeyboardAvoidingView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { useCreateGratitude } from '../../src/hooks/useGratitudes';
import * as Haptics from 'expo-haptics';
import { QuoteCarousel } from '../../src/components/ui/QuoteCarousel';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Matter from 'matter-js';

// Screen Dimensions for Physics World
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEART_RADIUS = 20;

const PhysicsWorld = ({ trigger }: { trigger: number }) => {
    const { colors } = useTheme();
    // Use a ref to store text input layout to dynamic positioning if needed, 
    // but for now we'll use fixed positioning relative to the container.

    // Physics State
    const [hearts, setHearts] = useState<any[]>([]);
    const engineRef = useRef<Matter.Engine | null>(null);
    const requestRef = useRef<number | null>(null);

    // Initialize Physics Engine
    useEffect(() => {
        const engine = Matter.Engine.create();
        engine.gravity.y = -0.3; // Negative gravity for floating up (balloons)
        engineRef.current = engine;

        // Create Constraints/Walls
        // Ceiling: The bottom of the text input area. 
        // Let's assume the input area ends around Y=250.
        // We will pass the ceiling Y position as a prop ideally, or hardcode for now based on layout.
        const ceilingY = 0;

        const ceiling = Matter.Bodies.rectangle(SCREEN_WIDTH / 2, ceilingY - 10, SCREEN_WIDTH, 20, {
            isStatic: true,
            label: 'Ceiling',
            restitution: 0.2
        });

        const leftWall = Matter.Bodies.rectangle(-10, 200, 20, 600, { isStatic: true });
        const rightWall = Matter.Bodies.rectangle(SCREEN_WIDTH + 10, 200, 20, 600, { isStatic: true });

        Matter.World.add(engine.world, [ceiling, leftWall, rightWall]);

        // Animation Loop
        const updateLoop = () => {
            Matter.Engine.update(engine, 1000 / 60);

            // Sync physics bodies to React state
            const bodies = Matter.Composite.allBodies(engine.world);
            const heartBodies = bodies.filter(b => b.label === 'Heart');

            setHearts(heartBodies.map(b => ({
                id: b.id,
                position: b.position,
                angle: b.angle
            })));

            requestRef.current = requestAnimationFrame(updateLoop);
        };

        updateLoop();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            Matter.Engine.clear(engine);
        };
    }, []);

    // Add Heart on Trigger
    useEffect(() => {
        if (trigger > 0 && engineRef.current) {
            // Spawn heart at the bottom center (where the button is approximately)
            // Relative to the PhysicsWorld view
            const startX = SCREEN_WIDTH / 2 + (Math.random() * 40 - 20);
            const startY = 300;

            const heart = Matter.Bodies.circle(startX, startY, HEART_RADIUS, {
                label: 'Heart',
                restitution: 0.8, // Bouncy
                friction: 0.005,
                frictionAir: 0.02,
                density: 0.04
            });

            // Add some initial random force/velocity for "jostling"
            Matter.Body.setVelocity(heart, {
                x: (Math.random() - 0.5) * 4,
                y: -3 - Math.random() * 2
            });

            Matter.World.add(engineRef.current.world, heart);

            // Cleanup heart after 10 seconds? or let them accumulate?
            // "do not show number" implies we just want the visual effect.
            // Let's keep them heavily for the fun interaction unless performance drops.
        }
    }, [trigger]);

    return (
        <View style={styles.physicsContainer} pointerEvents="none">
            {hearts.map((heart) => (
                <View
                    key={heart.id}
                    style={{
                        position: 'absolute',
                        left: heart.position.x - HEART_RADIUS,
                        top: heart.position.y - HEART_RADIUS,
                        width: HEART_RADIUS * 2,
                        height: HEART_RADIUS * 2,
                        transform: [{ rotate: `${heart.angle}rad` }],
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="heart" size={HEART_RADIUS * 2} color={colors.primary} />
                </View>
            ))}
        </View>
    );
};

// Animated Placeholder Component
const AnimatedPlaceholderInput = ({ value, onChangeText }: { value: string, onChangeText: (text: string) => void }) => {
    const { colors } = useTheme();
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const placeholders = [
        "my red pen, it's making me excited to write something again.",
        "the smell of rain on improved soil.",
        "a warm cup of coffee on a cold morning."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.inputContainer}>
            {value.length === 0 && (
                <Animated.Text
                    entering={FadeIn.duration(500)}
                    exiting={FadeOut.duration(500)}
                    key={placeholderIndex}
                    style={[styles.animatedPlaceholder, { color: colors.subtext }]}
                >
                    {placeholders[placeholderIndex]}
                </Animated.Text>
            )}
            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                placeholder={""}
                placeholderTextColor="transparent"
                multiline
                textAlignVertical="top"
                value={value}
                onChangeText={onChangeText}
                autoFocus
            />
        </View>
    );
};

export default function GratitudeEntryScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    const { create, isLoading } = useCreateGratitude();

    const [content, setContent] = useState('');
    const [heartTrigger, setHeartTrigger] = useState(0);
    const [positivityLevel, setPositivityLevel] = useState(1);

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert(t('common.error'), t('gratitude.enterContent') || 'Please write what made you smile.');
            return;
        }

        if (!activeProfile) return;

        try {
            await create({
                profileId: activeProfile.id,
                content: content.trim(),
                positivityLevel: positivityLevel,
                imageUri: undefined,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            console.error('Failed to save gratitude:', error);
            Alert.alert(t('common.error'), 'Failed to save gratitude entry.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {t('gratitude.title') || 'Gratitude Log'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/reminders/manage', params: { type: 'gratitude' } })}
                        style={{ marginRight: 16 }}
                    >
                        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                        <Text style={[styles.saveButton, { color: isLoading ? colors.subtext : colors.primary }]}>
                            {t('common.save') || 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.question, { color: colors.text }]}>
                        {t('gratitude.question') || "Today, I'm grateful for..."}
                    </Text>

                    <QuoteCarousel />

                    {/* Input Area */}
                    <View style={{ zIndex: 20 }}>
                        <AnimatedPlaceholderInput
                            value={content}
                            onChangeText={setContent}
                        />
                    </View>

                    {/* Physics Area (Hearts) - Placed below Input */}
                    <View style={styles.interactiveArea}>
                        {/* Physics World inside this container */}
                        <PhysicsWorld trigger={heartTrigger} />

                        {/* Heart Button */}
                        <TouchableOpacity
                            onPress={() => {
                                setHeartTrigger(prev => prev + 1);
                                setPositivityLevel(prev => Math.min(prev + 1, 10)); // Cap level just in case
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            }}
                            style={styles.heartButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="heart" size={80} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.heartLabel, { color: colors.subtext }]}>
                            {t('gratitude.tapHeartInstruction', 'Tap the heart as many times as you want to show your gratitude.')}
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        zIndex: 50,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        padding: 24,
    },
    question: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        position: 'relative',
        marginBottom: 0, // No margin bottom, physics area starts right after
        zIndex: 20,
    },
    animatedPlaceholder: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        fontSize: 16,
        fontStyle: 'italic',
        zIndex: 1,
        pointerEvents: 'none',
    },
    input: {
        height: 150,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        zIndex: 2,
        backgroundColor: 'white', // Ensure opaque background to cover hearts if they go under
    },
    interactiveArea: {
        height: 350, // Fixed height for the physics area
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end', // Button at bottom
        paddingBottom: 20,
        position: 'relative',
        overflow: 'hidden', // Clip hearts that might go outside?
        // borderStyle: 'dashed', borderWidth: 1, borderColor: 'red' // debug
    },
    physicsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    heartButton: {
        // Borderless, flat
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
    },
    heartLabel: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    }
});
