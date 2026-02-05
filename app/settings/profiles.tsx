import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useProfileStore, useActiveProfile } from '../../src/hooks/useProfiles';
import { Profile } from '../../src/types';

export default function ProfilesScreen() {
    const router = useRouter();
    const { t } = useTranslation();
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
                style={[styles.profileCard, isActive && styles.activeCard]}
                onPress={() => handleSwitchProfile(item.id)}
            >
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        {/* Placeholder for avatar, or use Expo Image if URI exists */}
                        <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.profileName}>{item.name}</Text>
                        {isActive && <Text style={styles.activeLabel}>{t('profile.active') || 'Active'}</Text>}
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
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>{t('profile.manageProfiles') || 'Manage Profiles'}</Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('profile.addProfile')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('onboarding.namePlaceholder')}
                            placeholderTextColor="#64748b"
                            value={newProfileName}
                            onChangeText={setNewProfileName}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsAddModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
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
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#252542',
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
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#252542',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    activeCard: {
        borderColor: '#6366f1',
        borderWidth: 2,
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
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    profileName: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    activeLabel: {
        fontSize: 12,
        color: '#6366f1',
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
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#252542',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
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
    cancelButton: {
        backgroundColor: '#252542',
    },
    createButton: {
        backgroundColor: '#6366f1',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
