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
                <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>1. Acceptance of Terms</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        By downloading or using the Follo app, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app.
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>2. Medical Disclaimer</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        Follo is designed to assist in tracking medications and health metrics. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or medication.
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>3. User Responsibility</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        You are responsible for ensuring the accuracy of the data you input into the App. We are not responsible for any missed doses or health consequences resulting from reliance on the App's notifications, which may be affected by device settings, battery life, or software issues.
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>4. Intellectual Property</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        The app itself, and all the trade marks, copyright, database rights and other intellectual property rights related to it, belong to OneDollarApps.
                    </Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>5. Changes to Terms</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        We may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes.
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
