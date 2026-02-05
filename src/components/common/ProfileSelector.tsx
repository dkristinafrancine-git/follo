import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Image,
    Pressable,
    Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Profile } from '../../types';
import { getProfileAvatarUrl } from '../../services/avatarService';

interface ProfileSelectorProps {
    profiles: Profile[];
    activeProfile: Profile | null;
    onSelectProfile: (profileId: string) => void;
    onAddProfile?: () => void;
}

export function ProfileSelector({
    profiles,
    activeProfile,
    onSelectProfile,
    onAddProfile,
}: ProfileSelectorProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: isOpen ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isOpen]);

    const handleSelect = (profileId: string) => {
        Haptics.selectionAsync();
        onSelectProfile(profileId);
        setIsOpen(false);
    };

    const avatarUrl = activeProfile
        ? getProfileAvatarUrl(activeProfile.name, activeProfile.id)
        : null;

    return (
        <View style={styles.container}>
            {/* Trigger Button */}
            <TouchableOpacity
                style={styles.trigger}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsOpen(true);
                }}
                activeOpacity={0.7}
            >
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.triggerAvatar} />
                ) : (
                    <View style={styles.triggerAvatarPlaceholder}>
                        <Text style={styles.triggerAvatarText}>👤</Text>
                    </View>
                )}
                <View style={styles.triggerContent}>
                    <Text style={styles.greeting}>
                        {t('timeline.greeting', { name: activeProfile?.name ?? 'User' })}
                    </Text>
                    <Text style={styles.hint}>
                        {profiles.length > 1 ? t('profile.tapToSwitch') : t('profile.yourProfile')}
                    </Text>
                </View>
                <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal
                visible={isOpen}
                transparent
                animationType="none"
                onRequestClose={() => setIsOpen(false)}
            >
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setIsOpen(false)}
                >
                    <Animated.View
                        style={[
                            styles.dropdown,
                            { opacity: fadeAnim }
                        ]}
                    >
                        <Text style={styles.dropdownTitle}>{t('profile.selectProfile')}</Text>

                        <FlatList
                            data={profiles}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.profileItem,
                                        item.id === activeProfile?.id && styles.profileItemActive,
                                    ]}
                                    onPress={() => handleSelect(item.id)}
                                >
                                    <Image
                                        source={{ uri: getProfileAvatarUrl(item.name, item.id) }}
                                        style={styles.profileAvatar}
                                    />
                                    <View style={styles.profileInfo}>
                                        <Text style={styles.profileName}>{item.name}</Text>
                                        {item.isPrimary && (
                                            <Text style={styles.primaryBadge}>{t('profile.primary')}</Text>
                                        )}
                                    </View>
                                    {item.id === activeProfile?.id && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            style={styles.profileList}
                        />

                        {onAddProfile && (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => {
                                    setIsOpen(false);
                                    onAddProfile();
                                }}
                            >
                                <Text style={styles.addButtonIcon}>+</Text>
                                <Text style={styles.addButtonText}>{t('profile.addProfile')}</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#252542',
        borderRadius: 16,
    },
    triggerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1a2e',
    },
    triggerAvatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    triggerAvatarText: {
        fontSize: 24,
    },
    triggerContent: {
        flex: 1,
        marginLeft: 12,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    hint: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    chevron: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 4,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-start',
        paddingTop: 100,
        paddingHorizontal: 16,
    },
    dropdown: {
        backgroundColor: '#252542',
        borderRadius: 16,
        padding: 16,
        maxHeight: 400,
    },
    dropdownTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    profileList: {
        maxHeight: 250,
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    profileItemActive: {
        backgroundColor: '#3e3e5e',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a2e',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#ffffff',
    },
    primaryBadge: {
        fontSize: 12,
        color: '#6366f1',
        marginTop: 2,
    },
    checkmark: {
        fontSize: 18,
        color: '#10b981',
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#3e3e5e',
        borderStyle: 'dashed',
        marginTop: 8,
    },
    addButtonIcon: {
        fontSize: 20,
        color: '#6366f1',
        marginRight: 8,
    },
    addButtonText: {
        fontSize: 16,
        color: '#6366f1',
        fontWeight: '500',
    },
});
