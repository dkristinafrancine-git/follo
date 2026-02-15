/**
 * MedicationForm Component
 * Reusable form for adding/editing medications
 * Following frontend-design skill guidelines
 */

import { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Platform,
    Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { Medication, CreateMedicationInput, RecurrenceRule, MedicationReference } from '../../types';
import { medicationReferenceRepository } from '../../repositories';
import { useTheme } from '../../context/ThemeContext';
import { DaySelector } from './DaySelector';

// Medication form options per PRD
// Medication form options per PRD
const MEDICATION_FORMS = [
    'tablet',
    'capsule',
    'liquid',
    'injection',
    'patch',
    'cream',
    'drops',
    'inhaler',
    'powder',
    'spray',
    'syrup',
    'ointment',
    'gel',
    'lotion',
    'suppository',
    'gummy',
    'device',
    'implant',
    'other',
] as const;

const FREQUENCIES = [
    { key: 'daily', value: { frequency: 'daily' as const } },
    { key: 'twiceDaily', value: { frequency: 'daily' as const, interval: 1 } },
    { key: 'weekly', value: { frequency: 'weekly' as const } },
    { key: 'weekdays', value: { frequency: 'weekly' as const, daysOfWeek: [1, 2, 3, 4, 5] as number[] } },
    { key: 'weekends', value: { frequency: 'weekly' as const, daysOfWeek: [0, 6] as number[] } },
    { key: 'specificDays', value: { frequency: 'weekly' as const, daysOfWeek: [] as number[] } },
    { key: 'asNeeded', value: { frequency: 'custom' as const, interval: 0 } },
] as const;

interface MedicationFormProps {
    initialValues?: Partial<Medication>;
    onSubmit: (data: Partial<CreateMedicationInput>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    mode?: 'add' | 'edit';
}

interface FormData {
    name: string;
    dosage: string;
    form: string;
    frequency: RecurrenceRule;
    timeOfDay: string[];
    refillThreshold: number;
    currentQuantity: string;
    notes: string;
    photoUri?: string;
    hideName: boolean;
}

export function MedicationForm({
    initialValues,
    onSubmit,
    onCancel,
    isLoading = false,
    mode = 'add',
}: MedicationFormProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // Form state
    const [formData, setFormData] = useState<FormData>({
        name: initialValues?.name || '',
        dosage: initialValues?.dosage || '',
        form: initialValues?.form || 'Tablet',
        frequency: initialValues?.frequencyRule || { frequency: 'daily' },
        timeOfDay: initialValues?.timeOfDay || ['08:00'],
        refillThreshold: initialValues?.refillThreshold ?? 7,
        currentQuantity: initialValues?.currentQuantity?.toString() || '',
        notes: initialValues?.notes || '',
        photoUri: initialValues?.photoUri,
        hideName: initialValues?.hideName ?? false,
    });

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<MedicationReference[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Validation state
    const [errors, setErrors] = useState<{ name?: string }>({});

    // Picker states
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
    const [showFormPicker, setShowFormPicker] = useState(false);
    const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

    // Validation
    const validate = useCallback((): boolean => {
        const newErrors: { name?: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = t('medication.nameRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData.name, t]);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (!validate()) return;

        const data: Partial<CreateMedicationInput> = {
            name: formData.name.trim(),
            dosage: formData.dosage.trim() || undefined,
            form: formData.form,
            frequencyRule: formData.frequency,
            timeOfDay: formData.timeOfDay,
            refillThreshold: formData.refillThreshold,
            currentQuantity: formData.currentQuantity
                ? parseInt(formData.currentQuantity, 10)
                : undefined,
            notes: formData.notes.trim() || undefined,
            hideName: formData.hideName,
            isActive: true,
        };

        await onSubmit(data);
    }, [formData, validate, onSubmit]);

    // Update field
    const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (key === 'name' && errors.name) {
            setErrors(prev => ({ ...prev, name: undefined }));
        }
    };

    // Time management
    const addTime = () => {
        setFormData(prev => ({
            ...prev,
            timeOfDay: [...prev.timeOfDay, '12:00'],
        }));
    };

    const removeTime = (index: number) => {
        if (formData.timeOfDay.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            timeOfDay: prev.timeOfDay.filter((_, i) => i !== index),
        }));
    };

    const openTimePicker = (index: number) => {
        setEditingTimeIndex(index);
        setShowTimePicker(true);
    };

    const handleTimeChange = (event: unknown, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate && editingTimeIndex !== null) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const newTimes = [...formData.timeOfDay];
            newTimes[editingTimeIndex] = `${hours}:${minutes}`;
            updateField('timeOfDay', newTimes);
        }
        if (Platform.OS !== 'ios') {
            setEditingTimeIndex(null);
        }
    };

    // Autocomplete logic
    const handleNameChange = async (text: string) => {
        updateField('name', text);
        if (text.length > 1) {
            try {
                const results = await medicationReferenceRepository.search(text);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (err) {
                console.warn('Failed to search medications', err);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (med: MedicationReference) => {
        updateField('name', med.name);
        // Pre-fill form if available (simple mapping)
        if (med.dosageForms && med.dosageForms.length > 0) {
            updateField('form', med.dosageForms[0]);
        }
        setShowSuggestions(false);
    };

    // Photo logic
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            updateField('photoUri', result.assets[0].uri);
        }
    };

    // Get current time as Date for picker
    const getTimeAsDate = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    /**
     * Gracefully handle form display names.
     * If the translation key doesn't exist (returns the key itself), show the raw value.
     */
    const getFormDisplay = (formValue: string) => {
        const key = `medication.forms.${formValue.toLowerCase()}`;
        const translated = t(key);
        // i18next usually returns the key if missing, or we can check if it contains "medication.forms."
        // A safer check is to see if the translation equals the key
        if (translated === key) {
            return formValue;
        }
        return translated;
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            {/* Medication Name with Autocomplete */}
            <View style={[styles.field, { zIndex: 10 }]}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.name')} *</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }, errors.name && styles.inputError]}
                    value={formData.name}
                    onChangeText={handleNameChange}
                    onFocus={() => formData.name.length > 1 && setShowSuggestions(true)}
                    placeholder={t('medication.namePlaceholder')}
                    placeholderTextColor={colors.subtext}
                    autoCapitalize="words"
                    autoFocus={mode === 'add'}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <View style={[styles.suggestionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
                            {suggestions.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                                    onPress={() => selectSuggestion(item)}
                                >
                                    <Text style={[styles.suggestionText, { color: colors.text }]}>{item.name}</Text>
                                    {item.genericName && (
                                        <Text style={[styles.suggestionSubText, { color: colors.subtext }]}>{item.genericName}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Photo Attachment */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.photo')}</Text>
                <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card }]} onPress={pickImage}>
                    {formData.photoUri ? (
                        <Image source={{ uri: formData.photoUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Text style={[styles.photoPlaceholderText, { color: colors.primary }]}>+ {t('medication.addPhoto')}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <Text style={[styles.hint, { color: colors.subtext }]}>{t('medication.photoHint')}</Text>
            </View>

            {/* Dosage */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.dosage')}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    value={formData.dosage}
                    onChangeText={v => updateField('dosage', v)}
                    placeholder={t('medication.dosagePlaceholder')}
                    placeholderTextColor={colors.subtext}
                />
            </View>

            {/* Form (Tablet, Capsule, etc.) */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.form')}</Text>
                <TouchableOpacity
                    style={[styles.pickerButton, { backgroundColor: colors.card }]}
                    onPress={() => setShowFormPicker(true)}
                >
                    <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                        {getFormDisplay(formData.form)}
                    </Text>
                    <Text style={[styles.pickerArrow, { color: colors.subtext }]}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* Frequency */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.frequency')}</Text>
                <TouchableOpacity
                    style={[styles.pickerButton, { backgroundColor: colors.card }]}
                    onPress={() => setShowFrequencyPicker(true)}
                >
                    <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                        {formData.frequency.daysOfWeek !== undefined
                            ? formData.frequency.daysOfWeek.length === 5 && !formData.frequency.daysOfWeek.includes(0) && !formData.frequency.daysOfWeek.includes(6)
                                ? t('medication.frequencies.weekdays')
                                : formData.frequency.daysOfWeek.length === 2 && formData.frequency.daysOfWeek.includes(0) && formData.frequency.daysOfWeek.includes(6)
                                    ? t('medication.frequencies.weekends')
                                    : t('medication.frequencies.specificDays')
                            : t(`medication.frequencies.${formData.frequency.frequency === 'daily' && !formData.frequency.interval ? 'daily' : formData.frequency.frequency}`)}
                    </Text>
                    <Text style={[styles.pickerArrow, { color: colors.subtext }]}>▼</Text>
                </TouchableOpacity>

                {/* Day Selector for Specific Days */}
                {formData.frequency.frequency === 'weekly' &&
                    formData.frequency.daysOfWeek !== undefined && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={[styles.label, { color: colors.subtext, fontSize: 12 }]}>{t('medication.selectDays')}</Text>
                            <DaySelector
                                selectedDays={formData.frequency.daysOfWeek || []}
                                onChange={(days) => updateField('frequency', { ...formData.frequency, daysOfWeek: days })}
                            />
                        </View>
                    )}
            </View>

            {/* Time of Day */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.times')}</Text>
                {formData.timeOfDay.map((time, index) => (
                    <View key={index} style={styles.timeRow}>
                        <TouchableOpacity
                            style={[styles.timeButton, { backgroundColor: colors.card }]}
                            onPress={() => openTimePicker(index)}
                        >
                            <Text style={[styles.timeButtonText, { color: colors.primary }]}>{time}</Text>
                        </TouchableOpacity>
                        {formData.timeOfDay.length > 1 && (
                            <TouchableOpacity
                                style={[styles.removeTimeButton, { backgroundColor: colors.border }]}
                                onPress={() => removeTime(index)}
                            >
                                <Text style={[styles.removeTimeButtonText, { color: colors.danger }]}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
                    <Text style={[styles.addTimeButtonText, { color: colors.primary }]}>+ {t('common.addTime')}</Text>
                </TouchableOpacity>
            </View>

            {/* Current Quantity */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.currentQuantity')}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    value={formData.currentQuantity}
                    onChangeText={v => updateField('currentQuantity', v.replace(/[^0-9]/g, ''))}
                    placeholder={t('medication.quantityPlaceholder')}
                    placeholderTextColor={colors.subtext}
                    keyboardType="number-pad"
                />
            </View>

            {/* Refill Threshold */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.refillThreshold')}</Text>
                <View style={styles.thresholdRow}>
                    <TouchableOpacity
                        style={[styles.thresholdButton, { backgroundColor: colors.card }]}
                        onPress={() =>
                            updateField('refillThreshold', Math.max(1, formData.refillThreshold - 1))
                        }
                    >
                        <Text style={[styles.thresholdButtonText, { color: colors.primary }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.thresholdValue, { color: colors.text }]}>{formData.refillThreshold} {t('myFlow.days')}</Text>
                    <TouchableOpacity
                        style={[styles.thresholdButton, { backgroundColor: colors.card }]}
                        onPress={() => updateField('refillThreshold', formData.refillThreshold + 1)}
                    >
                        <Text style={[styles.thresholdButtonText, { color: colors.primary }]}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.hint, { color: colors.subtext }]}>{t('medication.refillThresholdHint')}</Text>
            </View>

            {/* Notes */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.notes')}</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                    value={formData.notes}
                    onChangeText={v => updateField('notes', v)}
                    placeholder={t('common.notesPlaceholder')}
                    placeholderTextColor={colors.subtext}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            {/* Hide Name Toggle */}
            <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.card }]}
                onPress={() => updateField('hideName', !formData.hideName)}
            >
                <View style={styles.toggleInfo}>
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('medication.hideName')}</Text>
                    <Text style={[styles.toggleHint, { color: colors.subtext }]}>{t('medication.hideNameHint')}</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: colors.border }, formData.hideName && { backgroundColor: colors.primary }]}>
                    <View style={[styles.toggleDot, { backgroundColor: '#ffffff' }, formData.hideName && styles.toggleDotActive]} />
                </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.border }]}
                    onPress={onCancel}
                    disabled={isLoading}
                >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Text style={styles.submitButtonText}>
                        {isLoading ? t('common.loading') : t('common.save')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Time Picker */}
            {showTimePicker && editingTimeIndex !== null && (
                <DateTimePicker
                    value={getTimeAsDate(formData.timeOfDay[editingTimeIndex])}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            {/* Form Picker Modal */}
            <Modal visible={showFormPicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFormPicker(false)}
                >
                    <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.pickerModalTitle, { color: colors.text }]}>{t('medication.form')}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {MEDICATION_FORMS.map(form => (
                                <TouchableOpacity
                                    key={form}
                                    style={[
                                        styles.pickerOption,
                                        formData.form.toLowerCase() === form && { backgroundColor: `${colors.primary}20` },
                                    ]}
                                    onPress={() => {
                                        updateField('form', form.charAt(0).toUpperCase() + form.slice(1));
                                        setShowFormPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: colors.text },
                                            formData.form.toLowerCase() === form && { color: colors.primary, fontWeight: '600' },
                                        ]}
                                    >
                                        {getFormDisplay(form)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Frequency Picker Modal */}
            <Modal visible={showFrequencyPicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFrequencyPicker(false)}
                >
                    <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.pickerModalTitle, { color: colors.text }]}>{t('medication.frequency')}</Text>
                        {FREQUENCIES.map(freq => (
                            <TouchableOpacity
                                key={freq.key}
                                style={[
                                    styles.pickerOption,
                                    formData.frequency.frequency === freq.value.frequency &&
                                    { backgroundColor: `${colors.primary}20` },
                                ]}
                                onPress={() => {
                                    updateField('frequency', freq.value);
                                    setShowFrequencyPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        { color: colors.text },
                                        formData.frequency.frequency === freq.value.frequency &&
                                        { color: colors.primary, fontWeight: '600' },
                                    ]}
                                >
                                    {t(`medication.frequencies.${freq.key}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {/* Custom Interval Option if not already covered */}
                        <TouchableOpacity
                            style={styles.pickerOption}
                            onPress={() => {
                                // Handle custom logic if needed, for now just close
                                setShowFrequencyPicker(false);
                            }}
                        >
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#252542',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#ffffff',
        minHeight: 56, // Per frontend-design skill
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        marginTop: 6,
    },
    hint: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 6,
    },
    pickerButton: {
        backgroundColor: '#252542',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 56,
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#ffffff',
    },
    pickerArrow: {
        fontSize: 12,
        color: '#6b7280',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeButton: {
        flex: 1,
        backgroundColor: '#252542',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
    },
    timeButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A90D9', // Medication blue
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    removeTimeButton: {
        marginLeft: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3f3f5a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeTimeButtonText: {
        color: '#ef4444',
        fontSize: 16,
    },
    addTimeButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    addTimeButtonText: {
        color: '#4A90D9',
        fontSize: 15,
        fontWeight: '600',
    },
    thresholdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thresholdButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#252542',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thresholdButtonText: {
        fontSize: 24,
        color: '#4A90D9',
        fontWeight: '300',
    },
    thresholdValue: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: '600',
        marginHorizontal: 24,
        minWidth: 80,
        textAlign: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleLabel: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    toggleHint: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#3f3f5a',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#4A90D9',
    },
    toggleDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },
    toggleDotActive: {
        marginLeft: 22,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#3f3f5a',
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    submitButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#4A90D9', // Medication blue
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerModal: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 320,
        maxHeight: '80%',
    },
    pickerModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 16,
        textAlign: 'center',
    },
    pickerOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 4,
    },
    pickerOptionActive: {
        backgroundColor: '#4A90D920',
    },
    pickerOptionText: {
        fontSize: 16,
        color: '#ffffff',
    },
    pickerOptionTextActive: {
        color: '#4A90D9',
        fontWeight: '600',
    },
    // Autocomplete Styles
    suggestionsContainer: {
        position: 'absolute',
        top: 86,
        left: 0,
        right: 0,
        backgroundColor: '#252542',
        borderRadius: 12,
        maxHeight: 200,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: '#3f3f5a',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#3f3f5a',
    },
    suggestionText: {
        fontSize: 16,
        color: '#ffffff',
    },
    suggestionSubText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    // Photo Styles
    photoButton: {
        width: 120,
        height: 120,
        backgroundColor: '#252542',
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3f3f5a',
        borderStyle: 'dashed',
    },
    photoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        color: '#4A90D9',
        fontSize: 14,
        fontWeight: '600',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
});
