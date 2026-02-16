import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { useGratitudes } from '../../src/hooks/useGratitudes';
import { format } from 'date-fns';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export default function GratitudeListScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const router = useRouter();
    const { activeProfile } = useActiveProfile();
    const { gratitudes, isLoading, refetch } = useGratitudes(activeProfile?.id ?? null);

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const renderHearts = (level: number) => {
        // Safe guard if level is missing or invalid
        const safeLevel = typeof level === 'number' ? level : 0;
        return (
            <View style={{ flexDirection: 'row', gap: 2 }}>
                {[...Array(5)].map((_, index) => (
                    <Ionicons
                        key={index}
                        name={index < safeLevel ? "heart" : "heart-outline"}
                        size={14}
                        color={index < safeLevel ? "#A855F7" : colors.subtext} // Purple color
                    />
                ))}
            </View>
        );
    };

    const formatDateSafe = (dateString: string) => {
        try {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return format(date, 'MMM d, h:mm a');
        } catch (e) {
            return '';
        }
    };

    const renderItem = ({ item }: { item: import('../../src/types').Gratitude }) => (
        <TouchableOpacity
            style={[styles.card, { borderBottomColor: colors.border }]} // Removed bg and border, kept bottom border for list item feel
            onPress={() => router.push({ pathname: '/gratitude/[id]', params: { id: item.id } })}
        >
            <View style={styles.row}>
                <View style={styles.textContainer}>
                    <Text style={[styles.content, { color: colors.text }]} numberOfLines={1}>
                        {item.content}
                    </Text>
                    <Text style={[styles.date, { color: colors.subtext }]}>
                        {formatDateSafe(item.createdAt)}
                    </Text>
                </View>
                <View style={styles.heartsContainer}>
                    {renderHearts(item.positivityLevel)}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>
                    {t('gratitude.history') || 'Gratitude History'}
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/gratitude/entry')}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : gratitudes.length === 0 ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>
                        {t('gratitude.empty') || 'No gratitude entries yet.\nStart by adding one!'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/gratitude/entry')}
                    >
                        <Text style={styles.ctaButtonText}>
                            {t('gratitude.addFirst') || 'Log Gratitude'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={gratitudes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    addButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    listContent: {
        padding: 16,
    },
    card: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 0,
        borderBottomWidth: 1,
        borderWidth: 0, // Ensure no full border
        borderRadius: 0, // Remove radius
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    heartsContainer: {
        justifyContent: 'center',
    },
    date: {
        fontSize: 11,
        marginTop: 4,
    },
    content: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    ctaButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    ctaButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});
