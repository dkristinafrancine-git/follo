import { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useReminders } from '../../src/hooks/useReminders'; // Path adjustments might be needed depending on file location
import { useTheme } from '../../src/context/ThemeContext';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { Reminder } from '../../src/types';

// Importing Swipeable from Reanimated or Gesture Handler
// Assuming standard Swipeable usage or similar component is available.
// For now, using simple list with tap to edit.

export default function ReminderListScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors } = useTheme();
    const { activeProfile: profile } = useActiveProfile();

    const { reminders, isLoading, deleteReminder, refresh } = useReminders(profile?.id);

    const handleDelete = (id: string) => {
        Alert.alert(
            t('common.delete'),
            t('reminder.deleteConfirmation'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        await deleteReminder(id);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Reminder }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/reminders/manage', params: { id: item.id } })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={getIconName(item.type)}
                        size={24}
                        color={colors.primary}
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {t(`reminder.types.${item.type}`, { defaultValue: item.type })}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.subtext }]}>
                        {getFrequencyText(item, t)} • {item.timeOfDay.join(', ')}
                    </Text>
                </View>
                {!item.isActive && (
                    <View style={[styles.statusBadge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.statusText, { color: colors.subtext }]}>{t('common.inactive')}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: t('reminder.title'),
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <FlatList
                data={reminders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color={colors.subtext} />
                            <Text style={[styles.emptyText, { color: colors.subtext }]}>
                                {t('reminder.noReminders')}
                            </Text>
                        </View>
                    ) : null
                }
                refreshing={isLoading}
                onRefresh={refresh}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/reminders/manage')}
            >
                <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
        </View>
    );
}

function getIconName(type: string): keyof typeof Ionicons.glyphMap {
    switch (type) {
        case 'supplement': return 'nutrition';
        case 'activity': return 'bicycle';
        case 'gratitude': return 'heart';
        case 'symptom': return 'thermometer';
        default: return 'alarm';
    }
}

function getFrequencyText(item: Reminder, t: any): string {
    const { frequencyRule } = item;
    if (frequencyRule.daysOfWeek) {
        const days = frequencyRule.daysOfWeek;
        if (days.length === 5 && !days.includes(0) && !days.includes(6)) return t('medication.frequencies.weekdays');
        if (days.length === 2 && days.includes(0) && days.includes(6)) return t('medication.frequencies.weekends');
        return t('medication.frequencies.specificDays');
    }
    return t(`medication.frequencies.${frequencyRule.frequency}`);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74, 144, 217, 0.1)', // Light blue tint
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    cardSubtitle: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
