import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useOnboarding } from '../../src/hooks/useProfiles';
import { getProfileAvatarUrl } from '../../src/services/avatarService';
import { useTheme } from '../../src/context/ThemeContext';

export default function ProfileSetupScreen() {
    const { t } = useTranslation();
    const { createProfile } = useOnboarding();
    const { colors } = useTheme();

    const [profileName, setProfileName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate avatar preview based on current name
    const avatarUrl = profileName.trim()
        ? getProfileAvatarUrl(profileName.trim())
        : null;

    const handleContinue = async () => {
        const trimmedName = profileName.trim();

        if (!trimmedName) {
            setError(t('onboarding.nameRequired') ?? 'Please enter a name');
            return;
        }

        if (trimmedName.length < 2) {
            setError(t('onboarding.nameTooShort') ?? 'Name must be at least 2 characters');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            await createProfile(trimmedName, birthDate || undefined);

            // Navigate to permissions setup
            router.push('/onboarding/permissions' as Href);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.stepIndicator, { color: colors.primary }]}>{t('onboarding.step', { current: 1, total: 4 })}</Text>
                        <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.createProfile')}</Text>
                        <Text style={[styles.subtitle, { color: colors.subtext }]}>{t('onboarding.profileDescription')}</Text>
                    </View>

                    {/* Avatar Preview */}
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={[styles.avatar, { backgroundColor: colors.card }]}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
                                <Text style={styles.avatarPlaceholderText}>👤</Text>
                            </View>
                        )}
                        <Text style={[styles.avatarHint, { color: colors.subtext }]}>{t('onboarding.avatarHint')}</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.subtext }]}>{t('onboarding.profileName')} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: error ? colors.danger : 'transparent' }]}
                                placeholder={t('onboarding.namePlaceholder') ?? 'Enter your name'}
                                placeholderTextColor={colors.subtext}
                                value={profileName}
                                onChangeText={(text) => {
                                    setProfileName(text);
                                    setError(null);
                                }}
                                autoCapitalize="words"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.subtext }]}>{t('onboarding.birthDate')}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.subtext}
                                value={birthDate}
                                onChangeText={setBirthDate}
                                keyboardType="numbers-and-punctuation"
                                editable={!isLoading}
                            />
                            <Text style={[styles.inputHint, { color: colors.subtext }]}>{t('onboarding.birthDateHint')}</Text>
                        </View>

                        {error && (
                            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                        )}
                    </View>
                </ScrollView>

                {/* Continue Button */}
                <View style={[styles.bottomSection, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: colors.primary },
                            (!profileName.trim() || isLoading) && { backgroundColor: colors.border, opacity: 0.5 },
                        ]}
                        onPress={handleContinue}
                        disabled={!profileName.trim() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    header: {
        marginBottom: 24,
    },
    stepIndicator: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 48,
    },
    avatarHint: {
        fontSize: 13,
        marginTop: 8,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        borderWidth: 2,
    },
    inputHint: {
        fontSize: 13,
        marginTop: 6,
    },
    errorText: {
        fontSize: 14,
        marginTop: 8,
    },
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    button: {
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
});

