import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { useCreateGratitude } from '../../src/hooks/useGratitudes';
import * as Haptics from 'expo-haptics';
import { ZenAura } from '../../src/components/ui/ZenAura';

export default function GratitudeEntryScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    const { create, isLoading } = useCreateGratitude();

    const [content, setContent] = useState('');
    const [positivityLevel, setPositivityLevel] = useState(3);
    const [imageUri, setImageUri] = useState<string | undefined>(undefined);

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
                <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                    <Text style={[styles.saveButton, { color: isLoading ? colors.subtext : colors.primary }]}>
                        {t('common.save') || 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Wellness Animation Cue */}
                    <View style={styles.imageCueContainer}>
                        <ZenAura />
                    </View>

                    {/* Question Prompt */}
                    <Text style={[styles.question, { color: colors.text }]}>
                        {t('gratitude.question') || 'What makes you smile today?'}
                    </Text>

                    {/* Text Input */}
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                        placeholder={t('gratitude.placeholder') || 'I am grateful for...'}
                        placeholderTextColor={colors.subtext}
                        multiline
                        textAlignVertical="top"
                        value={content}
                        onChangeText={setContent}
                        autoFocus
                    />

                    {/* Positivity Level */}
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
                        {t('gratitude.positivityLevel') || 'Positivity Level'}
                    </Text>

                    <View style={styles.sliderContainer}>
                        <View style={styles.emojiRow}>
                            {emojis.map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        setPositivityLevel(index + 1);
                                        Haptics.selectionAsync();
                                    }}
                                    style={[
                                        styles.emojiContainer,
                                        positivityLevel === index + 1 && { transform: [{ scale: 1.2 }], backgroundColor: colors.card }
                                    ]}
                                >
                                    <Text style={styles.emoji}>{emoji}</Text>
                                    {positivityLevel === index + 1 && (
                                        <Text style={[styles.emojiLabel, { color: colors.primary }]}>
                                            {descriptions[index]}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Slider Visual (simplified as discrete selection above) */}
                        <View style={[styles.sliderTrack, { backgroundColor: colors.border }]}>
                            <View
                                style={[
                                    styles.sliderFill,
                                    {
                                        backgroundColor: colors.primary,
                                        width: `${(positivityLevel / 5) * 100}%`
                                    }
                                ]}
                            />
                        </View>
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
    input: {
        height: 150,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        marginBottom: 32,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 1,
    },
    sliderContainer: {
        marginBottom: 32,
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    emojiContainer: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
    },
    emoji: {
        fontSize: 32,
    },
    emojiLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
    },
    sliderTrack: {
        height: 8,
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    sliderFill: {
        height: '100%',
        borderRadius: 4,
    },
});
