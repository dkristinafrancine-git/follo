import { useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { addDays, format, isToday, isSameDay, startOfDay } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 48) / 7; // 7 days visible, 24px padding each side

interface DateCarouselProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    daysRange?: number; // Number of days before and after today
}

interface DayItem {
    date: Date;
    key: string;
}

export function DateCarousel({
    selectedDate,
    onSelectDate,
    daysRange = 7
}: DateCarouselProps) {
    const { t, i18n } = useTranslation();
    const { colors } = useTheme();
    const flatListRef = useRef<FlatList>(null);

    // Generate array of dates centered around today
    const dates = useMemo(() => {
        const today = startOfDay(new Date());
        const result: DayItem[] = [];

        for (let i = -daysRange; i <= daysRange; i++) {
            const date = addDays(today, i);
            result.push({
                date,
                key: format(date, 'yyyy-MM-dd'),
            });
        }
        return result;
    }, [daysRange]);

    // Find initial scroll index (today)
    const todayIndex = daysRange;

    const handleSelectDate = useCallback((date: Date) => {
        Haptics.selectionAsync();
        onSelectDate(date);
    }, [onSelectDate]);

    const scrollToToday = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        flatListRef.current?.scrollToIndex({
            index: todayIndex,
            animated: true,
            viewPosition: 0.5
        });
        onSelectDate(startOfDay(new Date()));
    }, [todayIndex, onSelectDate]);

    const renderDay = useCallback(({ item }: { item: DayItem }) => {
        const isSelected = isSameDay(item.date, selectedDate);
        const isTodayDate = isToday(item.date);

        // Get localized day name (3 letters)
        const dayName = format(item.date, 'EEE', {
            locale: i18n.language === 'ko' ? undefined : undefined // date-fns auto-detects
        });
        const dayNumber = format(item.date, 'd');

        return (
            <TouchableOpacity
                style={[
                    styles.dayContainer,
                    isSelected && { backgroundColor: colors.primary },
                    isTodayDate && !isSelected && { backgroundColor: `${colors.primary}20` },
                ]}
                onPress={() => handleSelectDate(item.date)}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.dayName,
                    { color: colors.subtext },
                    isSelected && { color: '#ffffff' },
                    isTodayDate && !isSelected && { color: colors.primary },
                ]}>
                    {dayName}
                </Text>
                <Text style={[
                    styles.dayNumber,
                    { color: colors.text },
                    isSelected && { color: '#ffffff' },
                    isTodayDate && !isSelected && { color: colors.primary },
                ]}>
                    {dayNumber}
                </Text>
                {isTodayDate && (
                    <View style={[
                        styles.todayDot,
                        { backgroundColor: colors.primary },
                        isSelected && { backgroundColor: '#ffffff' },
                    ]} />
                )}
            </TouchableOpacity>
        );
    }, [selectedDate, handleSelectDate, i18n.language]);

    return (
        <View style={styles.container}>
            {/* Today button */}
            <TouchableOpacity
                style={styles.todayButton}
                onPress={scrollToToday}
            >
                <Text style={[styles.todayButtonText, { color: colors.primary }]}>{t('timeline.today')}</Text>
            </TouchableOpacity>

            {/* Date carousel */}
            <FlatList
                ref={flatListRef}
                data={dates}
                renderItem={renderDay}
                keyExtractor={(item) => item.key}
                horizontal
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={todayIndex}
                getItemLayout={(_, index) => ({
                    length: DAY_WIDTH,
                    offset: DAY_WIDTH * index,
                    index,
                })}
                contentContainerStyle={styles.listContent}
                snapToInterval={DAY_WIDTH}
                decelerationRate="fast"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // backgroundColor: '#252542', // Handled by dynamic style
        borderRadius: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    todayButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginRight: 12,
        marginBottom: 8,
    },
    todayButtonText: {
        color: '#6366f1',
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 8,
    },
    dayContainer: {
        width: DAY_WIDTH,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 12,
    },
    daySelected: {
        backgroundColor: '#6366f1',
    },
    dayToday: {
        backgroundColor: '#6366f120',
    },
    dayName: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    dayNameSelected: {
        color: '#ffffff',
    },
    dayNameToday: {
        color: '#6366f1',
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    dayNumberSelected: {
        color: '#ffffff',
    },
    dayNumberToday: {
        color: '#6366f1',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#6366f1',
        marginTop: 4,
    },
    todayDotSelected: {
        backgroundColor: '#ffffff',
    },
});
