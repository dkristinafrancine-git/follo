import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Line, Circle, Text as SvgText, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Gratitude } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';

interface PositivityChartProps {
    data: Gratitude[];
    height?: number;
    width?: number;
}

export const PositivityChart: React.FC<PositivityChartProps> = ({
    data,
    height = 200,
    width = Dimensions.get('window').width - 48
}) => {
    const { colors } = useTheme();
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return (
            <View style={[styles.container, { height, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={{ color: colors.subtext }}>{t('gratitude.noData') || 'No gratitude data yet'}</Text>
            </View>
        );
    }

    // Sort by date ascending
    const sortedData = [...data].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Limit to last 7 entries for simplicity if too many, or handle grouping logic elsewhere
    // For now, let's show the last 7 data points
    const chartData = sortedData.slice(-7);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Y-axis: 0 to max + 1
    const minY = 0;
    const maxValInSet = Math.max(...chartData.map(d => d.positivityLevel), 5); // Default to at least 5
    const maxY = maxValInSet + 1;

    const getX = (index: number) => {
        if (chartData.length <= 1) return padding + chartWidth / 2;
        return padding + (index * (chartWidth / (chartData.length - 1)));
    };

    const getY = (value: number) => {
        return padding + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;
    };

    const pathD = chartData.length > 1 ? chartData.map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.positivityLevel)}`
    ).join(' ') : '';

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.subtext }]}>
                {t('gratitude.chartTitle') || 'Positivity Flow'}
            </Text>
            <Svg height={height} width={width}>
                <Defs>
                    <LinearGradient id="positivityGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={colors.primary} stopOpacity="0.5" />
                        <Stop offset="1" stopColor={colors.primary} stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>

                {/* Grid Lines - Show 5 evenly spaced lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const val = Math.round(minY + (maxY - minY) * ratio);
                    return (
                        <React.Fragment key={ratio}>
                            <Line
                                x1={padding}
                                y1={getY(val)}
                                x2={width - padding}
                                y2={getY(val)}
                                stroke={colors.border}
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                            <SvgText
                                x={padding - 10}
                                y={getY(val) + 4}
                                fill={colors.subtext}
                                fontSize="10"
                                textAnchor="end"
                            >
                                {val}
                            </SvgText>
                        </React.Fragment>
                    );
                })}

                {/* Data Line */}
                {chartData.length > 1 && (
                    <Path
                        d={pathD}
                        stroke={colors.primary}
                        strokeWidth="3"
                        fill="none"
                    />
                )}

                {/* Data Points */}
                {chartData.map((point, index) => (
                    <React.Fragment key={point.id}>
                        <Circle
                            cx={getX(index)}
                            cy={getY(point.positivityLevel)}
                            r="4"
                            fill={colors.card}
                            stroke={colors.primary}
                            strokeWidth="2"
                        />
                        {/* Date Label */}
                        <SvgText
                            x={getX(index)}
                            y={height - padding + 20}
                            fill={colors.subtext}
                            fontSize="10"
                            textAnchor="middle"
                        >
                            {format(new Date(point.createdAt), 'dd')}
                        </SvgText>
                    </React.Fragment>
                ))}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
