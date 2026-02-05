import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useOnboarding } from '../../src/hooks/useProfiles';

export default function SetupChoiceScreen() {
    const { completeOnboarding } = useOnboarding();

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
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.stage}>Step 3 of 4</Text>
                    <Text style={styles.title}>What's First?</Text>
                    <Text style={styles.subtitle}>
                        Start by adding the most important thing to your routine.
                    </Text>
                </View>

                <ScrollView style={styles.options}>
                    <OptionCard
                        emoji="💊"
                        title="Medication"
                        desc="Track pills, recurring prescriptions"
                        onPress={() => handleSelect('/medication/add')}
                        color="#4A90D9"
                    />
                    <OptionCard
                        emoji="🧴"
                        title="Supplement"
                        desc="Vitamins, minerals, and more"
                        onPress={() => handleSelect('/supplement/add')}
                        color="#F59E0B"
                    />
                    <OptionCard
                        emoji="🩺"
                        title="Appointment"
                        desc="Doctor visits, checkups"
                        onPress={() => handleSelect('/appointment/add')}
                        color="#8b5cf6"
                    />
                    <OptionCard
                        emoji="🏃"
                        title="Activity"
                        desc="Exercise, therapy, meditation"
                        onPress={() => handleSelect('/activity/add')}
                        color="#10b981"
                    />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.skipButton} onPress={() => handleSelect('SKIP')}>
                        <Text style={styles.skipText}>I'll add things later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

function OptionCard({ emoji, title, desc, onPress, color }: any) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={[styles.icon, { backgroundColor: color }]}>
                <Text style={styles.emoji}>{emoji}</Text>
            </View>
            <View style={styles.text}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    stage: {
        color: '#6366f1',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9ca3af',
        lineHeight: 24,
    },
    options: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252542',
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
        color: '#fff',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: '#9ca3af',
    },
    arrow: {
        fontSize: 24,
        color: '#6366f1',
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
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '500',
    },
});
