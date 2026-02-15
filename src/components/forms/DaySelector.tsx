import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface DaySelectorProps {
    selectedDays: number[]; // 0-6, where 0 is Sunday
    onChange: (days: number[]) => void;
}

export function DaySelector({ selectedDays, onChange }: DaySelectorProps) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    const days = [
        { key: 0, label: 'S' },
        { key: 1, label: 'M' },
        { key: 2, label: 'T' },
        { key: 3, label: 'W' },
        { key: 4, label: 'T' },
        { key: 5, label: 'F' },
        { key: 6, label: 'S' },
    ];

    const toggleDay = (dayKey: number) => {
        if (selectedDays.includes(dayKey)) {
            onChange(selectedDays.filter(d => d !== dayKey));
        } else {
            onChange([...selectedDays, dayKey].sort());
        }
    };

    return (
        <View style={styles.container}>
            {days.map((day) => {
                const isSelected = selectedDays.includes(day.key);
                return (
                    <TouchableOpacity
                        key={day.key}
                        style={[
                            styles.dayButton,
                            {
                                backgroundColor: isSelected ? colors.primary : colors.card,
                                borderColor: isSelected ? colors.primary : colors.border
                            }
                        ]}
                        onPress={() => toggleDay(day.key)}
                    >
                        <Text style={[
                            styles.dayText,
                            { color: isSelected ? '#ffffff' : colors.text }
                        ]}>
                            {day.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 8,
    },
    dayButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
