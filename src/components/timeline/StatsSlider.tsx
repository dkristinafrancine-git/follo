import { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds

interface StatCard {
    id: string;
    titleKey: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    color: string;
    icon: string;
}

interface StatsSliderProps {
    adherenceRate: number;
    activitiesThisWeek: number;
    currentStreak: number;
    upcomingMeds: number;
}

export function StatsSlider({
    adherenceRate,
    activitiesThisWeek,
    currentStreak,
    upcomingMeds,
}: StatsSliderProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    const stats: StatCard[] = [
        {
            id: 'adherence',
            titleKey: 'myFlow.medicationAdherence',
            value: adherenceRate,
            unit: '%',
            subtitle: t('stats.last7Days'),
            color: '#10b981',
            icon: '💊',
        },
        {
            id: 'activities',
            titleKey: 'myFlow.activitiesLogged',
            value: activitiesThisWeek,
            subtitle: t('stats.thisWeek'),
            color: '#6366f1',
            icon: '🏃',
        },
        {
            id: 'streak',
            titleKey: 'myFlow.streak',
            value: currentStreak,
            unit: ` ${t('myFlow.days')}`,
            subtitle: t('stats.keepItUp'),
            color: '#f59e0b',
            icon: '🔥',
        },
        {
            id: 'upcoming',
            titleKey: 'stats.upcomingMeds',
            value: upcomingMeds,
            subtitle: t('stats.next4Hours'),
            color: '#ef4444',
            icon: '⏰',
        },
    ];

    // Auto-scroll effect
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % stats.length;
            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true
            });
            setCurrentIndex(nextIndex);
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(interval);
    }, [currentIndex, stats.length]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    const renderStatCard = ({ item }: { item: StatCard }) => (
        <View style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card }]}>
            <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <View style={styles.cardTextContainer}>
                    <Text style={[styles.cardTitle, { color: colors.subtext }]}>{t(item.titleKey)}</Text>
                    <View style={styles.valueRow}>
                        <Text style={[styles.cardValue, { color: item.color }]}>
                            {item.value}
                        </Text>
                        {item.unit && (
                            <Text style={[styles.cardUnit, { color: item.color }]}>
                                {item.unit}
                            </Text>
                        )}
                    </View>
                    {item.subtitle && (
                        <Text style={[styles.cardSubtitle, { color: colors.subtext }]}>{item.subtitle}</Text>
                    )}
                </View>
            </View>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.pagination}>
            {stats.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        { backgroundColor: colors.border },
                        index === currentIndex && [styles.dotActive, { backgroundColor: colors.primary }],
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={stats}
                renderItem={renderStatCard}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                scrollEventThrottle={16}
                getItemLayout={(_, index) => ({
                    length: CARD_WIDTH,
                    offset: CARD_WIDTH * index,
                    index,
                })}
            />
            {renderPagination()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    card: {
        // backgroundColor: '#252542', // Handled by dynamic style
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 0,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 40,
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 4,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    cardValue: {
        fontSize: 36,
        fontWeight: '700',
    },
    cardUnit: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3e3e5e',
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: '#6366f1',
        width: 18,
    },
});
