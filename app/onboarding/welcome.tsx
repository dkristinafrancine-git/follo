import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Animated,
    Dimensions,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

interface WelcomeSlide {
    id: string;
    emoji: string;
    titleKey: string;
    descriptionKey: string;
    color: string;
}

const SLIDES: WelcomeSlide[] = [
    {
        id: '1',
        emoji: '💊',
        titleKey: 'onboarding.slides.medications.title',
        descriptionKey: 'onboarding.slides.medications.description',
        color: '#6366f1',
    },
    {
        id: '2',
        emoji: '📅',
        titleKey: 'onboarding.slides.appointments.title',
        descriptionKey: 'onboarding.slides.appointments.description',
        color: '#10b981',
    },
    {
        id: '3',
        emoji: '📊',
        titleKey: 'onboarding.slides.insights.title',
        descriptionKey: 'onboarding.slides.insights.description',
        color: '#f59e0b',
    },
    {
        id: '4',
        emoji: '🔒',
        titleKey: 'onboarding.slides.privacy.title',
        descriptionKey: 'onboarding.slides.privacy.description',
        color: '#ef4444',
    },
];

export default function WelcomeScreen() {
    const { t } = useTranslation();
    const { mode } = useLocalSearchParams<{ mode: string }>();
    const isTutorialMode = mode === 'tutorial';

    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const renderSlide = ({ item }: { item: WelcomeSlide }) => (
        <View style={[styles.slide, { width }]}>
            <View style={[styles.emojiContainer, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.emoji} accessibilityLabel={item.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
            <Text style={styles.slideDescription}>{t(item.descriptionKey)}</Text>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.pagination} accessibilityRole="adjustable" accessibilityLabel={`Page ${currentIndex + 1} of ${SLIDES.length}`}>
            {SLIDES.map((_, index) => {
                const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            { width: dotWidth, opacity, backgroundColor: SLIDES[index].color },
                        ]}
                    />
                );
            })}
        </View>
    );

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            if (isTutorialMode) {
                router.back();
            } else {
                // Go to profile creation
                router.push('/onboarding/profile' as Href);
            }
        }
    };

    const handleSkip = () => {
        if (isTutorialMode) {
            router.back();
        } else {
            router.push('/onboarding/profile' as Href);
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with Skip */}
            <View style={styles.header}>
                <View style={styles.brandingContainer}>
                    <Image
                        source={require('../../assets/favicon.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoText} accessibilityRole="header">Follo</Text>
                </View>
                {currentIndex < SLIDES.length - 1 && (
                    <TouchableOpacity
                        onPress={handleSkip}
                        accessibilityRole="button"
                        accessibilityLabel={isTutorialMode ? t('common.close') || 'Close' : t('onboarding.skip')}
                        accessibilityHint="Skips the tutorial"
                    >
                        <Text style={styles.skipText}>
                            {isTutorialMode ? t('common.close') || 'Close' : t('onboarding.skip')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
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
            />

            {/* Pagination */}
            {renderPagination()}

            {/* Bottom Actions */}
            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: SLIDES[currentIndex].color }]}
                    onPress={handleNext}
                    accessibilityRole="button"
                    accessibilityLabel={currentIndex < SLIDES.length - 1 ? t('onboarding.next') : (isTutorialMode ? t('common.done') || 'Done' : t('onboarding.getStarted'))}
                >
                    <Text style={styles.nextButtonText}>
                        {currentIndex < SLIDES.length - 1
                            ? t('onboarding.next')
                            : (isTutorialMode ? t('common.done') || 'Done' : t('onboarding.getStarted'))
                        }
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    brandingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 32,
        height: 32,
        marginRight: 8,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    skipText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emojiContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    emoji: {
        fontSize: 56,
    },
    slideTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
    },
    slideDescription: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 32,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    nextButton: {
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
});
