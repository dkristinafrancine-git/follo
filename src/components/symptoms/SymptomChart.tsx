import React, { useMemo } from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { Svg, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { Symptom } from '../../repositories/symptomRepository';
import { format, parseISO, differenceInDays } from 'date-fns';

interface SymptomChartProps {
    symptoms: Symptom[];
    days?: number; // Default 14
}

export const SymptomChart: React.FC<SymptomChartProps> = ({ symptoms, days = 14 }) => {
    const { colors } = useTheme();
    const SCREEN_WIDTH = Dimensions.get('window').width;
    const chartHeight = 200;
    const chartWidth = SCREEN_WIDTH - 64; // Padding
    const paddingLeft = 30;
    const paddingBottom = 30;
    const effectiveWidth = chartWidth - paddingLeft;
    const effectiveHeight = chartHeight - paddingBottom;

    const processedData = useMemo(() => {
        if (!symptoms.length) return [];

        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - days);

        // Filter and sort
        const filtered = symptoms
            .filter(s => new Date(s.occurred_at) >= cutoff)
            .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());

        return filtered;
    }, [symptoms, days]);

    if (processedData.length === 0) {
        return (
            <View style={[styles.container, { height: 200, justifyContent: 'center', alignItems: 'center' }]}>
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
        return effectiveHeight - (percent * effectiveHeight); // Invert for SVG Y
    };

    // Group by name to assign colors
    const uniqueNames = Array.from(new Set(processedData.map(s => s.name)));
    const getColor = (name: string) => {
        const index = uniqueNames.indexOf(name);
        const palette = [
            '#ef4444', // Red
            '#f59e0b', // Amber
            '#3b82f6', // Blue
            '#10b981', // Green
            '#8b5cf6', // Violet
            '#ec4899', // Pink
        ];
        return palette[index % palette.length];
    };

    return (
        <View style={styles.container}>
            <View style={styles.legendContainer}>
                {uniqueNames.slice(0, 4).map(name => (
                    <View key={name} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: getColor(name) }]} />
                        <Text style={[styles.legendText, { color: colors.subtext }]}>{name}</Text>
                    </View>
                ))}
            </View>
            <Svg height={chartHeight} width={chartWidth}>
                {/* Y Axis Grid (Severity 1, 5, 10) */}
                {[1, 5, 10].map(val => (
                    <G key={val}>
                        <Line
                            x1={paddingLeft}
                            y1={getY(val)}
                            x2={chartWidth}
                            y2={getY(val)}
                            stroke={colors.border}
                            strokeDasharray="4 4"
                            strokeWidth="1"
                        />
                        <SvgText
                            x={0}
                            y={getY(val) + 4}
                            fill={colors.subtext}
                            fontSize="10"
                        >
                            {val}
                        </SvgText>
                    </G>
                ))}

                {/* Data Points */}
                {processedData.map((symptom) => (
                    <Circle
                        key={symptom.id}
                        cx={getX(symptom.occurred_at)}
                        cy={getY(symptom.severity)}
                        r="5"
                        fill={getColor(symptom.name)}
                        stroke={colors.card}
                        strokeWidth="2"
                    />
                ))}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
        gap: 12,
        paddingLeft: 30,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
    },
});
