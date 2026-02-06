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
import { useTheme } from '../../context/ThemeContext';

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
    const { colors } = useTheme();

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
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.name') || 'Name'} *</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }, errors.name && { borderColor: colors.danger, borderWidth: 1 }]}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('supplement.namePlaceholder') || 'e.g., Vitamin C'}
                    placeholderTextColor={colors.subtext}
                />
                {errors.name && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.name}</Text>}
            </View>

            <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.dosage') || 'Dosage'}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                        value={dosage}
                        onChangeText={setDosage}
                        placeholder="e.g., 500mg"
                        placeholderTextColor={colors.subtext}
                    />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.stock') || 'Current Stock'}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                        value={stock}
                        onChangeText={setStock}
                        placeholder="0"
                        keyboardType="number-pad"
                        placeholderTextColor={colors.subtext}
                    />
                </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('medication.schedule') || 'Schedule'}</Text>

                <View style={styles.frequencyContainer}>
                    {FREQUENCIES.map((freq) => (
                        <TouchableOpacity
                            key={freq.value}
                            style={[
                                styles.freqButton,
                                { backgroundColor: colors.background }, // Use background for unselected to contrast with card
                                frequency === freq.value && { backgroundColor: colors.primary }
                            ]}
                            onPress={() => setFrequency(freq.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                        >
                            <Text style={[
                                styles.freqText,
                                { color: colors.subtext },
                                frequency === freq.value && { color: '#fff' }
                            ]}>
                                {freq.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.timesContainer}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('medication.times') || 'Time of Day'}</Text>
                    {times.map((time, index) => (
                        <View key={index} style={styles.timeRow}>
                            <TouchableOpacity
                                style={[styles.timeButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => openTimePicker(index)}
                            >
                                <Text style={[styles.timeText, { color: colors.text }]}>
                                    {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
                                </Text>
                            </TouchableOpacity>
                            {times.length > 1 && (
                                <TouchableOpacity
                                    onPress={() => removeTime(index)}
                                    style={[styles.removeBtn, { backgroundColor: colors.background }]}
                                >
                                    <Text style={[styles.removeBtnText, { color: colors.danger }]}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.addTimeBtn, { borderColor: colors.primary }]} onPress={addTime}>
                        <Text style={[styles.addTimeText, { color: colors.primary }]}>+ {t('common.addTime') || 'Add Time'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('common.notes') || 'Notes'}</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t('common.notesPlaceholder') || 'e.g., Take with food'}
                    placeholderTextColor={colors.subtext}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.card }]} onPress={onCancel} disabled={isLoading}>
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isLoading}>
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
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
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
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
    },
    errorText: {
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
        alignItems: 'center',
    },
    freqText: {
        fontWeight: '600',
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
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    timeText: {
        fontSize: 16,
        textAlign: 'center',
    },
    removeBtn: {
        padding: 10,
        borderRadius: 8,
    },
    removeBtnText: {
        fontWeight: 'bold',
    },
    addTimeBtn: {
        marginTop: 8,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        borderStyle: 'dashed',
    },
    addTimeText: {
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
        alignItems: 'center',
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
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
});
