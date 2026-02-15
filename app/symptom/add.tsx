import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { useTheme } from '../../src/context/ThemeContext';
import { useSymptoms } from '../../src/hooks/useSymptoms';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Toast } from '../../src/components/ui/Toast';

export default function AddSymptomScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    const { addSymptom, distinctNames, loadDistinctNames } = useSymptoms(activeProfile?.id);

    const [name, setName] = useState('');
    const [severity, setSeverity] = useState(5);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        if (activeProfile) {
            loadDistinctNames();
        }
    }, [activeProfile]);

    useEffect(() => {
        if (name && distinctNames.length > 0) {
            const filtered = distinctNames.filter(
                s => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()
            );
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [name, distinctNames]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast(t('symptom.nameRequired'), 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await addSymptom({
                name: name.trim(),
                severity,
                notes: notes.trim(),
                occurred_at: date.toISOString(),
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(t('common.saved') || 'Saved successfully', 'success');

            // Delay navigation slightly to let user see the toast
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast(t('symptom.addFailed'), 'error');
            setIsSubmitting(false);
        }
    };

    const handleSeveritySelect = (num: number) => {
        if (severity !== num) {
            Haptics.selectionAsync();
            setSeverity(num);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            // Keep the time from the current state
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());
            setDate(newDate);
            Haptics.selectionAsync();
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            const newDate = new Date(date);
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
            setDate(newDate);
            Haptics.selectionAsync();
        }
    };

    const renderSeveritySelector = () => {
        return (
            <View style={styles.severityContainer}>
                <View style={styles.severityLabels}>
                    <Text style={[styles.severityLabel, { color: colors.subtext }]}>{t('symptom.mild')}</Text>
                    <Text style={[styles.severityLabel, { color: colors.subtext }]}>{t('symptom.severe')}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.severityScroll}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <TouchableOpacity
                            key={num}
                            style={[
                                styles.severityButton,
                                {
                                    backgroundColor: severity === num ? colors.primary : colors.card,
                                    borderColor: severity === num ? colors.primary : colors.border,
                                    // Visual improvements
                                    transform: [{ scale: severity === num ? 1.1 : 1 }],
                                    shadowColor: severity === num ? colors.primary : 'transparent',
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: severity === num ? 4 : 0
                                }
                            ]}
                            onPress={() => handleSeveritySelect(num)}
                            accessibilityLabel={t('symptom.level', { count: num })}
                            accessibilityRole="button"
                            accessibilityState={{ selected: severity === num }}
                        >
                            <Text style={[
                                styles.severityText,
                                { color: severity === num ? '#fff' : colors.text }
                            ]}>
                                {num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <Text style={[styles.severityValue, { color: colors.primary }]}>
                    {t('symptom.level', { count: severity })}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Stack.Screen
                options={{
                    title: t('symptom.addTitle') || 'Log Symptom',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/reminders/manage', params: { type: 'symptom' } })}
                            style={{ marginRight: 16 }}
                        >
                            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Name Input with Autocomplete */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('symptom.nameLabel')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder={t('symptom.namePlaceholder')}
                        placeholderTextColor={colors.subtext}
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            // Debouncing is handled in useEffect but simple updates are fine
                        }}
                        accessibilityLabel={t('symptom.nameLabel')}
                    />
                    {showSuggestions && (
                        <View style={[styles.suggestionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            {filteredSuggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setName(suggestion);
                                        setShowSuggestions(false);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Text style={{ color: colors.text }}>{suggestion}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Severity */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('symptom.severityLabel')}</Text>
                    {renderSeveritySelector()}
                </View>

                {/* Date & Time */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('symptom.timeLabel')}</Text>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity
                            style={[styles.dateTimeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setShowDatePicker(true)}
                            accessibilityLabel={t('symptom.dateLabel')}
                            accessibilityRole="button"
                        >
                            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            <Text style={[styles.dateTimeText, { color: colors.text }]}>
                                {date.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.dateTimeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setShowTimePicker(true)}
                            accessibilityLabel={t('symptom.timeLabel')}
                            accessibilityRole="button"
                        >
                            <Ionicons name="time-outline" size={20} color={colors.primary} />
                            <Text style={[styles.dateTimeText, { color: colors.text }]}>
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={date}
                        mode="time"
                        display="default"
                        onChange={onTimeChange}
                    />
                )}

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('symptom.notesLabel')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        placeholder={t('symptom.notesPlaceholder')}
                        placeholderTextColor={colors.subtext}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                    accessibilityLabel={t('common.save')}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isSubmitting }}
                >
                    {isSubmitting ? (
                        <Text style={styles.saveButtonText}>{t('common.saving')}</Text>
                    ) : (
                        <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
    },
    severityContainer: {
        alignItems: 'center',
    },
    severityLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    severityLabel: {
        fontSize: 12,
    },
    severityScroll: {
        gap: 8,
        paddingVertical: 12, // Increased padding
        paddingHorizontal: 4,
    },
    severityButton: {
        width: 44, // Larger tap target
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginHorizontal: 2,
    },
    severityText: {
        fontSize: 18, // Larger text
        fontWeight: '700',
    },
    severityValue: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    dateTimeText: {
        fontSize: 16,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 10,
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        maxHeight: 150,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
    },
    saveButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

