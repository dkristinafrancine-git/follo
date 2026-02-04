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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Medication, CreateMedicationInput, RecurrenceRule } from '../../types';

// Medication form options per PRD
const MEDICATION_FORMS = [
    'tablet',
    'capsule',
    'liquid',
    'injection',
    'patch',
    'cream',
    'drops',
] as const;

const FREQUENCIES = [
    { key: 'daily', value: { frequency: 'daily' as const } },
    { key: 'twiceDaily', value: { frequency: 'daily' as const, interval: 1 } },
    { key: 'weekly', value: { frequency: 'weekly' as const } },
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
        hideName: initialValues?.hideName ?? false,
    });

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

    // Get current time as Date for picker
    const getTimeAsDate = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Medication Name */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.name')} *</Text>
                <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    value={formData.name}
                    onChangeText={v => updateField('name', v)}
                    placeholder={t('medication.namePlaceholder')}
                    placeholderTextColor="#6b7280"
                    autoCapitalize="words"
                    autoFocus={mode === 'add'}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Dosage */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.dosage')}</Text>
                <TextInput
                    style={styles.input}
                    value={formData.dosage}
                    onChangeText={v => updateField('dosage', v)}
                    placeholder={t('medication.dosagePlaceholder') || 'e.g., 500mg'}
                    placeholderTextColor="#6b7280"
                />
            </View>

            {/* Form (Tablet, Capsule, etc.) */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.form')}</Text>
                <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowFormPicker(true)}
                >
                    <Text style={styles.pickerButtonText}>
                        {t(`medication.forms.${formData.form.toLowerCase()}`) || formData.form}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* Frequency */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.frequency')}</Text>
                <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowFrequencyPicker(true)}
                >
                    <Text style={styles.pickerButtonText}>
                        {t(`medication.frequencies.${formData.frequency.frequency === 'daily' && !formData.frequency.interval ? 'daily' : formData.frequency.frequency}`)}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* Time of Day */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.time')}</Text>
                {formData.timeOfDay.map((time, index) => (
                    <View key={index} style={styles.timeRow}>
                        <TouchableOpacity
                            style={styles.timeButton}
                            onPress={() => openTimePicker(index)}
                        >
                            <Text style={styles.timeButtonText}>{time}</Text>
                        </TouchableOpacity>
                        {formData.timeOfDay.length > 1 && (
                            <TouchableOpacity
                                style={styles.removeTimeButton}
                                onPress={() => removeTime(index)}
                            >
                                <Text style={styles.removeTimeButtonText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
                    <Text style={styles.addTimeButtonText}>+ {t('medication.addTime') || 'Add Time'}</Text>
                </TouchableOpacity>
            </View>

            {/* Current Quantity */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.currentQuantity')}</Text>
                <TextInput
                    style={styles.input}
                    value={formData.currentQuantity}
                    onChangeText={v => updateField('currentQuantity', v.replace(/[^0-9]/g, ''))}
                    placeholder={t('medication.quantityPlaceholder') || 'Number of pills/doses'}
                    placeholderTextColor="#6b7280"
                    keyboardType="number-pad"
                />
            </View>

            {/* Refill Threshold */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.refillThreshold')}</Text>
                <View style={styles.thresholdRow}>
                    <TouchableOpacity
                        style={styles.thresholdButton}
                        onPress={() =>
                            updateField('refillThreshold', Math.max(1, formData.refillThreshold - 1))
                        }
                    >
                        <Text style={styles.thresholdButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.thresholdValue}>{formData.refillThreshold} days</Text>
                    <TouchableOpacity
                        style={styles.thresholdButton}
                        onPress={() => updateField('refillThreshold', formData.refillThreshold + 1)}
                    >
                        <Text style={styles.thresholdButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.hint}>{t('medication.refillThresholdHint') || 'Days before reminder'}</Text>
            </View>

            {/* Notes */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.notes')}</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.notes}
                    onChangeText={v => updateField('notes', v)}
                    placeholder={t('appointment.notes') || 'Add notes...'}
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            {/* Hide Name Toggle */}
            <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('hideName', !formData.hideName)}
            >
                <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Hide medication name</Text>
                    <Text style={styles.toggleHint}>Shows "Medication" on widget for privacy</Text>
                </View>
                <View style={[styles.toggle, formData.hideName && styles.toggleActive]}>
                    <View style={[styles.toggleDot, formData.hideName && styles.toggleDotActive]} />
                </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                    disabled={isLoading}
                >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
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
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerModalTitle}>{t('medication.form')}</Text>
                        {MEDICATION_FORMS.map(form => (
                            <TouchableOpacity
                                key={form}
                                style={[
                                    styles.pickerOption,
                                    formData.form.toLowerCase() === form && styles.pickerOptionActive,
                                ]}
                                onPress={() => {
                                    updateField('form', form.charAt(0).toUpperCase() + form.slice(1));
                                    setShowFormPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        formData.form.toLowerCase() === form && styles.pickerOptionTextActive,
                                    ]}
                                >
                                    {t(`medication.forms.${form}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
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
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerModalTitle}>{t('medication.frequency')}</Text>
                        {FREQUENCIES.map(freq => (
                            <TouchableOpacity
                                key={freq.key}
                                style={[
                                    styles.pickerOption,
                                    formData.frequency.frequency === freq.value.frequency &&
                                    styles.pickerOptionActive,
                                ]}
                                onPress={() => {
                                    updateField('frequency', freq.value);
                                    setShowFrequencyPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        formData.frequency.frequency === freq.value.frequency &&
                                        styles.pickerOptionTextActive,
                                    ]}
                                >
                                    {t(`medication.frequencies.${freq.key}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
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
});
