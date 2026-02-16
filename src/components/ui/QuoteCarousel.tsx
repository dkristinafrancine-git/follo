import React, { useState, useEffect, useCallback } from 'react';
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

const { width } = Dimensions.get('window');

const quotes = [
    { text: "Gratitude turns what we have into enough.", author: "Melody Beattie" },
    { text: "Enjoy the little things, for one day you may look back and realize they were the big things.", author: "Robert Brault" },
    { text: "Wear gratitude like a cloak, and it will feed every corner of your life.", author: "Rumi" },
    { text: "It is not joy that makes us grateful; it is gratitude that makes us joyful.", author: "David Steindl-Rast" },
    { text: "Start each day with a positive thought and a grateful heart.", author: "Roy T. Bennett" }
];

export const QuoteCarousel = () => {
    const { colors } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const opacity = useSharedValue(1);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        opacity.value = withTiming(1, { duration: 1000 });
    }, [opacity]);

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
