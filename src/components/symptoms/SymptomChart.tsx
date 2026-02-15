import React, { useMemo } from 'react';
import { View, Dimensions, StyleSheet, Text, Alert } from 'react-native';
import { Svg, Line, Circle, Text as SvgText, G, Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { Symptom } from '../../repositories/symptomRepository';
import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';

interface SymptomChartProps {
    symptoms: Symptom[];
    days?: number; // Default 14
}

export const SymptomChart: React.FC<SymptomChartProps> = ({ symptoms, days = 14 }) => {
    const { colors } = useTheme();
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const chartHeight = 220; // Slightly taller
    const chartWidth = SCREEN_WIDTH - 64; // Padding
    const paddingLeft = 40; // More room for labels
    const paddingBottom = 40;
    const effectiveWidth = chartWidth - paddingLeft;
    const effectiveHeight = chartHeight - paddingBottom;

    const processedData = useMemo(() => {
        if (!symptoms.length) return [];
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - days);

        // Filter and sort by date
        const filtered = symptoms
            .filter(s => new Date(s.occurred_at) >= cutoff)
            .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());

        // We need to handle multiple data points (different symptoms) on same chart
        // For a simplified view, let's plot "Max Daily Severity" or create separate lines per symptom?
        // User asked for "Easy to understand". Let's do a single "Overall Symptom Load" line, 
        // OR better yet, just plot the points but connect them with a smooth curve if they are same symptom type.
        // Actually, easiest for general view is "Average Severity" per day if multiple, or just plot incidents.
        // Let's stick to incidents but make the layout cleaner.

        return filtered;
    }, [symptoms, days]);

    if (processedData.length === 0) {
        return (
            <View style={[styles.container, { height: chartHeight, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.subtext }}>No recent symptoms logged</Text>
            </View>
        );
    }

    const startTime = new Date().getTime() - (days * 24 * 60 * 60 * 1000);
    const endTime = new Date().getTime();
    const timeRange = endTime - startTime;

    const getX = (dateStr: string) => {
        const time = new Date(dateStr).getTime();
        const percent = Math.max(0, Math.min(1, (time - startTime) / timeRange));
        return paddingLeft + (percent * effectiveWidth);
    };

    const getY = (severity: number) => {
        // Severity 1-10
        const percent = (severity - 1) / 9; // 1->0, 10->1
        return effectiveHeight - (percent * effectiveHeight);
    };

    // Helper for color coding severity
    const getSeverityColor = (severity: number) => {
        if (severity >= 8) return colors.danger || '#ef4444'; // Severe
        if (severity >= 5) return colors.warning || '#f59e0b'; // Moderate
        return colors.success || '#10b981'; // Mild
    };

    const handlePointPress = (symptom: Symptom) => {
        Haptics.selectionAsync();
        Alert.alert(
            symptom.name,
            `Time: ${format(parseISO(symptom.occurred_at), 'MMM d, h:mm a')}\nSeverity: ${symptom.severity}/10 (${symptom.severity >= 8 ? 'Severe' : symptom.severity >= 5 ? 'Moderate' : 'Mild'})\n${symptom.notes ? `\nNotes: ${symptom.notes}` : ''}`
        );
    };

    return (
        <View style={styles.container}>
            {/* Descriptive Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.subtext }]}>Recent Trends</Text>
                <View style={styles.severityLegend}>
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} /><Text style={[styles.legendText, { color: colors.subtext }]}>Severe</Text>
                    <View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={[styles.legendText, { color: colors.subtext }]}>Moderate</Text>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={[styles.legendText, { color: colors.subtext }]}>Mild</Text>
                </View>
            </View>

            <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                    <LinearGradient id="chartGradient" x1="0" y1="1" x2="0" y2="0">
                        <Stop offset="0" stopColor={colors.success} stopOpacity="0.1" />
                        <Stop offset="0.5" stopColor={colors.warning} stopOpacity="0.1" />
                        <Stop offset="1" stopColor={colors.danger} stopOpacity="0.1" />
                    </LinearGradient>
                </Defs>

                {/* Severity Zones Background (Optional but nice) */}
                <Rect x={paddingLeft} y={0} width={effectiveWidth} height={effectiveHeight / 3} fill={colors.danger} fillOpacity={0.05} />
                <Rect x={paddingLeft} y={effectiveHeight / 3} width={effectiveWidth} height={effectiveHeight / 3} fill={colors.warning} fillOpacity={0.05} />
                <Rect x={paddingLeft} y={(effectiveHeight / 3) * 2} width={effectiveWidth} height={effectiveHeight / 3} fill={colors.success} fillOpacity={0.05} />

                {/* Y Axis Grid & Labels */}
                {[1, 5, 8].map(val => (
                    <G key={val}>
                        <Line
                            x1={paddingLeft}
                            y1={getY(val)}
                            x2={chartWidth}
                            y2={getY(val)}
                            stroke={colors.border}
                            strokeDasharray="4 4"
                            strokeWidth="1"
                            opacity={0.5}
                        />
                        <SvgText
                            x={paddingLeft - 8}
                            y={getY(val) + 4}
                            fill={colors.subtext}
                            fontSize="10"
                            textAnchor="end"
                            fontWeight="500"
                        >
                            {val === 8 ? 'Severe' : val === 5 ? 'Mod' : 'Mild'}
                        </SvgText>
                    </G>
                ))}

                {/* X Axis Labels */}
                {[0, 0.5, 1].map(percent => {
                    const time = startTime + (percent * timeRange);
                    const date = new Date(time);
                    const x = paddingLeft + (percent * effectiveWidth);
                    const safeX = Math.min(Math.max(x, paddingLeft + 20), chartWidth - 20);
                    return (
                        <SvgText
                            key={percent}
                            x={safeX}
                            y={chartHeight - 15}
                            fill={colors.subtext}
                            fontSize="10"
                            textAnchor="middle"
                        >
                            {format(date, 'MMM d')}
                        </SvgText>
                    );
                })}

                {/* Data Points */}
                {processedData.map((symptom, index) => {
                    // Connect lines between same symptoms? 
                    // For clarity, let's just draw distinct, clear points with "lollipop" lines to the bottom visually anchoring them in time.
                    const cx = getX(symptom.occurred_at);
                    const cy = getY(symptom.severity);
                    const color = getSeverityColor(symptom.severity);

                    return (
                        <G key={symptom.id}>
                            {/* Lollipop Line */}
                            <Line
                                x1={cx}
                                y1={cy}
                                x2={cx}
                                y2={effectiveHeight}
                                stroke={color}
                                strokeWidth="1"
                                opacity={0.3}
                            />
                            {/* Point */}
                            <Circle
                                cx={cx}
                                cy={cy}
                                r="6"
                                fill={color}
                                stroke={colors.card}
                                strokeWidth="2"
                                onPress={() => handlePointPress(symptom)}
                            />
                        </G>
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 0,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    severityLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 10,
        marginLeft: 2,
    },
    legendContainer: {
        // Unused now
    },
});

