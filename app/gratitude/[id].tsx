import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useGratitude, useUpdateGratitude, useDeleteGratitude } from '../../src/hooks/useGratitudes';
import * as Haptics from 'expo-haptics';
import Animated, { Keyframe } from 'react-native-reanimated';
import { useRef } from 'react';

// Define Keyframe for rising smoke (reused)
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    input: {
        height: 150,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        marginBottom: 32,
        borderWidth: 1,
    },
    viewContent: {
        fontSize: 18,
        lineHeight: 28,
        marginBottom: 32,
        padding: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    heartContainer: {
        alignItems: 'center',
        marginVertical: 24,
        position: 'relative',
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
    },
    deleteButton: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
        marginBottom: 16,
        textAlign: 'right',
    },
});

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

export default function GratitudeDetailScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { gratitude, isLoading: isFetching, error } = useGratitude(id!);
    const { update, isLoading: isUpdating } = useUpdateGratitude();
    const { remove, isLoading: isDeleting } = useDeleteGratitude();

    const [content, setContent] = useState('');
    const [positivityLevel, setPositivityLevel] = useState(3);
    const [imageUri, setImageUri] = useState<string | undefined>(undefined);
    const [isEditing, setIsEditing] = useState(false);

    // Particle System
    const [particles, setParticles] = useState<{ id: string }[]>([]);

    const addParticle = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setParticles(prev => [...prev, { id }]);
        if (particles.length > 20) setParticles(prev => prev.slice(1));
        setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 1000);
    };

    useEffect(() => {
        if (gratitude) {
            setContent(gratitude.content);
            setPositivityLevel(gratitude.positivityLevel);
            setImageUri(gratitude.imageUri);
        }
    }, [gratitude]);

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert(t('common.error'), t('gratitude.enterContent') || 'Please write what made you smile.');
            return;
        }

        try {
            await update(id!, {
                content: content.trim(),
                positivityLevel,
                imageUri,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update gratitude:', error);
            Alert.alert(t('common.error'), 'Failed to update gratitude entry.');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            t('common.delete'),
            t('gratitude.deleteConfirm') || 'Are you sure you want to delete this entry?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await remove(id!);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch (error) {
                            console.error('Failed to delete gratitude:', error);
                            Alert.alert(t('common.error'), 'Failed to delete gratitude entry.');
                        }
                    },
                },
            ]
        );
    };

    const emojis = ['😐', '🙂', '😊', '😁', '🤩'];
    const descriptions = ['Okay', 'Good', 'Great', 'Amazing', 'Incredible'];

    if (isFetching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error || !gratitude) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { justifyContent: 'flex-start' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <Text style={{ color: colors.text }}>
                        {t('common.error') || 'Error loading gratitude entry.'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isEditing ? (t('gratitude.edit') || 'Edit Entry') : (t('gratitude.details') || 'Details')}
                </Text>
                {isEditing ? (
                    <TouchableOpacity onPress={handleSave} disabled={isUpdating}>
                        <Text style={[styles.saveButton, { color: isUpdating ? colors.subtext : colors.primary }]}>
                            {t('common.save') || 'Save'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Text style={[styles.saveButton, { color: colors.primary }]}>
                            {t('common.edit') || 'Edit'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Timestamp */}
                    {!isEditing && (
                        <Text style={[styles.timestamp, { color: colors.subtext }]}>
                            {new Date(gratitude.createdAt).toLocaleString()}
                        </Text>
                    )}

                    {/* Content */}
                    {isEditing ? (
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                            placeholder={t('gratitude.placeholder') || 'I am grateful for...'}
                            placeholderTextColor={colors.subtext}
                            multiline
                            textAlignVertical="top"
                            value={content}
                            onChangeText={setContent}
                        />
                    ) : (
                        <Text style={[styles.viewContent, { color: colors.text, backgroundColor: colors.card }]}>
                            {gratitude.content}
                        </Text>
                    )}

                    {/* Positivity Level (Heart Button) with Smoke Effect */}
                    <View style={styles.heartContainer}>
                        {/* Particles Render Layer */}
                        <View style={styles.particleLayer} pointerEvents="none">
                            {particles.map(p => (
                                <HeartSmoke key={p.id} id={p.id} onComplete={() => { }} />
                            ))}
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                if (isEditing) {
                                    setPositivityLevel(prev => prev + 1);
                                    addParticle();
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }
                            }}
                            disabled={!isEditing}
                            style={[
                                styles.heartButton,
                                { backgroundColor: colors.card },
                                !isEditing && { opacity: 0.9 }
                            ]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="heart" size={80} color={colors.primary} />
                            <View style={styles.heartBadge}>
                                <Text style={styles.heartCount}>{positivityLevel}</Text>
                            </View>
                        </TouchableOpacity>
                        {isEditing && (
                            <Text style={[styles.heartLabel, { color: colors.subtext }]}>
                                {t('gratitude.tapHeart') || 'Tap the heart to show how grateful you are!'}
                            </Text>
                        )}
                    </View>



                    {/* Delete Button */}
                    {isEditing && (
                        <TouchableOpacity
                            style={[styles.deleteButton, { borderColor: colors.danger }]}
                            onPress={handleDelete}
                            disabled={isDeleting}
                        >
                            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>
                                {isDeleting ? (t('common.deleting') || 'Deleting...') : (t('common.delete') || 'Delete Entry')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


