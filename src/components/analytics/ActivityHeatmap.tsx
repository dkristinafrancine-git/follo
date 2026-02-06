import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { format, subDays, eachDayOfInterval, startOfWeek } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

// Constants
const SQUARE_SIZE = 14;
const GAP_SIZE = 4;
const WEEKS_TO_SHOW = 20; // Approx 5 months

interface HeatmapDataPoint {
    date: string; // YYYY-MM-DD
    count: number;
}

interface ActivityHeatmapProps {
    data: HeatmapDataPoint[];
    onDayPress?: (date: string, count: number) => void;
    endDate?: Date;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
    data,
    onDayPress,
    endDate = new Date()
}) => {
    const { t, i18n } = useTranslation();
    const { colors, themeMode } = useTheme();

    // Helper to hex to rgb for opacity (simplified)
    const getBaseColor = (count: number) => {
        // We will just use opacity on the primary color for simplicity/consistency
        // Or specific logic if needed
        return colors.primary;
    };

    const dateLocale = useMemo(() => {
        return i18n.language.startsWith('ko') ? ko : enUS;
    }, [i18n.language]);

    const { weeks, monthLabels } = useMemo(() => {
        const end = endDate;
        const start = subDays(end, (WEEKS_TO_SHOW * 7) - 1);

        // Align start to Sunday
        const alignedStart = startOfWeek(start);

        const allDays = eachDayOfInterval({ start: alignedStart, end });

        const weeksArray: Date[][] = [];
        let currentWeek: Date[] = [];

        allDays.forEach((day) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeksArray.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            weeksArray.push(currentWeek);
        }

        const labels: { text: string, offset: number }[] = [];
        let currentMonth = -1;

        weeksArray.forEach((week, index) => {
            const firstDayOfWeek = week[0];
            const month = firstDayOfWeek.getMonth();

            if (month !== currentMonth) {
                labels.push({
                    text: format(firstDayOfWeek, 'MMM', { locale: dateLocale }),
                    offset: index * (SQUARE_SIZE + GAP_SIZE)
                });
                currentMonth = month;
            }
        });

        return { weeks: weeksArray, monthLabels: labels };
    }, [data, endDate, dateLocale]);

    const getIntensityColor = (count: number) => {
        if (count === 0) {
            return themeMode === 'dark' ? '#3e3e5e' : '#e5e7eb';
        }

        // Simple opacity based on count
        // Note: colors.primary is usually a hex string. We need to handle opacity.
        // For simplicity, we can fallback to hardcoded indigos if primary matches default, 
        // or just use opacity if we had a hexToRgba utility. 
        // Given the constraints, let's keep the indigo scale but map it to primary if possible?
        // Actually, let's just stick to the indigo scale but with proper empty color for now, 
        // OR simply rely on the fact that existing logic was hardcoded.
        // Let's try to obey the theme primary color if possible.
        // Since we don't have a color manipulator handy in imports, let's stick to the existing logic 
        // but switch the 0 count color.

        // However, if the user changes primary color in future, this breaks. 
        // But for "Light/Dark" toggle of strict "DarkTheme/LightTheme", primary is same '#6366f1'.
        // So we can largely keep it, just fix the empty slot.

        if (themeMode === 'dark') {
            if (count <= 1) return 'rgba(99, 102, 241, 0.4)';
            if (count <= 3) return 'rgba(99, 102, 241, 0.7)';
            return '#6366f1';
        } else {
            // Light mode: maybe slightly different opacities or just same?
            if (count <= 1) return 'rgba(99, 102, 241, 0.4)';
            if (count <= 3) return 'rgba(99, 102, 241, 0.7)';
            return '#6366f1';
        }
    };

    const getDayCount = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = data.find(d => d.date === dateStr);
        return entry ? entry.count : 0;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t('myFlow.consistencyMap')}</Text>
                <Text style={[styles.subtitle, { color: colors.subtext }]}>{t('myFlow.lastWeeks', { count: WEEKS_TO_SHOW })}</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Days of Week Labels (Mon/Wed/Fri) */}
                <View style={styles.dayLabels}>
                    <Text style={styles.dayLabel}>{i18n.language.startsWith('ko') ? '월' : 'Mon'}</Text>
                    <Text style={styles.dayLabel}>{i18n.language.startsWith('ko') ? '수' : 'Wed'}</Text>
                    <Text style={styles.dayLabel}>{i18n.language.startsWith('ko') ? '금' : 'Fri'}</Text>
                </View>

                <View>
                    {/* Month Labels */}
                    <View style={styles.monthRow}>
                        {monthLabels.map((label, idx) => (
                            <Text key={idx} style={[styles.monthLabel, { left: label.offset, color: colors.subtext }]}>
                                {label.text}
                            </Text>
                        ))}
                    </View>

                    {/* Grid */}
                    <View style={styles.grid}>
                        {weeks.map((week, weekIdx) => (
                            <View key={weekIdx} style={styles.column}>
                                {week.map((day, dayIdx) => {
                                    const count = getDayCount(day);
                                    return (
                                        <TouchableOpacity
                                            key={day.toISOString()}
                                            style={[
                                                styles.cell,
                                                { backgroundColor: getIntensityColor(count) },
                                                day > new Date() && { opacity: 0 }
                                            ]}
                                            onPress={() => onDayPress?.(format(day, 'yyyy-MM-dd'), count)}
                                            disabled={day > new Date()}
                                        />
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#252542',
        padding: 16,
        borderRadius: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        alignItems: 'baseline'
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 12,
        color: '#9ca3af',
    },
    scrollContent: {
        paddingRight: 8,
    },
    dayLabels: {
        marginTop: 20,
        marginRight: 8,
        justifyContent: 'space-between',
        height: (SQUARE_SIZE + GAP_SIZE) * 7 - GAP_SIZE,
        paddingVertical: 0,
    },
    dayLabel: {
        fontSize: 10,
        color: '#6b7280',
        height: SQUARE_SIZE,
        textAlignVertical: 'center',
        marginBottom: GAP_SIZE * 2 + 1,
    },
    monthRow: {
        flexDirection: 'row',
        height: 16,
        marginBottom: 4,
        position: 'relative',
    },
    monthLabel: {
        position: 'absolute',
        fontSize: 10,
        color: '#9ca3af',
    },
    grid: {
        flexDirection: 'row',
    },
    column: {
        marginRight: GAP_SIZE,
    },
    cell: {
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        borderRadius: 3,
        marginBottom: GAP_SIZE,
    },
});
