/**
 * ActivityForm Component
 * Form for adding and editing activities/exercises
 */

import { useState } from 'react';
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
import { useTheme } from '../../context/ThemeContext';

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: string }[] = [
    { type: 'exercise', label: 'Exercise', icon: '🏋️' },
    { type: 'meditation', label: 'Meditation', icon: '🧘' },
    { type: 'therapy', label: 'Therapy', icon: '🗣️' },
    { type: 'journaling', label: 'Journaling', icon: '✍️' },
    { type: 'meal', label: 'Meal', icon: '🥗' },
    { type: 'other', label: 'Other', icon: '✨' },
];

const MOODS = ['😢', '😕', '😐', '🙂', '😄'];

interface ActivityFormProps {
    initialValues?: Partial<Activity>;
    onSubmit: (data: CreateActivityInput) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ActivityForm({ initialValues, onSubmit, onCancel, isLoading = false }: ActivityFormProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // Form State
    const [selectedType, setSelectedType] = useState<ActivityType>(initialValues?.type || 'exercise');
    const [title, setTitle] = useState(initialValues?.title || '');
    const [duration, setDuration] = useState(initialValues?.durationMinutes?.toString() || '30');
    const [intensity, setIntensity] = useState(initialValues?.intensity || 'medium');
    const [moodBefore, setMoodBefore] = useState(initialValues?.moodBefore || 3);
    const [notes, setNotes] = useState(initialValues?.notes || '');
    const [completedAt, setCompletedAt] = useState(initialValues?.completedAt ? new Date(initialValues.completedAt) : new Date());

    // Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!title.trim() && selectedType === 'other') newErrors.title = t('common.required');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const defaultTitle = ACTIVITY_TYPES.find(t => t.type === selectedType)?.label || 'Activity';

        const activityData: CreateActivityInput = {
            profileId: initialValues?.profileId || '', // Injected by parent
            type: selectedType,
            title: title.trim() || defaultTitle,
            durationMinutes: parseInt(duration) || 0,
            intensity: intensity as 'low' | 'medium' | 'high',
            moodBefore,
            notes: notes.trim() || undefined,
            completedAt: completedAt.toISOString(),
        };

        await onSubmit(activityData);
    };

    const handleDateChange = (event: unknown, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDate = new Date(completedAt);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setCompletedAt(newDate);
        }
    };

    const handleTimeChange = (event: unknown, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDate = new Date(completedAt);
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            setCompletedAt(newDate);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            {/* Activity Type Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('activity.type') || 'Activity Type'}</Text>
            <View style={styles.typesGrid}>
                {ACTIVITY_TYPES.map((item) => (
                    <TouchableOpacity
                        key={item.type}
                        style={[
                            styles.typeCard,
                            { backgroundColor: colors.card },
                            selectedType === item.type && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setSelectedType(item.type)}
                    >
                        <Text style={styles.typeIcon}>{item.icon}</Text>
                        <Text style={[
                            styles.typeLabel,
                            { color: colors.subtext },
                            selectedType === item.type && { color: '#ffffff', fontWeight: '700' }
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Details Section */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('activity.title') || 'Title (Optional)'}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={ACTIVITY_TYPES.find(t => t.type === selectedType)?.label}
                    placeholderTextColor={colors.subtext}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('activity.duration') || 'Duration (min)'}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="number-pad"
                        placeholder="30"
                        placeholderTextColor={colors.subtext}
                    />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('activity.intensity') || 'Intensity'}</Text>
                    <View style={styles.intensityContainer}>
                        {(['low', 'medium', 'high'] as const).map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={[
                                    styles.intensityButton,
                                    { backgroundColor: colors.card },
                                    intensity === level && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => setIntensity(level)}
                            >
                                <Text style={[
                                    styles.intensityText,
                                    { color: colors.subtext },
                                    intensity === level && { color: '#ffffff', fontWeight: '600' }
                                ]}>
                                    {level.charAt(0).toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Date & Time */}
            <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('activity.date') || 'Date'}</Text>
                    <TouchableOpacity
                        style={[styles.pickerButton, { backgroundColor: colors.card }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                            {format(completedAt, 'MMM d, yyyy')}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>{t('activity.time') || 'Time'}</Text>
                    <TouchableOpacity
                        style={[styles.pickerButton, { backgroundColor: colors.card }]}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                            {format(completedAt, 'HH:mm')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Mood Selection */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('activity.mood') || 'Mood Before'}</Text>
                <View style={[styles.moodContainer, { backgroundColor: colors.card }]}>
                    {MOODS.map((emoji, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.moodButton,
                                moodBefore === index + 1 && { backgroundColor: `${colors.primary}30`, borderColor: colors.primary }
                            ]}
                            onPress={() => setMoodBefore(index + 1)}
                        >
                            <Text style={styles.moodEmoji}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Notes */}
            <View style={styles.field}>
                <Text style={[styles.label, { color: colors.subtext }]}>{t('common.notes') || 'Notes'}</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t('common.notesPlaceholder') || 'How did it go?'}
                    placeholderTextColor={colors.subtext}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.card }]} onPress={onCancel} disabled={isLoading}>
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isLoading}>
                    <Text style={styles.submitButtonText}>{isLoading ? t('common.loading') : t('common.save')}</Text>
                </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            {showDatePicker && (
                <DateTimePicker
                    value={completedAt}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={completedAt}
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    typesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    typeCard: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    typeIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    typeLabel: {
        fontSize: 12,
        textAlign: 'center',
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
    textArea: {
        minHeight: 100,
        paddingTop: 16,
    },
    intensityContainer: {
        flexDirection: 'row',
        height: 50,
        gap: 8,
    },
    intensityButton: {
        flex: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    intensityText: {
        fontWeight: '600',
        fontSize: 14,
    },
    pickerButton: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'center',
        height: 50,
    },
    pickerButtonText: {
        fontSize: 16,
    },
    moodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
    },
    moodButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    moodEmoji: {
        fontSize: 24,
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
