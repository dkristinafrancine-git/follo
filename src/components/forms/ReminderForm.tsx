import { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Reminder, CreateReminderInput, ReminderType, RecurrenceRule } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { FrequencySelector } from './FrequencySelector';

interface ReminderFormProps {
    initialValues?: Partial<Reminder>;
    onSubmit: (data: Partial<CreateReminderInput>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    mode?: 'add' | 'edit';
}

const REMINDER_TYPES: { key: ReminderType; label: string }[] = [
    { key: 'supplement', label: 'Supplement' },
    { key: 'activity', label: 'Activity' },
    { key: 'gratitude', label: 'Gratitude' },
    { key: 'symptom', label: 'Symptom' },
];

export function ReminderForm({
    initialValues,
    onSubmit,
    onCancel,
    isLoading = false,
    mode = 'add',
}: ReminderFormProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();

    const [type, setType] = useState<ReminderType>(initialValues?.type || 'supplement');
    const [frequency, setFrequency] = useState<RecurrenceRule>(
        initialValues?.frequencyRule || { frequency: 'daily' }
    );
    const [timeOfDay, setTimeOfDay] = useState<string[]>(
        initialValues?.timeOfDay || ['08:00']
    );
    const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

    const handleSubmit = useCallback(async () => {
        const data: Partial<CreateReminderInput> = {
            type,
            frequencyRule: frequency,
            timeOfDay,
            isActive,
        };
        await onSubmit(data);
    }, [type, frequency, timeOfDay, isActive, onSubmit]);

    // Time handling
    const addTime = () => {
        setTimeOfDay(prev => [...prev, '12:00']);
    };

    const removeTime = (index: number) => {
        if (timeOfDay.length <= 1) return;
        setTimeOfDay(prev => prev.filter((_, i) => i !== index));
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
            const newTimes = [...timeOfDay];
            newTimes[editingTimeIndex] = `${hours}:${minutes}`;
            setTimeOfDay(newTimes);
        }
        if (Platform.OS !== 'ios') {
            setEditingTimeIndex(null);
        }
    };

    const getTimeAsDate = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Reminder Type Selection */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('reminder.type')}</Text>
                <View style={styles.typeContainer}>
                    {REMINDER_TYPES.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[
                                styles.typeButton,
                                { backgroundColor: colors.card, borderColor: colors.border },
                                type === item.key && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }
                            ]}
                            onPress={() => setType(item.key)}
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    { color: colors.text },
                                    type === item.key && { color: colors.primary, fontWeight: '600' }
                                ]}
                            >
                                {t(`reminder.types.${item.key}`, { defaultValue: item.label })}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Frequency Selector */}
            <FrequencySelector
                frequency={frequency}
                onChange={setFrequency}
                label={t('reminder.frequency')}
            />

            {/* Time of Day */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('reminder.times')}</Text>
                {timeOfDay.map((time, index) => (
                    <View key={index} style={styles.timeRow}>
                        <TouchableOpacity
                            style={[styles.timeButton, { backgroundColor: colors.card }]}
                            onPress={() => openTimePicker(index)}
                        >
                            <Text style={[styles.timeButtonText, { color: colors.primary }]}>{time}</Text>
                        </TouchableOpacity>
                        {timeOfDay.length > 1 && (
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

            {/* Active Toggle */}
            <View style={[styles.field, styles.rowBetween]}>
                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                    {t('reminder.isActive')}
                </Text>
                <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: colors.border, true: colors.primary }}
                />
            </View>

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
                    value={getTimeAsDate(timeOfDay[editingTimeIndex])}
                    mode="time"
                    is24Hour={true}
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
    field: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 4,
    },
    typeText: {
        fontSize: 14,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeButton: {
        flex: 1,
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
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    removeTimeButton: {
        marginLeft: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeTimeButtonText: {
        fontSize: 16,
    },
    addTimeButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    addTimeButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
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
});
