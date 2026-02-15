import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { RecurrenceRule } from '../../types';
import { DaySelector } from './DaySelector';

interface FrequencySelectorProps {
    frequency: RecurrenceRule;
    onChange: (frequency: RecurrenceRule) => void;
    label?: string;
}

const FREQUENCIES = [
    { key: 'daily', value: { frequency: 'daily' as const } },
    { key: 'twiceDaily', value: { frequency: 'daily' as const, interval: 1 } },
    { key: 'weekly', value: { frequency: 'weekly' as const } },
    { key: 'weekdays', value: { frequency: 'weekly' as const, daysOfWeek: [1, 2, 3, 4, 5] as number[] } },
    { key: 'weekends', value: { frequency: 'weekly' as const, daysOfWeek: [0, 6] as number[] } },
    { key: 'specificDays', value: { frequency: 'weekly' as const, daysOfWeek: [] as number[] } },
] as const;

export function FrequencySelector({ frequency, onChange, label }: FrequencySelectorProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [showPicker, setShowPicker] = useState(false);

    const getFrequencyLabel = () => {
        if (frequency.daysOfWeek !== undefined && frequency.frequency === 'weekly') {
            const days = frequency.daysOfWeek;
            const isWeekdays = days.length === 5 && !days.includes(0) && !days.includes(6);
            const isWeekends = days.length === 2 && days.includes(0) && days.includes(6);
            const isSpecific = !isWeekdays && !isWeekends; // Simplification

            if (isWeekdays) return t('medication.frequencies.weekdays');
            if (isWeekends) return t('medication.frequencies.weekends');
            if (isSpecific) return t('medication.frequencies.specificDays');
        }

        const key = frequency.frequency;
        // Simple mapping for display
        return t(`medication.frequencies.${key}`);
    };

    const handleFrequencySelect = (val: any) => {
        // Correctly handling the type issue by reconstructing the object
        const newFreq: RecurrenceRule = {
            frequency: val.frequency,
            interval: val.interval,
            daysOfWeek: val.daysOfWeek
        };
        onChange(newFreq);
        setShowPicker(false);
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.subtext }]}>
                {label || t('medication.frequency')}
            </Text>

            <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.card }]}
                onPress={() => setShowPicker(true)}
            >
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                    {getFrequencyLabel()}
                </Text>
                <Text style={[styles.pickerArrow, { color: colors.subtext }]}>▼</Text>
            </TouchableOpacity>

            {/* Day Selector for Specific Days */}
            {frequency.frequency === 'weekly' && frequency.daysOfWeek !== undefined && (
                <View style={{ marginTop: 8 }}>
                    <Text style={[styles.label, { color: colors.subtext, fontSize: 12 }]}>
                        {t('medication.selectDays')}
                    </Text>
                    <DaySelector
                        selectedDays={frequency.daysOfWeek}
                        onChange={(days) => onChange({ ...frequency, daysOfWeek: days })}
                    />
                </View>
            )}

            {/* Frequency Picker Modal */}
            <Modal visible={showPicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPicker(false)}
                >
                    <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.pickerModalTitle, { color: colors.text }]}>
                            {t('medication.frequency')}
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {FREQUENCIES.map(freq => (
                                <TouchableOpacity
                                    key={freq.key}
                                    style={[
                                        styles.pickerOption,
                                        frequency.frequency === freq.value.frequency &&
                                        // Basic check, refine if needed
                                        { backgroundColor: `${colors.primary}20` },
                                    ]}
                                    onPress={() => handleFrequencySelect(freq.value)}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: colors.text },
                                        ]}
                                    >
                                        {t(`medication.frequencies.${freq.key}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerModal: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000", // Fixed color for shadow
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    pickerModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    pickerOption: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    pickerOptionText: {
        fontSize: 16,
    },
});
