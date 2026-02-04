import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useActiveProfile } from '../../src/hooks/useProfiles';

// Medication forms for selection
const MEDICATION_FORMS = [
    { key: 'tablet', emoji: '💊' },
    { key: 'capsule', emoji: '💊' },
    { key: 'liquid', emoji: '🧴' },
    { key: 'injection', emoji: '💉' },
    { key: 'patch', emoji: '🩹' },
    { key: 'cream', emoji: '🧴' },
    { key: 'drops', emoji: '💧' },
];

// Common time presets
const TIME_PRESETS = [
    { key: 'morning', time: '08:00', emoji: '🌅' },
    { key: 'afternoon', time: '12:00', emoji: '☀️' },
    { key: 'evening', time: '18:00', emoji: '🌆' },
    { key: 'night', time: '22:00', emoji: '🌙' },
];

export default function FirstMedicationScreen() {
    const { t } = useTranslation();
    const { activeProfile } = useActiveProfile();

    const [medicationName, setMedicationName] = useState('');
    const [dosage, setDosage] = useState('');
    const [selectedForm, setSelectedForm] = useState('tablet');
    const [selectedTimes, setSelectedTimes] = useState<string[]>(['08:00']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleTime = (time: string) => {
        if (selectedTimes.includes(time)) {
            if (selectedTimes.length > 1) {
                setSelectedTimes(selectedTimes.filter(t => t !== time));
            }
        } else {
            setSelectedTimes([...selectedTimes, time].sort());
        }
    };

    const handleSave = async () => {
        const trimmedName = medicationName.trim();

        if (!trimmedName) {
            setError(t('medication.nameRequired') ?? 'Please enter medication name');
            return;
        }

        if (!activeProfile) {
            setError('No active profile');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Import services dynamically
            const { calendarService } = await import('../../src/services');
            const { medicationRepository } = await import('../../src/repositories');

            // Create medication with all required fields
            const medication = await medicationRepository.create({
                profileId: activeProfile.id,
                name: trimmedName,
                dosage: dosage.trim() || undefined,
                form: selectedForm,
                timeOfDay: selectedTimes,
                frequencyRule: { frequency: 'daily', interval: 1 },
                isActive: true,
                hideName: false,
                refillThreshold: 5, // Default refill alert at 5 remaining
            });

            // Generate calendar events for the next 30 days
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            await calendarService.generateMedicationEvents(medication, startDate, endDate);

            // Navigate to completion/optional additions
            router.replace('/(tabs)');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save medication');
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
                        <Text style={styles.stepIndicator}>{t('onboarding.step', { current: 2, total: 3 })}</Text>
                        <Text style={styles.title}>{t('onboarding.addFirstMedication')}</Text>
                        <Text style={styles.subtitle}>{t('onboarding.medicationDescription')}</Text>
                    </View>

                    {/* Medication Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('medication.name')} *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('medication.namePlaceholder') ?? 'e.g., Aspirin, Vitamin D'}
                            placeholderTextColor="#6b7280"
                            value={medicationName}
                            onChangeText={(text) => {
                                setMedicationName(text);
                                setError(null);
                            }}
                            autoCapitalize="words"
                            editable={!isLoading}
                        />
                    </View>

                    {/* Dosage */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('medication.dosage')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 100mg, 1 tablet"
                            placeholderTextColor="#6b7280"
                            value={dosage}
                            onChangeText={setDosage}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Form Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('medication.form')}</Text>
                        <View style={styles.formGrid}>
                            {MEDICATION_FORMS.map((form) => (
                                <TouchableOpacity
                                    key={form.key}
                                    style={[
                                        styles.formOption,
                                        selectedForm === form.key && styles.formOptionSelected,
                                    ]}
                                    onPress={() => setSelectedForm(form.key)}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.formEmoji}>{form.emoji}</Text>
                                    <Text style={[
                                        styles.formLabel,
                                        selectedForm === form.key && styles.formLabelSelected,
                                    ]}>
                                        {t(`medication.forms.${form.key}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Time Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('medication.time')} *</Text>
                        <View style={styles.timeGrid}>
                            {TIME_PRESETS.map((preset) => (
                                <TouchableOpacity
                                    key={preset.key}
                                    style={[
                                        styles.timeOption,
                                        selectedTimes.includes(preset.time) && styles.timeOptionSelected,
                                    ]}
                                    onPress={() => toggleTime(preset.time)}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.timeEmoji}>{preset.emoji}</Text>
                                    <Text style={[
                                        styles.timeLabel,
                                        selectedTimes.includes(preset.time) && styles.timeLabelSelected,
                                    ]}>
                                        {t(`medication.times.${preset.key}`)}
                                    </Text>
                                    <Text style={styles.timeValue}>{preset.time}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </ScrollView>

                {/* Save Button */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            (!medicationName.trim() || isLoading) && styles.buttonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={!medicationName.trim() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>{t('onboarding.startTracking')}</Text>
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
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        color: '#ffffff',
    },
    formGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    formOption: {
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        minWidth: 80,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    formOptionSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#6366f120',
    },
    formEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    formLabel: {
        fontSize: 12,
        color: '#9ca3af',
    },
    formLabelSelected: {
        color: '#6366f1',
        fontWeight: '600',
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    timeOption: {
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        width: '48%',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    timeOptionSelected: {
        borderColor: '#10b981',
        backgroundColor: '#10b98120',
    },
    timeEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    timeLabel: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '500',
    },
    timeLabelSelected: {
        color: '#10b981',
    },
    timeValue: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
    },
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#1a1a2e',
    },
    button: {
        backgroundColor: '#10b981',
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
