import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    interpolate,
    Extrapolate,
    runOnJS
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const QUOTE_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'];

export const QuoteCarousel = () => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const opacity = useSharedValue(1);

    const quotes = useMemo(() =>
        QUOTE_KEYS.map(key => ({
            text: t(`gratitude.quotes.${key}.text`),
            author: t(`gratitude.quotes.${key}.author`),
        })),
        [t]
    );

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        opacity.value = withTiming(1, { duration: 1000 });
    }, [opacity, quotes.length]);

    useEffect(() => {
        const interval = setInterval(() => {
            opacity.value = withTiming(0, { duration: 1000 }, (finished) => {
                if (finished) {
                    runOnJS(nextSlide)();
                }
            });
        }, 8000); // Change every 8 seconds

        return () => clearInterval(interval);
    }, [nextSlide, opacity]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const currentQuote = quotes[currentIndex];

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.slide, animatedStyle]}>
                <View style={styles.contentContainer}>
                    <Text style={[styles.quoteText, { color: colors.subtext }]}>
                        "{currentQuote.text}"
                    </Text>
                    <Text style={[styles.authorText, { color: colors.subtext }]}>
                        - {currentQuote.author}
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 100, // Fixed small height to prevent layout shifts
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    slide: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quoteText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 4,
        lineHeight: 20,
    },
    authorText: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.8,
    }
});
