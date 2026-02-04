import { useEffect } from 'react';
import { router, Href } from 'expo-router';
import { useProfileStore } from '../../src/hooks/useProfiles';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Onboarding entry point - redirects based on onboarding state
 * - No profiles: go to welcome carousel
 * - Has profiles but no medications: go to first medication
 * - Complete: go to main tabs
 */
export default function OnboardingIndex() {
    const hasCompletedOnboarding = useProfileStore(state => state.hasCompletedOnboarding);
    const isLoading = useProfileStore(state => state.isLoading);

    useEffect(() => {
        if (!isLoading) {
            if (hasCompletedOnboarding) {
                // Already completed, go to main app
                router.replace('/(tabs)' as Href);
            } else {
                // Start onboarding flow
                router.replace('/onboarding/welcome' as Href);
            }
        }
    }, [isLoading, hasCompletedOnboarding]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#6366f1" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
});
