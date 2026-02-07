import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    interpolate,
    Easing
} from 'react-native-reanimated';

/**
 * ZenAura Component
 * A high-performance abstract animation showing soft, breathing blobs
 * Designed for a "wellness" and "gratitude" aesthetic.
 */
export const ZenAura: React.FC = () => {
    const { width } = useWindowDimensions();
    const auraSize = width * 0.6;

    // Animation values
    const breathe = useSharedValue(0);
    const driftX = useSharedValue(0);
    const driftY = useSharedValue(0);

    useEffect(() => {
        // Breathing cycle
        breathe.value = withRepeat(
            withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );

        // Drifting motion
        driftX.value = withRepeat(
            withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        driftY.value = withRepeat(
            withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const createAuraStyle = (delay: number, scaleRange: [number, number], opacityRange: [number, number]) => {
        return useAnimatedStyle(() => {
            const scale = interpolate(breathe.value, [0, 1], scaleRange);
            const opacity = interpolate(breathe.value, [0, 1], opacityRange);
            const moveX = interpolate(driftX.value, [0, 1], [-10, 10]);
            const moveY = interpolate(driftY.value, [0, 1], [-15, 15]);

            return {
                transform: [
                    { scale },
                    { translateX: moveX },
                    { translateY: moveY }
                ],
                opacity,
            };
        });
    };

    const aura1 = createAuraStyle(0, [1, 1.2], [0.3, 0.6]);
    const aura2 = createAuraStyle(1000, [0.8, 1.1], [0.2, 0.4]);
    const aura3 = createAuraStyle(2000, [1.1, 0.9], [0.1, 0.3]);

    return (
        <View style={styles.container}>
            {/* Dynamic colorful blobs with blur effects */}
            <Animated.View
                style={[
                    styles.blob,
                    { width: auraSize, height: auraSize, backgroundColor: '#6366f1', borderRadius: auraSize / 2 },
                    aura1
                ]}
            />
            <Animated.View
                style={[
                    styles.blob,
                    { width: auraSize * 0.8, height: auraSize * 0.8, backgroundColor: '#a855f7', borderRadius: auraSize / 2 },
                    aura2
                ]}
            />
            <Animated.View
                style={[
                    styles.blob,
                    { width: auraSize * 1.2, height: auraSize * 1.2, backgroundColor: '#ec4899', borderRadius: auraSize / 2 },
                    aura3
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 200,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        // We use opacity and scale to simulate "lightness"
        // In a real app we might use blurRadius if supported or SVG filters,
        // but pure View with opacity is the most performant for broad compatibility.
        // We'll layer them to create a glow.
    }
});
