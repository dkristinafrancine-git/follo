import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { subDays } from 'date-fns';
import { useTheme } from '../../src/context/ThemeContext';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { exportService, ReportType } from '../../src/services/exportService';

type DateRangeOption = '7d' | '30d' | '90d' | 'all';

const REPORT_TYPES: { key: ReportType; icon: string; titleKey: string; descKey: string }[] = [
    { key: 'health_summary', icon: '📊', titleKey: 'export.healthSummary', descKey: 'export.healthSummaryDesc' },
    { key: 'medication_log', icon: '💊', titleKey: 'export.medicationLog', descKey: 'export.medicationLogDesc' },
    { key: 'emergency_card', icon: '🆔', titleKey: 'export.emergencyCard', descKey: 'export.emergencyCardDesc' },
];

const DATE_RANGE_OPTIONS: { key: DateRangeOption; labelKey: string }[] = [
    { key: '7d', labelKey: 'export.last7Days' },
    { key: '30d', labelKey: 'export.last30Days' },
    { key: '90d', labelKey: 'export.last90Days' },
    { key: 'all', labelKey: 'export.allTime' },
];

export default function ExportScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { activeProfile } = useActiveProfile();

    const [selectedReport, setSelectedReport] = useState<ReportType>('health_summary');
    const [selectedRange, setSelectedRange] = useState<DateRangeOption>('30d');
    const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
    const [isGenerating, setIsGenerating] = useState(false);

    const isEmergencyCard = selectedReport === 'emergency_card';
    const showCsvOption = selectedReport === 'medication_log';

    const getDateRange = useCallback((): { start: Date; end: Date } => {
        const end = new Date();
        switch (selectedRange) {
            case '7d': return { start: subDays(end, 7), end };
            case '30d': return { start: subDays(end, 30), end };
            case '90d': return { start: subDays(end, 90), end };
            case 'all': return { start: new Date(2020, 0, 1), end };
        }
    }, [selectedRange]);

    const handleExport = useCallback(async () => {
        if (!activeProfile) {
            Alert.alert(t('common.error'), t('export.noProfile'));
            return;
        }
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            const { start, end } = getDateRange();
            await exportService.exportAndShare({
                reportType: selectedReport,
                profile: activeProfile,
                startDate: start,
                endDate: end,
                format: showCsvOption ? selectedFormat : 'pdf',
            });
        } catch (error: any) {
            console.warn('[Export] Handled:', error?.message);
            // Don't show error for user-cancelled share dialogs
            if (error?.message === 'Sharing is not available on this device') {
                // silently ignore
            } else if (error?.message?.includes('No emergency data')) {
                Alert.alert(t('export.title'), t('emergency.noData'));
            } else {
                Alert.alert(t('common.error'), t('export.exportError'));
            }
        } finally {
            setIsGenerating(false);
        }
    }, [activeProfile, selectedReport, selectedFormat, selectedRange, getDateRange, isGenerating, t, showCsvOption]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: t('export.title'),
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                    {/* Privacy Note */}
                    <View style={[styles.privacyNote, { backgroundColor: colors.card }]}>
                        <Text style={styles.privacyIcon}>🔒</Text>
                        <Text style={[styles.privacyText, { color: colors.subtext }]}>
                            {t('export.privacyNote')}
                        </Text>
                    </View>

                    {/* Report Type Section */}
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
                        {t('export.reportType')}
                    </Text>
                    <View style={styles.reportTypeContainer}>
                        {REPORT_TYPES.map((report) => {
                            const isSelected = selectedReport === report.key;
                            return (
                                <TouchableOpacity
                                    key={report.key}
                                    style={[
                                        styles.reportCard,
                                        { backgroundColor: colors.card },
                                        isSelected && { borderColor: colors.primary, borderWidth: 2 },
                                        !isSelected && { borderColor: 'transparent', borderWidth: 2 },
                                    ]}
                                    onPress={() => {
                                        setSelectedReport(report.key);
                                        // Reset format to PDF when switching away from medication_log
                                        if (report.key !== 'medication_log') {
                                            setSelectedFormat('pdf');
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.reportIcon}>{report.icon}</Text>
                                    <View style={styles.reportTextContainer}>
                                        <Text style={[
                                            styles.reportTitle,
                                            { color: colors.text },
                                            isSelected && { color: colors.primary },
                                        ]}>
                                            {t(report.titleKey)}
                                        </Text>
                                        <Text style={[styles.reportDesc, { color: colors.subtext }]}>
                                            {t(report.descKey)}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.checkMark}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Date Range Section — hidden for Emergency Card */}
                    {!isEmergencyCard && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
                                {t('export.dateRange')}
                            </Text>
                            <View style={styles.chipRow}>
                                {DATE_RANGE_OPTIONS.map((option) => {
                                    const isSelected = selectedRange === option.key;
                                    return (
                                        <TouchableOpacity
                                            key={option.key}
                                            style={[
                                                styles.chip,
                                                { backgroundColor: colors.card },
                                                isSelected && { backgroundColor: colors.primary },
                                            ]}
                                            onPress={() => setSelectedRange(option.key)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                { color: colors.text },
                                                isSelected && { color: '#ffffff', fontWeight: '700' },
                                            ]}>
                                                {t(option.labelKey)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* Format Section — only for Medication Log */}
                    {showCsvOption && (
                        <>
                            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
                                {t('export.format')}
                            </Text>
                            <View style={styles.chipRow}>
                                {(['pdf', 'csv'] as const).map((fmt) => {
                                    const isSelected = selectedFormat === fmt;
                                    return (
                                        <TouchableOpacity
                                            key={fmt}
                                            style={[
                                                styles.formatChip,
                                                { backgroundColor: colors.card },
                                                isSelected && { backgroundColor: colors.primary },
                                            ]}
                                            onPress={() => setSelectedFormat(fmt)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[
                                                styles.formatChipText,
                                                { color: colors.text },
                                                isSelected && { color: '#ffffff', fontWeight: '700' },
                                            ]}>
                                                {t(`export.${fmt}`)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Generate Button — fixed at bottom */}
                <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.generateButton,
                            { backgroundColor: colors.primary },
                            isGenerating && { opacity: 0.7 },
                        ]}
                        onPress={handleExport}
                        disabled={isGenerating}
                        activeOpacity={0.8}
                    >
                        {isGenerating ? (
                            <View style={styles.generatingRow}>
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text style={styles.generateButtonText}>{t('export.generating')}</Text>
                            </View>
                        ) : (
                            <Text style={styles.generateButtonText}>{t('export.generate')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 24,
        gap: 10,
    },
    privacyIcon: {
        fontSize: 18,
    },
    privacyText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    reportTypeContainer: {
        gap: 10,
        marginBottom: 28,
    },
    reportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
    },
    reportIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    reportTextContainer: {
        flex: 1,
    },
    reportTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    reportDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    checkMark: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 28,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    chipText: {
        fontSize: 14,
    },
    formatChip: {
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 10,
    },
    formatChipText: {
        fontSize: 15,
        fontWeight: '600',
    },
    bottomBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    generateButton: {
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    generateButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },
    generatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
});
