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
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring, SharedValue } from 'react-native-reanimated';
import Matter from 'matter-js';

// Screen Dimensions for Physics World
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEART_RADIUS = 20;

// Individual Heart Component for optimized rendering
const Heart = ({ id, engineRef, onRegister, onUnregister }: {
    id: string,
    engineRef: React.MutableRefObject<Matter.Engine | null>,
    onRegister: (id: string, svs: any) => void,
    onUnregister: (id: string) => void
}) => {
    const { colors } = useTheme();

    // SharedValues for high-performance animation
    const x = useSharedValue(SCREEN_WIDTH / 2); // Default center
    const y = useSharedValue(300); // Default bottom
    const r = useSharedValue(0);

    useEffect(() => {
        // Find the body corresponding to this Heart (by React ID)
        if (!engineRef.current) return;

        const bodies = Matter.Composite.allBodies(engineRef.current.world);
        const body = bodies.find((b: any) => b.reactId === id);

        if (body) {
            // Sync initial position
            x.value = body.position.x;
            y.value = body.position.y;
            r.value = body.angle;

            // Register SharedValues for updates
            onRegister(id, { x, y, r });
        }

        return () => {
            onUnregister(id);
        };
    }, []);

    const style = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: x.value - HEART_RADIUS },
                { translateY: y.value - HEART_RADIUS },
                { rotate: `${r.value}rad` }
            ]
        };
    });

    return (
        <Animated.View style={[styles.heartParticle, style]}>
            <Ionicons name="heart" size={HEART_RADIUS * 2} color={colors.primary} />
        </Animated.View>
    );
};

const PhysicsWorld = ({ trigger, height }: { trigger: number, height: number }) => {
    // Physics State - Refs for stability in loop
    const engineRef = useRef<Matter.Engine | null>(null);
    const requestRef = useRef<number | null>(null);

    // List of heart/body IDs to render
    const [heartIds, setHeartIds] = useState<string[]>([]);

    // Map of heart ID -> SharedValues
    const heartSharedValues = useRef<{ [key: string]: { x: SharedValue<number>, y: SharedValue<number>, r: SharedValue<number> } }>({});

    // Initialize Physics Engine
    useEffect(() => {
        const engine = Matter.Engine.create();
        engine.gravity.y = -0.3; // Negative gravity for floating up (balloons)
        engineRef.current = engine;

        // Create Constraints/Walls
        const ceilingY = 0;
        const wallHeight = height * 2; // Make walls tall enough
        const centerY = height / 2;

        const ceiling = Matter.Bodies.rectangle(SCREEN_WIDTH / 2, ceilingY - 10, SCREEN_WIDTH, 20, {
            isStatic: true,
            label: 'Ceiling',
            restitution: 0.2
        });

        const leftWall = Matter.Bodies.rectangle(-10, centerY, 20, wallHeight, { isStatic: true });
        const rightWall = Matter.Bodies.rectangle(SCREEN_WIDTH + 10, centerY, 20, wallHeight, { isStatic: true });

        Matter.World.add(engine.world, [ceiling, leftWall, rightWall]);

        // Animation Loop - Runs on JS thread
        const updateLoop = () => {
            if (!engineRef.current) return;

            Matter.Engine.update(engineRef.current, 1000 / 60);

            // Sync physics bodies to SharedValues directly
            const bodies = Matter.Composite.allBodies(engineRef.current.world);

            bodies.forEach(b => {
                if (b.label === 'Heart' && (b as any).reactId) {
                    const sv = heartSharedValues.current[(b as any).reactId];
                    if (sv) {
                        sv.x.value = b.position.x;
                        sv.y.value = b.position.y;
                        sv.r.value = b.angle;
                    }
                }
            });

            requestRef.current = requestAnimationFrame(updateLoop);
        };

        updateLoop();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            Matter.Engine.clear(engine);
        };
    }, [height]); // Re-init on height change (though unlikely to change dynamically often)

    // Add Heart on Trigger
    useEffect(() => {
        if (trigger > 0 && engineRef.current) {
            const startX = SCREEN_WIDTH / 2 + (Math.random() * 40 - 20);
            const startY = height - 50; // Dynamic spawn point near bottom

            // Create physics body
            const heart = Matter.Bodies.circle(startX, startY, HEART_RADIUS, {
                label: 'Heart',
                restitution: 0.8,
                friction: 0.005,
                frictionAir: 0.02,
                density: 0.04
            });

            // Unique ID for React mapping
            const reactId = `heart-${Date.now()}-${Math.random()}`;
            (heart as any).reactId = reactId;

            Matter.Body.setVelocity(heart, {
                x: (Math.random() - 0.5) * 6, // Slightly more randomness
                y: -4 - Math.random() * 3
            });

            Matter.World.add(engineRef.current.world, heart);

            // Add to React state to mount the visual component
            setHeartIds(prev => [...prev, reactId]);

            // Cleanup logic (optional): Remove old hearts to prevent memory leaks if thousands are added
            if (heartIds.length > 50) {
                // We could implement FIFO cleanup here, but for now let's trust the user won't tap 1000 times
            }
        }
    }, [trigger, height]);

    const registerHeart = (id: string, svs: any) => {
        heartSharedValues.current[id] = svs;
    };

    const unregisterHeart = (id: string) => {
        delete heartSharedValues.current[id];
    };

    return (
        <View style={styles.physicsContainer} pointerEvents="none">
            {heartIds.map(id => (
                <Heart
                    key={id}
                    id={id}
                    engineRef={engineRef}
                    onRegister={registerHeart}
                    onUnregister={unregisterHeart}
                />
            ))}
        </View>
    );
};

// Animated Placeholder Component
const AnimatedPlaceholderInput = ({ value, onChangeText }: { value: string, onChangeText: (text: string) => void }) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const placeholders = [
        t('gratitude.placeholders.p1'),
        t('gratitude.placeholders.p2'),
        t('gratitude.placeholders.p3'),
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
    const [interactiveHeight, setInteractiveHeight] = useState(250);

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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
                <ScrollView contentContainerStyle={styles.content} bounces={false}>
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
                    <View
                        style={styles.interactiveArea}
                        onLayout={(e) => setInteractiveHeight(e.nativeEvent.layout.height)}
                    >
                        {/* Physics World inside this container */}
                        <PhysicsWorld trigger={heartTrigger} height={interactiveHeight} />

                        {/* Centered subtext in physics area */}
                        <View style={styles.centeredLabel} pointerEvents="none">
                            <Text style={[styles.heartLabel, { color: colors.subtext }]}>
                                {t('gratitude.tapHeartInstruction') || 'Tap as many times as you need to celebrate this moment.'}
                            </Text>
                        </View>

                        {/* Heart Button pinned to bottom */}
                        <TouchableOpacity
                            onPress={() => {
                                setHeartTrigger(prev => prev + 1);
                                setPositivityLevel(prev => Math.min(prev + 1, 10));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={styles.heartButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="heart" size={80} color={colors.primary} />
                        </TouchableOpacity>
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
        flexGrow: 1,
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
        marginBottom: 0,
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
        backgroundColor: 'white',
    },
    interactiveArea: {
        flex: 1,
        minHeight: 200,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 10,
        position: 'relative',
        overflow: 'visible',
    },
    centeredLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    physicsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    heartParticle: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: HEART_RADIUS * 2,
        height: HEART_RADIUS * 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
    },
    heartLabel: {
        marginTop: 0,
        fontSize: 14,
        textAlign: 'center',
    }
});
