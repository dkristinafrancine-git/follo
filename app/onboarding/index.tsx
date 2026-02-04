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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useOnboarding } from '../../src/hooks/useProfiles';
import { getProfileAvatarUrl } from '../../src/services/avatarService';

export default function OnboardingScreen() {
    const { t } = useTranslation();
    const { createProfile } = useOnboarding();

    const [profileName, setProfileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate avatar preview based on current name
    const avatarUrl = profileName.trim()
        ? getProfileAvatarUrl(profileName.trim())
        : null;

    const handleContinue = async () => {
        const trimmedName = profileName.trim();

        if (!trimmedName) {
            setError(t('onboarding.nameRequired') || 'Please enter a name');
            return;
        }

        if (trimmedName.length < 2) {
            setError(t('onboarding.nameTooShort') || 'Name must be at least 2 characters');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            await createProfile(trimmedName);

            // Navigate to main app (tabs)
            router.replace('/(tabs)');
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
                <View style={styles.content}>
                    {/* Logo/Welcome Section */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🩺</Text>
                        <Text style={styles.title}>{t('onboarding.welcome')}</Text>
                        <Text style={styles.subtitle}>{t('onboarding.tagline')}</Text>
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
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Text style={styles.label}>{t('onboarding.profileName')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('onboarding.namePlaceholder') || 'Enter your name'}
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

                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                    </View>

                    {/* Continue Button */}
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

                    {/* Skip for now hint */}
                    <Text style={styles.hint}>
                        {t('onboarding.hint') || 'You can add more profiles later in Settings'}
                    </Text>
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
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
    form: {
        marginBottom: 24,
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
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 8,
    },
    button: {
        backgroundColor: '#6366f1',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        backgroundColor: '#3e3e5e',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    hint: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 14,
    },
});
