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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Title */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('appointment.title') || 'Title'} *</Text>
                <TextInput
                    style={[styles.input, errors.title && styles.inputError]}
                    value={formData.title}
                    onChangeText={v => updateField('title', v)}
                    placeholder={t('appointment.titlePlaceholder') || 'e.g. Cardiologist Visit'}
                    placeholderTextColor="#6b7280"
                    autoFocus={mode === 'add'}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Doctor & Specialty Row */}
            <View style={styles.row}>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={styles.label}>{t('appointment.doctor') || 'Doctor'}</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.doctorName}
                        onChangeText={v => updateField('doctorName', v)}
                        placeholder="Dr. Smith"
                        placeholderTextColor="#6b7280"
                    />
                </View>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={styles.label}>{t('appointment.specialty') || 'Specialty'}</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.specialty}
                        onChangeText={v => updateField('specialty', v)}
                        placeholder="Cardiology"
                        placeholderTextColor="#6b7280"
                    />
                </View>
            </View>

            {/* Date & Time Row */}
            <View style={styles.row}>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={styles.label}>{t('appointment.date') || 'Date'}</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>
                            {format(formData.scheduledTime, 'MMM d, yyyy')}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.field, styles.halfField]}>
                    <Text style={styles.label}>{t('appointment.time') || 'Time'}</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={styles.pickerButtonText}>
                            {format(formData.scheduledTime, 'HH:mm')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Duration */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('appointment.duration') || 'Duration'}</Text>
                <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowDurationPicker(true)}
                >
                    <Text style={styles.pickerButtonText}>
                        {formData.duration} {t('common.minutes') || 'minutes'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('appointment.location') || 'Location'}</Text>
                <TextInput
                    style={styles.input}
                    value={formData.location}
                    onChangeText={v => updateField('location', v)}
                    placeholder={t('appointment.locationPlaceholder') || 'e.g. Medical Center, Room 302'}
                    placeholderTextColor="#6b7280"
                />
            </View>

            {/* Reason */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('appointment.reason') || 'Reason'}</Text>
                <TextInput
                    style={styles.input}
                    value={formData.reason}
                    onChangeText={v => updateField('reason', v)}
                    placeholder={t('appointment.reasonPlaceholder') || 'e.g. Annual Checkup'}
                    placeholderTextColor="#6b7280"
                />
            </View>

            {/* Checklist */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('appointment.checklist') || 'Pre-appointment Checklist'}</Text>
                <View style={styles.checklistInputRow}>
                    <TextInput
                        style={[styles.input, styles.checklistInput]}
                        value={newItem}
                        onChangeText={setNewItem}
                        placeholder={t('appointment.checklistPlaceholder') || 'e.g. Bring ID'}
                        placeholderTextColor="#6b7280"
                        onSubmitEditing={addChecklistItem}
                    />
                    <TouchableOpacity
                        style={[styles.addButton, !newItem.trim() && styles.addButtonDisabled]}
                        onPress={addChecklistItem}
                        disabled={!newItem.trim()}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>

                {formData.checklist.length > 0 && (
                    <View style={styles.checklistItems}>
                        {formData.checklist.map((item, index) => (
                            <View key={index} style={styles.checklistItem}>
                                <Text style={styles.checklistItemText}>• {item}</Text>
                                <TouchableOpacity
                                    onPress={() => removeChecklistItem(index)}
                                    style={styles.removeButton}
                                >
                                    <Text style={styles.removeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Notes */}
            <View style={styles.field}>
                <Text style={styles.label}>{t('appointment.notes') || 'Notes'}</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.notes}
                    onChangeText={v => updateField('notes', v)}
                    placeholder={t('appointment.notesPlaceholder') || 'Questions to ask, preparation...'}
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

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
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerModalTitle}>{t('appointment.duration')}</Text>
                        {DURATIONS.map(duration => (
                            <TouchableOpacity
                                key={duration}
                                style={[
                                    styles.pickerOption,
                                    formData.duration === duration && styles.pickerOptionActive,
                                ]}
                                onPress={() => {
                                    updateField('duration', duration);
                                    setShowDurationPicker(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.pickerOptionText,
                                        formData.duration === duration && styles.pickerOptionTextActive,
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
        backgroundColor: '#1a1a2e',
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
        minHeight: 56,
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        marginTop: 6,
    },
    pickerButton: {
        backgroundColor: '#252542',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
        justifyContent: 'center',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#ffffff',
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
        backgroundColor: '#4A90D9',
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
        backgroundColor: '#4A90D9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonDisabled: {
        backgroundColor: '#3f3f5a',
        opacity: 0.5,
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
        backgroundColor: '#3f3f5a',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'space-between',
    },
    checklistItemText: {
        fontSize: 15,
        color: '#d1d5db',
        flex: 1,
    },
    removeButton: {
        padding: 4,
    },
    removeButtonText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: 'bold',
    },
});
