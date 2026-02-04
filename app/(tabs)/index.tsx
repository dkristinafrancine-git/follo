import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useProfiles, useActiveProfile } from '../../src/hooks/useProfiles';
import { ProfileSelector } from '../../src/components/common/ProfileSelector';

export default function TimelineScreen() {
    const { t } = useTranslation();
    const { profiles } = useProfiles();
    const { activeProfile, setActiveProfile } = useActiveProfile();

    const handleAddProfile = () => {
        // Navigate to profile creation (can add dedicated screen later)
        router.push('/onboarding' as Href);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Profile Selector */}
                <ProfileSelector
                    profiles={profiles}
                    activeProfile={activeProfile}
                    onSelectProfile={setActiveProfile}
                    onAddProfile={handleAddProfile}
                />

                {/* Date Carousel placeholder */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('timeline.today')}</Text>
                </View>

                {/* Stats Slider placeholder */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsText}>{t('timeline.noData')}</Text>
                </View>

                {/* Upcoming section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('timeline.upcoming')}</Text>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{t('timeline.noUpcoming')}</Text>
                    </View>
                </View>

                {/* History section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('timeline.history')}</Text>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{t('timeline.noHistory')}</Text>
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
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 12,
    },
    statsCard: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
    },
    statsText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
    },
    emptyState: {
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
    },
});
