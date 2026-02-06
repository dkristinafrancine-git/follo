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

export default function ProfileSetupScreen() {
    const { t } = useTranslation();
    const { createProfile } = useOnboarding();

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
        <SafeAreaView style={styles.container}>
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
                        <Text style={styles.stepIndicator}>{t('onboarding.step', { current: 1, total: 4 })}</Text>
                        <Text style={styles.title}>{t('onboarding.createProfile')}</Text>
                        <Text style={styles.subtitle}>{t('onboarding.profileDescription')}</Text>
                    </View>

                    {/* Avatar Preview */}
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatar}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarPlaceholderText}>👤</Text>
                            </View>
                        )}
                        <Text style={styles.avatarHint}>{t('onboarding.avatarHint')}</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('onboarding.profileName')} *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('onboarding.namePlaceholder') ?? 'Enter your name'}
                                placeholderTextColor="#6b7280"
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
                            <Text style={styles.label}>{t('onboarding.birthDate')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#6b7280"
                                value={birthDate}
                                onChangeText={setBirthDate}
                                keyboardType="numbers-and-punctuation"
                                editable={!isLoading}
                            />
                            <Text style={styles.inputHint}>{t('onboarding.birthDateHint')}</Text>
                        </View>

                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                    </View>
                </ScrollView>

                {/* Continue Button */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            (!profileName.trim() || isLoading) && styles.buttonDisabled,
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
        backgroundColor: '#1a1a2e',
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
        color: '#6366f1',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
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
        backgroundColor: '#252542',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#252542',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarPlaceholderText: {
        fontSize: 48,
    },
    avatarHint: {
        fontSize: 13,
        color: '#6b7280',
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
        color: '#9ca3af',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        color: '#ffffff',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputHint: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 6,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 8,
    },
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#1a1a2e',
    },
    button: {
        backgroundColor: '#6366f1',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#3e3e5e',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
});
