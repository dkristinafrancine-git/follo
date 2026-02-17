
import '../src/utils/cryptoPolyfill'; // MUST be first to polyfill crypto.getRandomValues
import { Stack, router, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
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
import * as KeepAwake from 'expo-keep-awake';

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

        // Check for initial launch from alarm (Cold Start)
        checkInitialNotification();

        // Safety: Ensure no accidental keep-awake is stuck
        try {
            KeepAwake.deactivateKeepAwake();
        } catch (e) {
            // Silence silent errors
        }

        // Listen for AppState changes (Warm Start / Background -> Foreground)
        const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
            console.log('[Layout] AppState changed:', nextAppState);
            if (nextAppState === 'active') {
                console.log('[Layout] AppState is active. Re-running checkInitialNotification()');
                checkInitialNotification();
            }
        });

        // Listen for foreground events (e.g. user presses action)
        const unsubscribe = notifee.onForegroundEvent(async (event) => {
            console.log('[Layout] Notifee Foreground Event:', event.type, event.detail.pressAction?.id, event.detail.notification?.android?.channelId);
            await notificationService.handleNotificationEvent(event);

            // Also check for alarm usage in foreground (if active)
            if (event.type === EventType.PRESS && (event.detail.pressAction?.id === 'full-screen' || event.detail.notification?.android?.channelId === 'heavy_sleeper_alarm_v3')) {
                console.log('[Layout] Redirecting to Alarm Screen');
                router.replace({
                    pathname: '/alarm',
                    params: { eventId: String(event.detail.notification?.data?.eventId) }
                });
            }
        });

        return () => {
            unsubscribe();
            appStateSubscription.remove();
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
                    name="symptom/add"
                    options={{
                        headerShown: true,
                        presentation: 'modal',
                        title: 'Log Symptom',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <Stack.Screen
                    name="reminders"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="event-summary"
                    options={{
                        headerShown: true,
                        title: 'Event Details',
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
// Check for initial notification launch
async function checkInitialNotification() {
    try {
        const initialNotification = await notifee.getInitialNotification();
        console.log('[Layout] checkInitialNotification raw:', JSON.stringify(initialNotification, null, 2));

        if (initialNotification) {
            const { notification } = initialNotification;
            if (handleNotificationRouting(notification)) return;
        } else {
            console.log('[Layout] No initial notification found. Checking ACTIVE notifications (Warm Start)...');
            const displayed = await notifee.getDisplayedNotifications();
            console.log('[Layout] Displayed notifications count:', displayed.length);

            const activeAlarm = displayed.find(n =>
                n.notification.android?.channelId === 'heavy_sleeper_alarm_v3' ||
                n.notification.data?.type === 'heavy_sleeper'
            );

            if (activeAlarm) {
                console.log('[Layout] ACTIVE EVENT FOUND! Routing active alarm:', activeAlarm.notification.id);
                handleNotificationRouting(activeAlarm.notification);
            }
        }
    } catch (e) {
        console.error('[Layout] Error checking initial notification:', e);
    }
}

function handleNotificationRouting(notification: any): boolean {
    const channelId = notification.android?.channelId;
    const eventId = notification.data?.eventId;

    // Broaden check slightly for debugging
    if ((channelId === 'heavy_sleeper_alarm_v3' || notification.data?.type === 'heavy_sleeper') && eventId) {
        console.log('[Layout] MATCH FOUND! Attempting navigation in 500ms...');
        setTimeout(() => {
            console.log('[Layout] Navigating to /alarm now!');
            router.replace({
                pathname: '/alarm',
                params: { eventId: String(eventId) }
            });
        }, 500);
        return true;
    }
    return false;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
});
