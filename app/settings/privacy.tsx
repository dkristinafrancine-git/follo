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
                <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Your Data Stays With You</Text>
                    <Text style={[styles.text, { color: colors.text }]}>
                        Follo is designed with a "Local First" architecture. This means:
                    </Text>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                        <Text style={[styles.text, { color: colors.text }]}>All your health data, logs, and settings are stored ONLY on your device.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                        <Text style={[styles.text, { color: colors.text }]}>We do not have a remote server or database that stores your personal information.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
                        <Text style={[styles.text, { color: colors.text }]}>Data never leaves your device unless you explicitly choose to export or share it.</Text>
                    </View>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>1. Information Collection</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        We do not collect, transmit, or store any personal information on external servers. The app operates entirely offline regarding data storage.
                    </Text>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>2. App Permissions</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        Follo requests permissions solely for functionality:
                    </Text>
                    <Text style={[styles.listItem, { color: colors.subtext }]}>• Notifications: To send you medication reminders.</Text>
                    <Text style={[styles.listItem, { color: colors.subtext }]}>• Camera/Gallery: For medication image recognition (processed locally).</Text>
                    <Text style={[styles.listItem, { color: colors.subtext }]}>• Health Connect: To sync steps or other metrics (optional, processed locally).</Text>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>3. Data Security</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        Since data is stored locally, the security of your data largely depends on the security of your device. We recommend using a device PIN or biometric lock. Follo also offers an optional in-app PIN lock for added privacy.
                    </Text>
                </View>

                <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.heading, { color: colors.text }]}>4. Changes to This Policy</Text>
                    <Text style={[styles.text, { color: colors.subtext }]}>
                        We may update our Privacy Policy from time to time. Thus, you are advised to review this page periodically for any changes.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.subtext }]}>Last updated: February 2026</Text>
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
