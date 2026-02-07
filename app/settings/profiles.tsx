import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useProfileStore, useActiveProfile } from '../../src/hooks/useProfiles';
import { Profile } from '../../src/types';
import { useTheme } from '../../src/context/ThemeContext';

export default function ProfilesScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const { profiles, deleteProfile, createProfile } = useProfileStore();
    const { activeProfile, setActiveProfile } = useActiveProfile();

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    const handleSwitchProfile = async (profileId: string) => {
        await setActiveProfile(profileId);
    };

    const handleDeleteProfile = (profile: Profile) => {
        if (profiles.length <= 1) {
            Alert.alert(t('common.error'), "Cannot delete the only profile.");
            return;
        }

        Alert.alert(
            t('common.delete'),
            `Are you sure you want to delete profile "${profile.name}"? This cannot be undone.`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        await deleteProfile(profile.id);
                    }
                }
            ]
        );
    };

    const handleCreateProfile = async () => {
        if (!newProfileName.trim()) {
            Alert.alert(t('common.error'), t('onboarding.nameRequired'));
            return;
        }

        try {
            await createProfile(newProfileName.trim());
            setIsAddModalVisible(false);
            setNewProfileName('');
        } catch (error) {
            Alert.alert(t('common.error'), "Failed to create profile.");
        }
    };

    const renderItem = ({ item }: { item: Profile }) => {
        const isActive = item.id === activeProfile?.id;

        return (
            <TouchableOpacity
                style={[
                    styles.profileCard,
                    { backgroundColor: colors.card },
                    isActive && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleSwitchProfile(item.id)}
            >
                <View style={styles.profileInfo}>
                    <View style={[styles.avatarContainer, { backgroundColor: item.avatarUri ? 'transparent' : colors.primary }]}>
                        {item.avatarUri ? (
                            <Image
                                source={{ uri: item.avatarUri }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
                        )}
                    </View>
                    <View>
                        <Text style={[styles.profileName, { color: colors.text }]}>{item.name}</Text>
                        {isActive && <Text style={[styles.activeLabel, { color: colors.primary }]}>{t('profile.active') || 'Active'}</Text>}
                    </View>
                </View>

                {!isActive && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(item);
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('profile.manageProfiles') || 'Manage Profiles'}</Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={profiles}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
            />

            <Modal
                visible={isAddModalVisible}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.addProfile')}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                            placeholder={t('onboarding.namePlaceholder')}
                            placeholderTextColor={colors.subtext}
                            value={newProfileName}
                            onChangeText={setNewProfileName}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.card }]}
                                onPress={() => setIsAddModalVisible(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={handleCreateProfile}
                            >
                                <Text style={styles.createButtonText}>{t('common.add')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
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
    listContent: {
        padding: 16,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '500',
    },
    activeLabel: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontWeight: '600',
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

