import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyFlowScreen() {
    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('myFlow.title')}</Text>
                </View>

                {/* Adherence Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('myFlow.adherence')}</Text>
                    <View style={styles.card}>
                        <Text style={styles.percentage}>--%</Text>
                        <Text style={styles.cardLabel}>{t('myFlow.medicationAdherence')}</Text>
                    </View>
                </View>

                {/* Activity Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('myFlow.activities')}</Text>
                    <View style={styles.card}>
                        <Text style={styles.count}>0</Text>
                        <Text style={styles.cardLabel}>{t('myFlow.activitiesLogged')}</Text>
                    </View>
                </View>

                {/* Streak Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('myFlow.streak')}</Text>
                    <View style={styles.card}>
                        <Text style={styles.count}>0</Text>
                        <Text style={styles.cardLabel}>{t('myFlow.days')}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        paddingVertical: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    percentage: {
        fontSize: 48,
        fontWeight: '700',
        color: '#6366f1',
    },
    count: {
        fontSize: 48,
        fontWeight: '700',
        color: '#10b981',
    },
    cardLabel: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
    },
});
