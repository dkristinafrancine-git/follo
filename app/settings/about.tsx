import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const openWebsite = () => {
        // Linking.openURL('https://onedollarapps.com'); // Placeholder
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>About Us</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                <View style={styles.brandContainer}>
                    <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
                        <Text style={styles.logoText}>$1</Text>
                    </View>
                    <Text style={[styles.brandName, { color: colors.text }]}>OneDollarApps</Text>
                    <Text style={[styles.version, { color: colors.subtext }]}>Version 1.0.0</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.storyText, { color: colors.text }]}>
                        Hi, I'm just one developer on a mission.
                    </Text>
                    <Text style={[styles.storyText, { color: colors.text }]}>
                        In a world of endless monthly subscriptions, managing your health shouldn't be another financial burden. I built Follo to be a simple, honest, and affordable solution for people navigating medication and health tracking.
                    </Text>
                    <Text style={[styles.storyText, { color: colors.text }]}>
                        My goal is to create software that just makes sense—private, effective, and accessible to everyone. No hidden data selling, no complex corporate agendas. Just a useful tool to help you feel better.
                    </Text>
                    <Text style={[styles.storyText, { color: colors.text }]}>
                        Thank you for supporting independent development.
                    </Text>
                </View>

                <View style={styles.linksContainer}>
                    {/* Placeholder for future links
                    <TouchableOpacity style={styles.linkButton} onPress={openWebsite}>
                        <Text style={[styles.linkText, { color: colors.primary }]}>Visit Website</Text>
                    </TouchableOpacity>
                    */}
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
        padding: 24,
        alignItems: 'center',
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    brandName: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
    },
    card: {
        borderRadius: 16,
        padding: 24,
        width: '100%',
        marginBottom: 24,
    },
    storyText: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 16,
    },
    linksContainer: {
        alignItems: 'center',
    },
    linkButton: {
        padding: 12,
    },
    linkText: {
        fontSize: 16,
        fontWeight: '600',
    }
});
