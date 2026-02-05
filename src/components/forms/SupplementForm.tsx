/**
 * SupplementForm Component
 * Form for adding and editing supplements
 */

import { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Platform,
    Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CreateSupplementInput, Supplement, RecurrenceRule } from '../../types';
import { format, parse } from 'date-fns';

interface SupplementFormProps {
    initialValues?: Partial<Supplement>;
    onSubmit: (data: CreateSupplementInput) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const FREQUENCIES = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'As Needed', value: 'custom' }, // Simplified for now
];

export function SupplementForm({ initialValues, onSubmit, onCancel, isLoading = false }: SupplementFormProps) {
    const { t } = useTranslation();

    // Form State
    const [name, setName] = useState(initialValues?.name || '');
    const [dosage, setDosage] = useState(initialValues?.dosage || '');
    const [stock, setStock] = useState(initialValues?.currentQuantity?.toString() || '');
    const [notes, setNotes] = useState(initialValues?.notes || '');
    const [frequency, setFrequency] = useState(initialValues?.frequencyRule?.frequency || 'daily');
    const [times, setTimes] = useState<string[]>(initialValues?.timeOfDay || ['08:00']);

    // Picker State
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = t('common.required');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const supplementData: CreateSupplementInput = {
            profileId: initialValues?.profileId || '', // Should be injected by parent if new
            name: name.trim(),
            dosage: dosage.trim() || undefined,
            form: 'pill', // Default for now
            currentQuantity: stock ? parseInt(stock) : undefined,
            lowStockThreshold: 10,
            notes: notes.trim() || undefined,
            isActive: true, // Default active
            frequencyRule: {
                frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'custom',
                interval: 1,
            },
            timeOfDay: times.sort(),
        };

        await onSubmit(supplementData);
    };

    const handleTimeChange = (event: unknown, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }

        if (selectedDate && editingTimeIndex !== null) {
            const timeStr = format(selectedDate, 'HH:mm');
            const newTimes = [...times];
            newTimes[editingTimeIndex] = timeStr;
            setTimes(newTimes);
        }

        if (Platform.OS === 'ios') {
            // For iOS we might keep it open, but for simplicity let's rely on standard behavior or add Done button
            // keeping logic simple for now
        }
    };

    const addTime = () => {
        setTimes([...times, '08:00']);
    };

    const removeTime = (index: number) => {
        setTimes(times.filter((_, i) => i !== index));
    };

    const openTimePicker = (index: number) => {
        setEditingTimeIndex(index);
        setShowTimePicker(true);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.field}>
                <Text style={styles.label}>{t('medication.name') || 'Name'} *</Text>
                <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('supplement.namePlaceholder') || 'e.g., Vitamin C'}
                    placeholderTextColor="#6b7280"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>{t('medication.dosage') || 'Dosage'}</Text>
                    <TextInput
                        style={styles.input}
                        value={dosage}
                        onChangeText={setDosage}
                        placeholder="e.g., 500mg"
                        placeholderTextColor="#6b7280"
                    />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.label}>{t('medication.stock') || 'Current Stock'}</Text>
                    <TextInput
                        style={styles.input}
                        value={stock}
                        onChangeText={setStock}
                        placeholder="0"
                        keyboardType="number-pad"
                        placeholderTextColor="#6b7280"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('medication.schedule') || 'Schedule'}</Text>

                <View style={styles.frequencyContainer}>
                    {FREQUENCIES.map((freq) => (
                        <TouchableOpacity
                            key={freq.value}
                            style={[
                                styles.freqButton,
                                frequency === freq.value && styles.freqButtonSelected
                            ]}
                            onPress={() => setFrequency(freq.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                        >
                            <Text style={[
                                styles.freqText,
                                frequency === freq.value && styles.freqTextSelected
                            ]}>
                                {freq.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.timesContainer}>
                    <Text style={styles.label}>{t('medication.times') || 'Time of Day'}</Text>
                    {times.map((time, index) => (
                        <View key={index} style={styles.timeRow}>
                            <TouchableOpacity
                                style={styles.timeButton}
                                onPress={() => openTimePicker(index)}
                            >
                                <Text style={styles.timeText}>
                                    {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                                </Text>
                            </TouchableOpacity>
                            {times.length > 1 && (
                                <TouchableOpacity
                                    onPress={() => removeTime(index)}
                                    style={styles.removeBtn}
                                >
                                    <Text style={styles.removeBtnText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addTimeBtn} onPress={addTime}>
                        <Text style={styles.addTimeText}>+ {t('common.addTime') || 'Add Time'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>{t('common.notes') || 'Notes'}</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t('common.notesPlaceholder') || 'e.g., Take with food'}
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                    <Text style={styles.submitButtonText}>{isLoading ? t('common.loading') : t('common.save')}</Text>
                </TouchableOpacity>
            </View>

            {showTimePicker && editingTimeIndex !== null && (
                <DateTimePicker
                    value={parse(times[editingTimeIndex], 'HH:mm', new Date())}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                />
            )}
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
    section: {
        marginBottom: 24,
        backgroundColor: '#252542',
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },
    field: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: '#252542',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#ffffff',
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 16,
    },
    frequencyContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    freqButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#3f3f5a',
        alignItems: 'center',
    },
    freqButtonSelected: {
        backgroundColor: '#4A90D9',
    },
    freqText: {
        color: '#9ca3af',
        fontWeight: '600',
    },
    freqTextSelected: {
        color: '#fff',
    },
    timesContainer: {
        gap: 12,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeButton: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3f3f5a',
    },
    timeText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    removeBtn: {
        padding: 10,
        backgroundColor: '#3f3f5a',
        borderRadius: 8,
    },
    removeBtnText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    addTimeBtn: {
        marginTop: 8,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4A90D9',
        borderRadius: 8,
        borderStyle: 'dashed',
    },
    addTimeText: {
        color: '#4A90D9',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#3f3f5a',
        alignItems: 'center',
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
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
});
