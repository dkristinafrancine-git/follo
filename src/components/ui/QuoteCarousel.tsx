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

const backgrounds = [
    require('../../../assets/images/quote_bg_forest.png'),
    require('../../../assets/images/quote_bg_ocean.png'),
    require('../../../assets/images/quote_bg_sky.png'),
    require('../../../assets/images/quote_bg_leaves.png'),
    require('../../../assets/images/quote_bg_abstract.png')
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
    const currentBg = backgrounds[currentIndex % backgrounds.length];

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.slide, animatedStyle]}>
                <Image
                    source={currentBg}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
                <View style={styles.overlay} />
                <View style={styles.contentContainer}>
                    <Text style={styles.quoteText}>
                        "{currentQuote.text}"
                    </Text>
                    <Text style={styles.authorText}>
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
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        backgroundColor: '#f0f0f0', // Placeholder color while loading
    },
    slide: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for text readability
    },
    contentContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quoteText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 26,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    authorText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    }
});
