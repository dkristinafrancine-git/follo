import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('privacy.title')}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('privacy.heroTitle')}</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        {t('privacy.heroIntro')}
                    </Text>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                        <Text style={[styles.text, { color: colors.text }]}>{t('privacy.heroBullet1')}</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                        <Text style={[styles.text, { color: colors.text }]}>{t('privacy.heroBullet2')}</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                        <Text style={[styles.text, { color: colors.text }]}>{t('privacy.heroBullet3')}</Text>
                    </View>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('privacy.section1Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('privacy.section1Text')}
                    </Text>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('privacy.section2Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('privacy.section2Text')}
                    </Text>
                    <Text style={[styles.listItem, { color: colors.subtext }]}>• {t('privacy.section2Notifications')}</Text>
                    <Text style={[styles.listItem, { color: colors.subtext }]}>• {t('privacy.section2Camera')}</Text>
                    <Text style={[styles.listItem, { color: colors.subtext }]}>• {t('privacy.section2HealthConnect')}</Text>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('privacy.section3Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('privacy.section3Text')}
                    </Text>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('privacy.section4Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('privacy.section4Text')}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.subtext }]}>{t('privacy.lastUpdated')}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    text: {
        fontSize: 15,
        lineHeight: 22,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginTop: 8,
        paddingRight: 10,
    },
    bullet: {
        marginRight: 8,
        fontSize: 15,
        lineHeight: 22,
    },
    section: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    heading: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    listItem: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
        marginLeft: 8,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
    }
});
