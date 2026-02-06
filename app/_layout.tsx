import { Stack, router, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SecurityProvider } from '../src/context/SecurityContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthGuard } from '../src/components/AuthGuard';
import '../src/locales/i18n';
import { initDatabase } from '../src/database/index';
import { useProfileStore } from '../src/hooks/useProfiles';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import notifee, { EventType } from '@notifee/react-native';
import { notificationService } from '../src/services/notificationService';

export default function RootLayout() {
    const [isDbReady, setIsDbReady] = useState(false);
    const loadProfiles = useProfileStore(state => state.loadProfiles);
    const hasCompletedOnboarding = useProfileStore(state => state.hasCompletedOnboarding);
    const isLoadingProfiles = useProfileStore(state => state.isLoading);

    useEffect(() => {
        async function initialization() {
            try {
                // Initialize database first
                await initDatabase();
                setIsDbReady(true);

                // Initialize notifications (channels, permissions)
                try {
                    await notificationService.initialize();
                } catch (e) {
                    console.error('Failed to init notifications:', e);
                }

                // Then load profiles
                await loadProfiles();
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setIsDbReady(true); // Still proceed to show error state
            }
        }
        initialization();

        // Check for initial launch from alarm
        checkInitialNotification();

        // Listen for foreground events
        const unsubscribe = notifee.onForegroundEvent(async (event) => {
            await notificationService.handleNotificationEvent(event);

            // Also check for alarm usage in foreground (if active)
            if (event.type === EventType.PRESS && event.detail.notification?.android?.channelId === 'heavy_sleeper_alarm_v2') {
                router.replace({
                    pathname: '/alarm',
                    params: { eventId: String(event.detail.notification.data?.eventId) }
                });
            }
        });

        return () => {
            unsubscribe();
        };
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
                            <ThemedStack />
                        </ThemeProvider>
                    </SecurityProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

// Separate component to access useTheme context
function ThemedStack() {
    const { colors, themeMode } = useTheme();

    return (
        <AuthGuard>
            <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen
                    name="medication/[id]"
                    options={{
                        headerShown: true,
                        title: 'Medication Details',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <Stack.Screen
                    name="medication/add"
                    options={{
                        headerShown: true,
                        presentation: 'modal',
                        title: 'Add Medication',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <Stack.Screen
                    name="appointment/add"
                    options={{
                        headerShown: true,
                        presentation: 'modal',
                        title: 'Add Appointment',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <Stack.Screen
                    name="alarm"
                    options={{
                        headerShown: false,
                        gestureEnabled: false,
                        animation: 'fade',
                    }}
                />
            </Stack>
        </AuthGuard>
    );
}

// Check for initial notification launch
async function checkInitialNotification() {
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
        const { notification } = initialNotification;
        if (notification.android?.channelId === 'heavy_sleeper_alarm_v2' && notification.data?.eventId) {
            // Give it a moment for navigation to mount
            setTimeout(() => {
                router.replace({
                    pathname: '/alarm',
                    params: { eventId: String(notification.data?.eventId) }
                });
            }, 500);
        }
    }
}

// Call this inside the main component initialization


const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
});
