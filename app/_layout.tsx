import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/locales/i18n';
import { initDatabase } from '../src/database';

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function initialize() {
            try {
                await initDatabase();
                setIsReady(true);
            } catch (error) {
                console.error('Failed to initialize app:', error);
                setIsReady(true); // Still proceed to show error state
            }
        }
        initialize();
    }, []);

    if (!isReady) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
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
                <StatusBar style="light" />
            </SafeAreaProvider>
        </GestureHandlerRootView>
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
