/**
 * ActivityForm Component
 * Dynamic form for logging different types of activities
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Activity, CreateActivityInput, ActivityType } from '../../types';

interface ActivityFormProps {
    onSubmit: (data: Partial<CreateActivityInput>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

// Activity Types with Icons and Colors
const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: string; color: string }[] = [
    { type: 'water', label: 'Water', icon: '💧', color: '#3b82f6' },
    { type: 'exercise', label: 'Exercise', icon: '🏃', color: '#ef4444' },
    { type: 'sleep', label: 'Sleep', icon: '😴', color: '#8b5cf6' },
    { type: 'mood', label: 'Mood', icon: '😊', color: '#f59e0b' },
    { type: 'symptom', label: 'Symptom', icon: '🤒', color: '#10b981' },
    { type: 'custom', label: 'Other', icon: '📝', color: '#6b7280' },
];

const MOODS = ['😞', '😐', '🙂', '😊', '🤩']; // 1 to 5

export function ActivityForm({ onSubmit, onCancel, isLoading = false }: ActivityFormProps) {
    const { t } = useTranslation();

    // Form state
    const [selectedType, setSelectedType] = useState<ActivityType>('water');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState<Date | undefined>(undefined);
    const [value, setValue] = useState<string>(''); // Parsed to number on submit
    const [unit, setUnit] = useState<string>(''); // e.g., ml, min
    const [notes, setNotes] = useState('');
    const [customName, setCustomName] = useState('');

    // Picker state
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Dynamic defaults based on type
    const handleTypeSelect = (type: ActivityType) => {
        setSelectedType(type);
        setNotes('');
        setValue('');
        setEndTime(undefined);
        setCustomName('');

        // Set default units
        if (type === 'water') setUnit('ml');
        if (type === 'exercise') setUnit('min');
        if (type === 'sleep') setUnit('hours');
        if (type === 'vital_signs') setUnit('');
        if (type === 'custom') setUnit('');
    };

    // Submit handler
    const handleSubmit = useCallback(async () => {
        const activityType = selectedType === 'custom' && customName.trim()
            ? customName.trim().toLowerCase().replace(/\s+/g, '_')
            : selectedType;

        const data: Partial<CreateActivityInput> = {
            type: activityType,
            startTime: startTime.toISOString(),
            notes: notes.trim() || undefined,
            unit: unit || undefined,
        };

        // If it's a custom type, we might want to store the display name in notes or handled by capitalization
        if (selectedType === 'custom' && customName.trim()) {
            // Optional: Append original name to notes if needed, or rely on type
        }

        if (selectedType === 'sleep' && endTime) {
            data.endTime = endTime.toISOString();
            // Calculate duration in hours
            const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            data.value = Number(diff.toFixed(1));
        } else if (value) {
            data.value = parseFloat(value);
        }

        await onSubmit(data);
    }, [selectedType, startTime, endTime, value, unit, notes, onSubmit]);

    const handleDateChange = (event: unknown, selectedDate?: Date, isEnd = false) => {
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
            setShowEndPicker(false);
        }

        if (selectedDate) {
            if (isEnd) {
                setEndTime(selectedDate);
            } else {
                setStartTime(selectedDate);
            }
        }
    };

    // Render logic for specific input fields
    const renderInputFields = () => {
        switch (selectedType) {
            case 'water':
                return (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('activity.amount') || 'Amount (ml)'}</Text>
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={value}
                                onChangeText={setValue}
                                placeholder="250"
                                keyboardType="numeric"
                                placeholderTextColor="#6b7280"
                            />
                            <View style={styles.quickAddRow}>
                                <TouchableOpacity onPress={() => setValue((prev) => String((parseFloat(prev || '0') + 250)))} style={styles.quickAddBtn}><Text style={styles.quickAddText}>+250</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => setValue((prev) => String((parseFloat(prev || '0') + 500)))} style={styles.quickAddBtn}><Text style={styles.quickAddText}>+500</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            case 'exercise':
                return (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('activity.duration') || 'Duration (min)'}</Text>
                        <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={setValue}
                            placeholder="30"
                            keyboardType="numeric"
                            placeholderTextColor="#6b7280"
                        />
                    </View>
                );
            case 'sleep':
                return (
                    <View style={styles.inputGroup}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>{t('activity.sleepStart') || 'Sleep Start'}</Text>
                                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartPicker(true)}>
                                    <Text style={styles.pickerButtonText}>{format(startTime, 'MMM d, HH:mm')}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>{t('activity.sleepEnd') || 'Wake Up'}</Text>
                                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowEndPicker(true)}>
                                    <Text style={styles.pickerButtonText}>{endTime ? format(endTime, 'MMM d, HH:mm') : 'Select time'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            case 'mood':
                return (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('activity.mood') || 'How are you feeling?'}</Text>
                        <View style={styles.moodContainer}>
                            {MOODS.map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.moodBtn, parseInt(value) === index + 1 && styles.moodBtnSelected]}
                                    onPress={() => setValue(String(index + 1))}
                                >
                                    <Text style={styles.moodEmoji}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            default:
                return (
                    <View style={styles.inputGroup}>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('activity.metricName') || 'Metric Name'}</Text>
                            <TextInput
                                style={styles.input}
                                value={customName}
                                onChangeText={setCustomName}
                                placeholder="e.g., Weight, Blood Pressure"
                                placeholderTextColor="#6b7280"
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>{t('activity.value') || 'Value'}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={value}
                                    onChangeText={setValue}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    placeholderTextColor="#6b7280"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>{t('activity.unit') || 'Unit'}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={unit}
                                    onChangeText={setUnit}
                                    placeholder="e.g., kg, mmHg"
                                    placeholderTextColor="#6b7280"
                                />
                            </View>
                        </View>
                    </View>
                );
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Type Selector */}
            <View style={styles.typeGrid}>
                {ACTIVITY_TYPES.map((item) => (
                    <TouchableOpacity
                        key={item.type}
                        style={[
                            styles.typeCard,
                            selectedType === item.type && { backgroundColor: item.color, borderColor: item.color }
                        ]}
                        onPress={() => handleTypeSelect(item.type)}
                    >
                        <Text style={styles.typeIcon}>{item.icon}</Text>
                        <Text style={[styles.typeLabel, selectedType === item.type && { color: '#fff' }]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Dynamic Inputs */}
            {renderInputFields()}

            {/* Common Inputs */}
            {selectedType !== 'sleep' && (
                <View style={styles.field}>
                    <Text style={styles.label}>{t('activity.time') || 'Time'}</Text>
                    <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStartPicker(true)}>
                        <Text style={styles.pickerButtonText}>{format(startTime, 'MMM d, HH:mm')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.field}>
                <Text style={styles.label}>{t('activity.notes') || 'Notes'}</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t('activity.notesPlaceholder') || 'Add details...'}
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                    <Text style={styles.submitButtonText}>{isLoading ? t('common.loading') : t('common.save')}</Text>
                </TouchableOpacity>
            </View>

            {/* Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="default"
                    onChange={(e, d) => handleDateChange(e, d, false)}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={endTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={(e, d) => handleDateChange(e, d, true)}
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
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    typeCard: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#252542',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    typeLabel: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
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
    textArea: {
        minHeight: 100,
        paddingTop: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    quickAddRow: {
        flexDirection: 'row',
        gap: 8,
    },
    quickAddBtn: {
        backgroundColor: '#3f3f5a',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    quickAddText: {
        color: '#fff',
        fontWeight: '600',
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
    moodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#252542',
        padding: 16,
        borderRadius: 12,
    },
    moodBtn: {
        padding: 8,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    moodBtnSelected: {
        backgroundColor: '#4A90D920',
        borderColor: '#4A90D9',
    },
    moodEmoji: {
        fontSize: 32,
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
