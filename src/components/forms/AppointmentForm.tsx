/**
 * AppointmentForm Component
 * Reusable form for adding/editing appointments
 */

import { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Appointment, CreateAppointmentInput } from '../../types';
import { useTheme } from '../../context/ThemeContext';

// Duration options in minutes
const DURATIONS = [15, 30, 45, 60, 90, 120];

interface AppointmentFormProps {
    initialValues?: Partial<Appointment>;
    onSubmit: (data: Partial<CreateAppointmentInput>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    mode?: 'add' | 'edit';
}

interface FormData {
    title: string;
    doctorName: string;
    specialty: string;
    location: string;
    scheduledTime: Date;
    duration: number;
    reason: string;
    notes: string;
    checklist: string[];
}

export function AppointmentForm({
    initialValues,
    onSubmit,
    onCancel,
    isLoading = false,
    mode = 'add',
}: AppointmentFormProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // Form state
    const [formData, setFormData] = useState<FormData>({
        title: initialValues?.title || '',
        doctorName: initialValues?.doctorName || '',
        specialty: initialValues?.specialty || '',
        location: initialValues?.location || '',
        scheduledTime: initialValues?.scheduledTime ? new Date(initialValues.scheduledTime) : new Date(),
        duration: initialValues?.duration || 30,
        reason: initialValues?.reason || '',
        notes: initialValues?.notes || '',
        checklist: initialValues?.checklist || [],
    });

    // Checklist state
    const [newItem, setNewItem] = useState('');

    // Picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);

    // Validation state
    const [errors, setErrors] = useState<{ title?: string }>({});

    // Validation
    const validate = useCallback((): boolean => {
        const newErrors: { title?: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = t('appointment.titleRequired') || 'Title is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData.title, t]);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (!validate()) return;

        const data: Partial<CreateAppointmentInput> = {
            title: formData.title.trim(),
            doctorName: formData.doctorName.trim() || undefined,
            specialty: formData.specialty.trim() || undefined,
            location: formData.location.trim() || undefined,
            scheduledTime: formData.scheduledTime.toISOString(),
            duration: formData.duration,
            reason: formData.reason.trim() || undefined,
            notes: formData.notes.trim() || undefined,
            checklist: formData.checklist,
        };

        await onSubmit(data);
    }, [formData, validate, onSubmit]);

    // Update field
    const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (key === 'title' && errors.title) {
            setErrors(prev => ({ ...prev, title: undefined }));
        }
    };

    // Checklist handlers
    const addChecklistItem = () => {
        if (newItem.trim()) {
            setFormData(prev => ({
                ...prev,
                checklist: [...prev.checklist, newItem.trim()]
            }));
            setNewItem('');
        }
    };

    const removeChecklistItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            checklist: prev.checklist.filter((_, i) => i !== index)
        }));
    };

    const handleDateChange = (event: unknown, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDate = new Date(formData.scheduledTime);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            updateField('scheduledTime', newDate);
        }
    };

    const handleTimeChange = (event: unknown, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDate = new Date(formData.scheduledTime);
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            updateField('scheduledTime', newDate);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            {/* Title */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.title')} *</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }, errors.title && { borderColor: colors.danger, borderWidth: 1 }]}
                    value={formData.title}
                    onChangeText={v => updateField('title', v)}
                    placeholder={t('appointment.titlePlaceholder')}
                    placeholderTextColor={colors.subtext}
                    autoFocus={mode === 'add'}
                />
                {errors.title && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.title}</Text>}
            </View>

            {/* Doctor & Specialty Row */}
            <View style={styles.row}>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.doctor')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                        value={formData.doctorName}
                        onChangeText={v => updateField('doctorName', v)}
                        placeholder={t('appointment.doctorPlaceholder') || 'Dr. Smith'}
                        placeholderTextColor={colors.subtext}
                    />
                </View>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.specialty')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                        value={formData.specialty}
                        onChangeText={v => updateField('specialty', v)}
                        placeholder={t('appointment.specialtyPlaceholder') || 'Cardiology'}
                        placeholderTextColor={colors.subtext}
                    />
                </View>
            </View>

            {/* Date & Time Row */}
            <View style={styles.row}>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.date')}</Text>
                    <TouchableOpacity
                        style={[styles.pickerButton, { backgroundColor: colors.card }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                            {format(formData.scheduledTime, 'MMM d, yyyy')}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.time')}</Text>
                    <TouchableOpacity
                        style={[styles.pickerButton, { backgroundColor: colors.card }]}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                            {format(formData.scheduledTime, 'HH:mm')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Duration */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.duration')}</Text>
                <TouchableOpacity
                    style={[styles.pickerButton, { backgroundColor: colors.card }]}
                    onPress={() => setShowDurationPicker(true)}
                >
                    <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                        {formData.duration} {t('common.minutes')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.location')}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    value={formData.location}
                    onChangeText={v => updateField('location', v)}
                    placeholder={t('appointment.locationPlaceholder')}
                    placeholderTextColor={colors.subtext}
                />
            </View>

            {/* Reason */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.reason')}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    value={formData.reason}
                    onChangeText={v => updateField('reason', v)}
                    placeholder={t('appointment.reasonPlaceholder')}
                    placeholderTextColor={colors.subtext}
                />
            </View>

            {/* Checklist */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.checklist')}</Text>
                <View style={styles.checklistInputRow}>
                    <TextInput
                        style={[styles.input, styles.checklistInput, { backgroundColor: colors.card, color: colors.text }]}
                        value={newItem}
                        onChangeText={setNewItem}
                        placeholder={t('appointment.checklistPlaceholder')}
                        placeholderTextColor={colors.subtext}
                        onSubmitEditing={addChecklistItem}
                    />
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }, !newItem.trim() && { backgroundColor: colors.card, opacity: 0.5 }]}
                        onPress={addChecklistItem}
                        disabled={!newItem.trim()}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>

                {formData.checklist.length > 0 && (
                    <View style={styles.checklistItems}>
                        {formData.checklist.map((item, index) => (
                            <View key={index} style={[styles.checklistItem, { backgroundColor: colors.card }]}>
                                <Text style={[styles.checklistItemText, { color: colors.text }]}>• {item}</Text>
                                <TouchableOpacity
                                    onPress={() => removeChecklistItem(index)}
                                    style={styles.removeButton}
                                >
                                    <Text style={[styles.removeButtonText, { color: colors.danger }]}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Notes */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('appointment.notes')}</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                    value={formData.notes}
                    onChangeText={v => updateField('notes', v)}
                    placeholder={t('appointment.notesPlaceholder')}
                    placeholderTextColor={colors.subtext}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.card }]}
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

            {/* Pickers */}
            {showDatePicker && (
                <DateTimePicker
                    value={formData.scheduledTime}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={formData.scheduledTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            <Modal visible={showDurationPicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDurationPicker(false)}
                >
                    <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.pickerModalTitle, { color: colors.text }]}>{t('appointment.duration')}</Text>
                        {DURATIONS.map(duration => (
                            <TouchableOpacity
                                key={duration}
                                style={[
                                    styles.pickerOption,
                                    formData.duration === duration && { backgroundColor: `${colors.primary}20` },
                                ]}
                                onPress={() => {
                                    updateField('duration', duration);
                                    setShowDurationPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        { color: colors.text },
                                        formData.duration === duration && { color: colors.primary, fontWeight: '600' },
                                    ]}
                                >
                                    {duration} {t('common.minutes')}
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
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    field: {
        marginBottom: 20,
    },
    halfField: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        minHeight: 56,
    },
    textArea: {
        minHeight: 120,
        paddingTop: 16,
    },
    errorText: {
        fontSize: 13,
        marginTop: 6,
    },
    pickerButton: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
        justifyContent: 'center',
    },
    pickerButtonText: {
        fontSize: 16,
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
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 12,
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
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 320,
    },
    pickerModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    pickerOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 4,
    },
    pickerOptionText: {
        fontSize: 16,
    },
    checklistInputRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    checklistInput: {
        flex: 1,
    },
    addButton: {
        width: 56,
        padding: 0,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: '600',
    },
    checklistItems: {
        gap: 8,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'space-between',
    },
    checklistItemText: {
        fontSize: 15,
        flex: 1,
    },
    removeButton: {
        padding: 4,
    },
    removeButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
