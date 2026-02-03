import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function ExportScreen() {
    const { t } = useTranslation();

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: t('settings.exportData'),
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#fff',
                }}
            />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.content}>
                    <Text style={styles.title}>{t('settings.exportData')}</Text>
                    <Text style={styles.description}>Export feature coming soon...</Text>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
    },
});
