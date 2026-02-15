import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
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
import Animated, { FadeIn, FadeOut, Keyframe } from 'react-native-reanimated';

// Animated Placeholder Component
const AnimatedPlaceholderInput = ({ value, onChangeText, placeholder: defaultPlaceholder }: { value: string, onChangeText: (text: string) => void, placeholder: string }) => {
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
    imageCueContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    imagePlaceholder: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imagePlaceholderText: {
        marginTop: 8,
        fontSize: 14,
    },
    question: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        position: 'relative',
        marginBottom: 32,
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
    },
    heartContainer: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative', // Context for absolute particles
        zIndex: 10,
    },
    particleLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    particle: {
        position: 'absolute',
    },
    heartButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 10,
    },
    heartBadge: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -10 }, { translateY: -12 }], // Center roughly over heart visual center
    },
    heartCount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    heartLabel: {
        marginTop: 16,
        fontSize: 14,
        textAlign: 'center',
    }
});

// Heart Particle Component
const HeartParticle = ({ id, onComplete }: { id: string, onComplete: (id: string) => void }) => {
    const { colors } = useTheme();
    const randomX = Math.random() * 60 - 30; // -30 to 30
    const randomRotate = Math.random() * 60 - 30; // -30deg to 30deg
    const randomScale = 0.5 + Math.random() * 0.5; // 0.5 to 1.0

    useEffect(() => {
        // Cleanup after animation duration (1000ms)
        const timeout = setTimeout(() => {
            onComplete(id);
        }, 1000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(500)}
            style={[
                styles.particle,
                {
                    transform: [
                        { translateX: randomX },
                        { rotate: `${randomRotate}deg` },
                        { scale: randomScale }
                    ]
                }
            ]}
        >
            <Animated.View
                entering={FadeIn.duration(200).withInitialValues({ transform: [{ translateY: 0 }] })}
                style={{
                    // ...
                }}
            >
                <Ionicons name="heart" size={24} color={colors.primary} style={{ opacity: 0.8 }} />
            </Animated.View>
        </Animated.View>
    );
};

// Define Keyframe for rising smoke
const SmokeRising = new Keyframe({
    0: {
        transform: [{ translateY: 0 }, { scale: 0.5 }],
        opacity: 0.8,
    },
    100: {
        transform: [{ translateY: -150 }, { scale: 1.2 }], // Float up 150px
        opacity: 0,
    },
});

const HeartSmoke = ({ id, onComplete }: { id: string, onComplete: (id: string) => void }) => {
    const { colors } = useTheme();
    // Randomize initial horizontal offset slightly
    const randomX = useRef(Math.random() * 80 - 40).current;

    return (
        <Animated.View
            entering={SmokeRising.duration(1000)}
            style={[
                styles.particle,
                {
                    left: '50%',
                    top: '50%',
                    marginLeft: randomX,
                    marginTop: -20, // Start slightly above center
                }
            ]}
        >
            <Ionicons name="heart" size={24} color={colors.primary} />
        </Animated.View>
    );
};


export default function GratitudeEntryScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    const { create, isLoading } = useCreateGratitude();

    const [content, setContent] = useState('');
    const [positivityLevel, setPositivityLevel] = useState(3);
    const [imageUri, setImageUri] = useState<string | undefined>(undefined);

    // Particle System State
    const [particles, setParticles] = useState<{ id: string }[]>([]);

    const addParticle = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setParticles(prev => [...prev, { id }]);

        // Auto-cleanup limit to prevent memory issues if spamming
        if (particles.length > 20) {
            setParticles(prev => prev.slice(1));
        }

        // Cleanup individual particle after animation
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== id));
        }, 1000);
    };

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
                positivityLevel,
                imageUri,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            console.error('Failed to save gratitude:', error);
            Alert.alert(t('common.error'), 'Failed to save gratitude entry.');
        }
    };

    const emojis = ['😐', '🙂', '😊', '😁', '🤩'];
    const descriptions = [
        'Okay',
        'Good',
        'Great',
        'Amazing',
        'Incredible'
    ];

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
                    {/* Wellness Animation Cue - Replaced with Quote Carousel */}
                    <QuoteCarousel />

                    {/* Question Prompt */}
                    <Text style={[styles.question, { color: colors.text }]}>
                        {t('gratitude.question') || "Today, I'm grateful for..."}
                    </Text>

                    {/* Text Input with Animated Placeholder */}
                    <AnimatedPlaceholderInput
                        value={content}
                        onChangeText={setContent}
                        placeholder={t('gratitude.placeholder') || "I am grateful for..."}
                    />

                    {/* Positivity Level (Heart Button) with Smoke Effect */}
                    <View style={styles.heartContainer}>
                        {/* Particles Render Layer - Behind or Over button? Over looks like smoke coming out. */}
                        <View style={styles.particleLayer} pointerEvents="none">
                            {particles.map(p => (
                                <HeartSmoke key={p.id} id={p.id} onComplete={() => { }} />
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setPositivityLevel(prev => prev + 1);
                                addParticle();
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }}
                            style={[styles.heartButton, { backgroundColor: colors.card }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="heart" size={80} color={colors.primary} />
                            <View style={styles.heartBadge}>
                                <Text style={styles.heartCount}>{positivityLevel}</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={[styles.heartLabel, { color: colors.subtext }]}>
                            {t('gratitude.tapHeart') || 'Tap the heart to show how grateful you are!'}
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
