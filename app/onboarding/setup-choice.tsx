import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../src/hooks/useProfiles';
import { useTheme } from '../../src/context/ThemeContext';

export default function SetupChoiceScreen() {
    const { t } = useTranslation();
    const { completeOnboarding } = useOnboarding();
    const { colors } = useTheme();

    const handleSelect = (path: string) => {
        // We route to the regular Add screens but might want to ensure they handle "post-success" routing correctly.
        // For MVP, regular add screens usually pop back.
        // If we are in Onboarding, we might want them to replace or push.
        // Let's assume we push, and the user can navigate back to "Tabs" eventually.
        // But actually, we need to mark onboarding complete *after* they add.
        // Or we mark it complete now, and just route them.

        // Strategy: Mark complete now, then route to the Add screen inside the app flow.
        completeOnboarding();
        // Since onboarding state changes, the root layout might redirect to (tabs).
        // We might need to use a slight delay or rely on the fact that `completeOnboarding` updates state.

        // Better: Route to (tabs) then push the add screen? 
        // Or just let them go to Tabs and use FAB.
        // User asked for "Optional creation".

        if (path === 'SKIP') {
            completeOnboarding();
            router.replace('/(tabs)' as Href);
        } else {
            // For a smoother flow, we could pass a param to 'onboarding/add-x' but reusing existing screens is better.
            // We will route to (tabs) first, then push the modal?
            // Actually, simplest is: Mark complete -> Router replace (tabs) -> Router push (add).
            completeOnboarding();
            setTimeout(() => {
                router.replace('/(tabs)' as Href);
                setTimeout(() => router.push(path as Href), 100);
            }, 0);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.stage, { color: colors.primary }]}>{t('onboarding.step', { current: 3, total: 4 })}</Text>
                    <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.whatsFirstTitle')}</Text>
                    <Text style={[styles.subtitle, { color: colors.subtext }]}>
                        {t('onboarding.whatsFirstSubtitle')}
                    </Text>
                </View>

                <ScrollView style={styles.options}>
                    <OptionCard
                        emoji="💊"
                        title={t('onboarding.addMedication')}
                        desc={t('onboarding.addMedicationDesc')}
                        onPress={() => handleSelect('/medication/add')}
                        color="#4A90D9"
                        colors={colors}
                    />
                    <OptionCard
                        emoji="🧴"
                        title={t('onboarding.addSupplement')}
                        desc={t('onboarding.addSupplementDesc')}
                        onPress={() => handleSelect('/supplement/add')}
                        color="#F59E0B"
                        colors={colors}
                    />
                    <OptionCard
                        emoji="🩺"
                        title={t('onboarding.addAppointment')}
                        desc={t('onboarding.addAppointmentDesc')}
                        onPress={() => handleSelect('/appointment/add')}
                        color="#8b5cf6"
                        colors={colors}
                    />
                    <OptionCard
                        emoji="🏃"
                        title={t('onboarding.addActivity')}
                        desc={t('onboarding.addActivityDesc')}
                        onPress={() => handleSelect('/activity/add')}
                        color="#10b981"
                        colors={colors}
                    />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.skipButton} onPress={() => handleSelect('SKIP')}>
                        <Text style={[styles.skipText, { color: colors.subtext }]}>{t('onboarding.addLater')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

function OptionCard({ emoji, title, desc, onPress, color, colors }: any) {
    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress}>
            <View style={[styles.icon, { backgroundColor: color }]}>
                <Text style={styles.emoji}>{emoji}</Text>
            </View>
            <View style={styles.text}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.cardDesc, { color: colors.subtext }]}>{desc}</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    stage: {
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    options: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    icon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    emoji: {
        fontSize: 24,
    },
    text: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
    },
    arrow: {
        fontSize: 24,
        marginLeft: 8,
    },
    footer: {
        marginTop: 16,
        alignItems: 'center',
    },
    skipButton: {
        padding: 16,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

