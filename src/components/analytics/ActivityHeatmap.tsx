import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { format, subDays, eachDayOfInterval, startOfWeek } from 'date-fns';

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
                    text: format(firstDayOfWeek, 'MMM'),
                    offset: index * (SQUARE_SIZE + GAP_SIZE)
                });
                currentMonth = month;
            }
        });

        return { weeks: weeksArray, monthLabels: labels };
    }, [data, endDate]);

    const getIntensityColor = (count: number) => {
        // Follo Dark Theme: Background #252542
        // Empty: #3e3e5e
        // Levels: Indigo/Purple based

        if (count === 0) return '#3e3e5e';
        if (count <= 1) return 'rgba(99, 102, 241, 0.4)'; // Light indigo
        if (count <= 3) return 'rgba(99, 102, 241, 0.7)'; // Medium indigo
        return '#6366f1'; // Full indigo
    };

    const getDayCount = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = data.find(d => d.date === dateStr);
        return entry ? entry.count : 0;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Consistency Map</Text>
                <Text style={styles.subtitle}>Last {WEEKS_TO_SHOW} weeks</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Days of Week Labels (Mon/Wed/Fri) */}
                <View style={styles.dayLabels}>
                    <Text style={styles.dayLabel}>Mon</Text>
                    <Text style={styles.dayLabel}>Wed</Text>
                    <Text style={styles.dayLabel}>Fri</Text>
                </View>

                <View>
                    {/* Month Labels */}
                    <View style={styles.monthRow}>
                        {monthLabels.map((label, idx) => (
                            <Text key={idx} style={[styles.monthLabel, { left: label.offset }]}>
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
