import { Stack, router, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SecurityProvider } from '../src/context/SecurityContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthGuard } from '../src/components/AuthGuard';
import '../src/locales/i18n';
import { initDatabase } from '../src/database/index';
import { useProfileStore } from '../src/hooks/useProfiles';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
    const [isDbReady, setIsDbReady] = useState(false);
    const loadProfiles = useProfileStore(state => state.loadProfiles);
    const hasCompletedOnboarding = useProfileStore(state => state.hasCompletedOnboarding);
    const isLoadingProfiles = useProfileStore(state => state.isLoading);

    useEffect(() => {
        async function initialize() {
            try {
                // Initialize database first
                await initDatabase();
                setIsDbReady(true);

                // Then load profiles
                await loadProfiles();
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setIsDbReady(true); // Still proceed to show error state
            }
        }
        initialize();
    }, []);

    // Redirect to onboarding if no profiles exist
    useEffect(() => {
        if (isDbReady && !isLoadingProfiles && !hasCompletedOnboarding) {
            router.replace('/onboarding' as Href);
        }
    }, [isDbReady, isLoadingProfiles, hasCompletedOnboarding]);

    // Show loading while initializing
    if (!isDbReady || isLoadingProfiles) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <SecurityProvider>
                        <ThemeProvider>
                            <AuthGuard>
                                <Stack
                                    screenOptions={{
                                        headerShown: false,
                                        contentStyle: { backgroundColor: '#1a1a2e' },
                                    }}
                                >
                                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                                    <Stack.Screen
                                        name="medication/[id]"
                                        options={{
                                            headerShown: true,
                                            title: 'Medication Details',
                                            headerStyle: { backgroundColor: '#1a1a2e' },
                                            headerTintColor: '#fff',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="medication/add"
                                        options={{
                                            headerShown: true,
                                            presentation: 'modal',
                                            title: 'Add Medication',
                                            headerStyle: { backgroundColor: '#1a1a2e' },
                                            headerTintColor: '#fff',
                                        }}
                                    />
                                    <Stack.Screen
                                        name="appointment/add"
                                        options={{
                                            headerShown: true,
                                            presentation: 'modal',
                                            title: 'Add Appointment',
                                            headerStyle: { backgroundColor: '#1a1a2e' },
                                            headerTintColor: '#fff',
                                        }}
                                    />
                                </Stack>
                            </AuthGuard>
                        </ThemeProvider>
                    </SecurityProvider>
                    <StatusBar style="light" />
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
});
