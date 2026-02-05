import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Svg, Rect, Text as SvgText, Line } from 'react-native-svg';
import { TouchableOpacity, Alert } from 'react-native';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { myFlowService, careMetricsService, exportService, MyFlowStats, AdherenceDataPoint, CareInsight } from '../../src/services';
import { activityRepository } from '../../src/repositories/activityRepository';
import { ActivityHeatmap } from '../../src/components/analytics/ActivityHeatmap';
import { Ionicons } from '@expo/vector-icons';
import { subDays } from 'date-fns';
import { useTheme } from '../../src/context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MyFlowScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { activeProfile } = useActiveProfile();
    const [stats, setStats] = useState<MyFlowStats | null>(null);
    const [history, setHistory] = useState<AdherenceDataPoint[]>([]);

    const [insights, setInsights] = useState<CareInsight[]>([]);
    const [heatmapData, setHeatmapData] = useState<{ date: string, count: number }[]>([]);

    const loadData = useCallback(async () => {
        if (!activeProfile) return;
        try {
            const dashboardStats = await myFlowService.getDashboardStats(activeProfile.id);
            setStats(dashboardStats);
            const historyData = await myFlowService.getAdherenceHistory(activeProfile.id);
            setHistory(historyData);
            const insightsData = await careMetricsService.getDashboardInsights(activeProfile.id);
            setInsights(insightsData);


            // Heatmap Data (Last 20 weeks approx 140 days)
            const endDate = new Date();
            const startDate = subDays(endDate, 150);
            const activityData = await activityRepository.getActivityHeatmapData(
                activeProfile.id,
                startDate.toISOString(),
                endDate.toISOString()
            );
            setHeatmapData(activityData);
        } catch (error) {
            console.error('Failed to load My Flow data:', error);
        }
    }, [activeProfile]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleExport = async () => {
        if (!activeProfile) return;
        try {
            await exportService.exportAndShare({
                reportType: 'health_summary',
                profile: activeProfile,
                startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
                endDate: new Date(),
                format: 'pdf'
            });
        } catch (error) {
            Alert.alert(t('common.error'), 'Failed to export report');
        }
    };

    const renderChart = () => {
        if (history.length === 0) return null;

        const chartHeight = 150;
        const chartWidth = SCREEN_WIDTH - 80;
        const barWidth = (chartWidth / history.length) - 10;
        const maxValue = 100;

        return (
            <Svg height={chartHeight} width={chartWidth}>
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((val) => (
                    <Line
                        key={val}
                        x1="0"
                        y1={chartHeight - (val / maxValue) * chartHeight}
                        x2={chartWidth}
                        y2={chartHeight - (val / maxValue) * chartHeight}
                        stroke={colors.border}
                        strokeWidth="1"
                    />
                ))}

                {history.map((point, index) => {
                    const barHeight = (point.percentage / maxValue) * chartHeight;
                    return (
                        <View key={index}>
                            <Rect
                                x={index * (barWidth + 10)}
                                y={chartHeight - barHeight}
                                width={barWidth}
                                height={barHeight}
                                fill={point.percentage >= 80 ? '#10b981' : point.percentage >= 50 ? '#f59e0b' : '#ef4444'}
                                rx="4"
                            />
                            <SvgText
                                x={index * (barWidth + 10) + barWidth / 2}
                                y={chartHeight - 5}
                                fill={colors.subtext}
                                fontSize="10"
                                textAnchor="middle"
                            >
                                {point.date.split('-')[2]}
                            </SvgText>
                        </View>
                    );
                })}
            </Svg>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={[styles.title, { color: colors.text }]}>{t('myFlow.title')}</Text>
                            {activeProfile && (
                                <Text style={[styles.subtitle, { color: colors.subtext }]}>
                                    {t('common.for')} {activeProfile.name}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Insights Section */}
                {insights.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Care Insights</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                            {insights.map((insight, index) => (
                                <View key={index} style={[styles.insightCard, { backgroundColor: colors.card }]}>
                                    <View style={styles.insightHeader}>
                                        <Text style={[styles.insightTitle, { color: colors.subtext }]}>{insight.title}</Text>
                                        <Ionicons
                                            name={insight.trend === 'up' ? 'trending-up' : insight.trend === 'down' ? 'trending-down' : 'remove'}
                                            size={16}
                                            color={insight.trend === 'up' ? colors.success : insight.trend === 'down' ? colors.danger : colors.subtext}
                                        />
                                    </View>
                                    <Text style={[styles.insightValue, { color: colors.text }]}>{insight.value}</Text>
                                    <Text style={[styles.insightDesc, { color: colors.subtext }]}>{insight.description}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Adherence Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('myFlow.adherence')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[
                            styles.percentage,
                            { color: (stats?.adherencePercentage ?? 0) >= 80 ? colors.success : (stats?.adherencePercentage ?? 0) >= 50 ? colors.warning : colors.danger }
                        ]}>
                            {stats ? `${stats.adherencePercentage}%` : '--%'}
                        </Text>
                        <Text style={[styles.cardLabel, { color: colors.text }]}>{t('myFlow.medicationAdherence')}</Text>
                        <Text style={[styles.subtext, { color: colors.subtext }]}>{t('myFlow.lastSevenDays')}</Text>
                    </View>
                </View>

                {/* Activity Heatmap Section */}
                <View style={styles.section}>
                    {/* ActivityHeatmap fits nicely here as it has its own title inside, but we can wrap it if needed */}
                    <ActivityHeatmap
                        data={heatmapData}
                        onDayPress={(date, count) => {
                            // Optional: Show tooltip or toast
                        }}
                    />
                </View>

                {/* Chart Section */}
                {history.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('myFlow.history')}</Text>
                        <View style={[styles.card, styles.chartCard, { backgroundColor: colors.card }]}>
                            {renderChart()}
                        </View>
                    </View>
                )}

                {/* Activity Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('myFlow.activities')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={styles.count}>{stats?.activitiesLogged ?? 0}</Text>
                        <Text style={[styles.cardLabel, { color: colors.text }]}>{t('myFlow.activitiesLogged')}</Text>
                        <Text style={[styles.subtext, { color: colors.subtext }]}>{t('myFlow.today')}</Text>
                    </View>
                </View>

                {/* Streak Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('myFlow.streak')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                        <Text style={[styles.count, { color: colors.warning }]}>{stats?.streakDays ?? 0}</Text>
                        <Text style={[styles.cardLabel, { color: colors.text }]}>{t('myFlow.days')}</Text>
                        <Text style={[styles.subtext, { color: colors.subtext }]}>{t('myFlow.currentStreak')}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        paddingVertical: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exportButton: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        padding: 10,
        borderRadius: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    chartCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    percentage: {
        fontSize: 48,
        fontWeight: '700',
        color: '#6366f1',
    },
    count: {
        fontSize: 48,
        fontWeight: '700',
        color: '#10b981',
    },
    cardLabel: {
        fontSize: 14,
        color: '#ffffff',
        marginTop: 8,
        fontWeight: '500',
    },
    subtext: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    insightCard: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 16,
        width: 160,
        height: 120,
        justifyContent: 'space-between',
    },
    insightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    insightTitle: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    insightValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginVertical: 4,
    },
    insightDesc: {
        color: '#6b7280',
        fontSize: 10,
    },
});
