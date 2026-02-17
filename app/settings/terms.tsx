import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('terms.title')}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('terms.section1Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('terms.section1Text')}
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('terms.section2Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('terms.section2Text')}
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('terms.section3Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('terms.section3Text')}
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('terms.section4Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('terms.section4Text')}
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>{t('terms.section5Title')}</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        {t('terms.section5Text')}
                    </Text>
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
    section: {
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    heading: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        lineHeight: 22,
    },
});
