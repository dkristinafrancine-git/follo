import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router, Href } from 'expo-router';

import { useSecurity } from '../../src/hooks/useSecurity';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useProfileStore } from '../../src/hooks/useProfiles';
import { resetDatabase } from '../../src/database/index';
import { useTheme } from '../../src/context/ThemeContext';
import { useSettings } from '../../src/hooks/useSettings';
import { checkHeavySleeperPermissions, requestDndAccess, requestExactAlarmPermission, requestFullScreenIntentPermission, requestAppearOnTopPermission, type HeavySleeperPermissions } from '../../src/modules/FullScreenIntentModule';
import { NotificationModeModal } from '../../src/components/NotificationModeModal';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const { themeMode, toggleTheme, colors } = useTheme();
    const [isKorean, setIsKorean] = useState(i18n.language === 'ko');

    const [hasBiometrics, setHasBiometrics] = useState(false);

    // Security Context
    const {
        hasPin,
        isBiometricsEnabled,
        toggleBiometrics,
        autoLockTimeout,
        setAutoLockTimeout
    } = useSecurity();

    const { notificationMode, setNotificationMode, loadSettings } = useSettings();
    const [permissions, setPermissions] = useState<HeavySleeperPermissions>({
        dndAccess: true,
        exactAlarm: true,
        fullScreenIntent: true,
        appearOnTop: true
    });
    const [showModeModal, setShowModeModal] = useState(false);

    const loadProfiles = useProfileStore(state => state.loadProfiles);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        const checkHardware = async () => {
            // Check Biometrics
            const bio = await LocalAuthentication.hasHardwareAsync();
            setHasBiometrics(bio);
        };
        checkHardware();
    }, []);

    const toggleLanguage = () => {
        const newLang = isKorean ? 'en' : 'ko';
        i18n.changeLanguage(newLang);
        setIsKorean(!isKorean);
    };



    const handleDeleteAllData = () => {
        Alert.alert(
            t('settings.dangerZone'),
            t('settings.deleteAllConfirm') || "Are you sure you want to delete ALL data? This action cannot be undone.",
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.deleteAllData'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. Clear SecureStore (PIN, etc.)
                            await SecureStore.deleteItemAsync('auth_pin_hash');
                            await SecureStore.deleteItemAsync('auth_biometrics_enabled');
                            await SecureStore.deleteItemAsync('auth_auto_lock_timeout');

                            // 2. Reset Database
                            await resetDatabase();

                            // 3. Clear Zustand & Reload
                            await loadProfiles();

                            // 4. Navigate to Onboarding
                            router.replace('/onboarding' as Href);

                            Alert.alert(t('common.success'), "All data has been deleted.");
                        } catch (error) {
                            console.error(error);
                            Alert.alert(t('common.error'), "Failed to delete data.");
                        }
                    }
                }
            ]
        );
    };

    const handleModeSelect = async (mode: 'home' | 'heavy_sleeper') => {
        setShowModeModal(false);
        if (mode === 'home') {
            await setNotificationMode('home');
        } else {
            await setNotificationMode('heavy_sleeper');

            // Check all permissions on Android 12+
            if (Platform.OS === 'android' && Platform.Version >= 31) {
                const perms = await checkHeavySleeperPermissions();
                setPermissions(perms);

                const missingPerms: string[] = [];
                if (!perms.dndAccess) missingPerms.push('Do Not Disturb Access');
                if (!perms.exactAlarm) missingPerms.push('Exact Alarms');
                if (!perms.fullScreenIntent) missingPerms.push('Full-Screen Alarms');
                if (!perms.appearOnTop) missingPerms.push('Appear on Top');

                if (missingPerms.length > 0) {
                    Alert.alert(
                        'Permissions Required',
                        `Heavy Sleeper mode requires the following permissions:\n\n${missingPerms.map(p => `• ${p}`).join('\n')}\n\nYou'll be guided through enabling each one.`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Continue',
                                onPress: async () => {
                                    // Request permissions sequentially
                                    if (!perms.dndAccess) {
                                        Alert.alert(
                                            'Step 1: Do Not Disturb Access',
                                            'Enable "Do Not Disturb access" for Follo to allow alarms to override silent mode.',
                                            [
                                                { text: 'Skip', style: 'cancel' },
                                                { text: 'Open Settings', onPress: () => requestDndAccess() }
                                            ]
                                        );
                                    } else if (!perms.exactAlarm) {
                                        Alert.alert(
                                            'Step 2: Exact Alarms',
                                            'Enable "Alarms & reminders" permission to schedule precise alarm times.',
                                            [
                                                { text: 'Skip', style: 'cancel' },
                                                { text: 'Open Settings', onPress: () => requestExactAlarmPermission() }
                                            ]
                                        );
                                    } else if (!perms.fullScreenIntent) {
                                        Alert.alert(
                                            'Step 3: Full-Screen Alarms',
                                            'Enable "Show on lock screen" to wake your device with full-screen alarms.',
                                            [
                                                { text: 'Skip', style: 'cancel' },
                                                { text: 'Open Settings', onPress: () => requestFullScreenIntentPermission() }
                                            ]
                                        );
                                    } else if (!perms.appearOnTop) {
                                        Alert.alert(
                                            'Step 4: Appear on Top',
                                            'Enable "Display over other apps" to show full-screen alarms on top of all apps.',
                                            [
                                                { text: 'Skip', style: 'cancel' },
                                                { text: 'Open Settings', onPress: () => requestAppearOnTopPermission() }
                                            ]
                                        );
                                    }
                                }
                            }
                        ]
                    );
                }
            }
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
                    <View style={styles.logoContainer}>
                        <Image
                            source={themeMode === 'dark'
                                ? require('../../assets/settings-logo-dark-theme.png.png')
                                : require('../../assets/settings-logo-light-theme.png.png')
                            }
                            style={styles.logo}
                        />
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.appearance') || 'Appearance'}</Text>
                    <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.darkMode') || 'Dark Mode'}</Text>
                        <Switch
                            value={themeMode === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#d1d5db', true: colors.primary }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>

                {/* Profile Management Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('profile.yourProfile') || 'Profiles'}</Text>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/settings/profiles' as Href)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.manageProfiles') || 'Manage Profiles'}</Text>
                        <Text style={[styles.arrow, { color: colors.subtext }]}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.security')}</Text>

                    {/* App Lock (PIN) */}
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => {
                            router.push({
                                pathname: '/auth/pin',
                                params: { mode: hasPin ? 'disable' : 'setup' }
                            });
                        }}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.appLock')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.settingValue, { marginRight: 8, color: colors.primary }]}>
                                {hasPin ? t('common.on') : t('common.off')}
                            </Text>
                            <Switch
                                value={hasPin}
                                onValueChange={() => {
                                    router.push({
                                        pathname: '/auth/pin',
                                        params: { mode: hasPin ? 'disable' : 'setup' }
                                    });
                                }}
                                trackColor={{ false: '#d1d5db', true: colors.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Change PIN */}
                    {hasPin && (
                        <TouchableOpacity
                            style={[styles.settingRow, { backgroundColor: colors.card }]}
                            onPress={() => {
                                router.push({
                                    pathname: '/auth/pin',
                                    params: { mode: 'setup' } // 'setup' implies changing/setting new
                                });
                            }}
                        >
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.changePin')}</Text>
                            <Text style={[styles.arrow, { color: colors.subtext }]}>→</Text>
                        </TouchableOpacity>
                    )}

                    {/* Biometrics */}
                    {hasPin && hasBiometrics && (
                        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.biometrics')}</Text>
                            <Switch
                                value={isBiometricsEnabled}
                                onValueChange={toggleBiometrics}
                                trackColor={{ false: '#d1d5db', true: colors.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    )}

                    {/* Auto-Lock Timeout */}
                    {hasPin && (
                        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.autoLock')}</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {[1, 5, 15].map(min => (
                                    <TouchableOpacity
                                        key={min}
                                        onPress={() => setAutoLockTimeout(min)}
                                        style={[
                                            styles.timeoutChip,
                                            { backgroundColor: colors.background }, // Use background for chip
                                            autoLockTimeout === min && { backgroundColor: colors.primary }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.timeoutText,
                                            { color: colors.text },
                                            autoLockTimeout === min && { color: '#ffffff', fontWeight: 'bold' }
                                        ]}>{min}m</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Language Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.language')}</Text>
                    <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.useKorean')}</Text>
                        <Switch
                            value={isKorean}
                            onValueChange={toggleLanguage}
                            trackColor={{ false: '#d1d5db', true: colors.primary }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>



                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.notifications')}</Text>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => setShowModeModal(true)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.notificationMode')}</Text>
                        <Text style={[styles.settingValue, { color: colors.primary }]}>
                            {notificationMode === 'heavy_sleeper'
                                ? t('settings.heavySleeperMode')
                                : t('settings.homeMode')}
                        </Text>
                    </TouchableOpacity>

                    {/* Warning banner if Heavy Sleeper is enabled but permissions missing */}
                    {notificationMode === 'heavy_sleeper' && Platform.OS === 'android' && Platform.Version >= 31 && (
                        (!permissions.dndAccess || !permissions.exactAlarm || !permissions.fullScreenIntent || !permissions.appearOnTop) && (
                            <TouchableOpacity
                                style={[styles.warningBanner, { backgroundColor: colors.card, borderColor: '#f59e0b' }]}
                                onPress={async () => {
                                    const perms = await checkHeavySleeperPermissions();
                                    setPermissions(perms);

                                    if (!perms.dndAccess) {
                                        await requestDndAccess();
                                    } else if (!perms.exactAlarm) {
                                        await requestExactAlarmPermission();
                                    } else if (!perms.fullScreenIntent) {
                                        await requestFullScreenIntentPermission();
                                    } else if (!perms.appearOnTop) {
                                        await requestAppearOnTopPermission();
                                    }
                                }}
                            >
                                <Text style={styles.warningIcon}>⚠️</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.warningText, { color: colors.text }]}>Permissions Required</Text>
                                    <Text style={[styles.warningSubtext, { color: colors.subtext }]}>
                                        {!permissions.dndAccess && 'Enable Do Not Disturb access'}
                                        {permissions.dndAccess && !permissions.exactAlarm && 'Enable Exact Alarms'}
                                        {permissions.dndAccess && permissions.exactAlarm && !permissions.fullScreenIntent && 'Enable Full-Screen Alarms'}
                                        {permissions.dndAccess && permissions.exactAlarm && permissions.fullScreenIntent && !permissions.appearOnTop && 'Enable Appear on Top'}
                                    </Text>
                                </View>
                                <Text style={[styles.arrow, { color: '#f59e0b' }]}>→</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>

                {/* Export Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.export')}</Text>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/export' as Href)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.exportData')}</Text>
                        <Text style={[styles.arrow, { color: colors.subtext }]}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Emergency ID Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.emergency')}</Text>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/emergency' as Href)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.emergencyId')}</Text>
                        <Text style={[styles.arrow, { color: colors.subtext }]}>→</Text>
                    </TouchableOpacity>
                </View>




                {/* About & Legal Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.aboutLegal') || 'About & Legal'}</Text>

                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/settings/about' as Href)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.aboutUs')}</Text>
                        <Text style={[styles.arrow, { color: colors.subtext }]}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/settings/privacy' as Href)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.privacyPolicy')}</Text>
                        <Text style={[styles.arrow, { color: colors.subtext }]}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/settings/terms' as Href)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.termsOfService')}</Text>
                        <Text style={[styles.arrow, { color: colors.subtext }]}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={[styles.section, styles.dangerSection]}>
                    <Text style={[styles.sectionTitle, styles.dangerTitle]}>{t('settings.dangerZone')}</Text>
                    <TouchableOpacity
                        style={[styles.dangerButton, { backgroundColor: colors.card, borderColor: '#7f1d1d' }]}
                        onPress={handleDeleteAllData}
                    >
                        <Text style={styles.dangerButtonText}>{t('settings.deleteAllData')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <NotificationModeModal
                visible={showModeModal}
                onClose={() => setShowModeModal(false)}
                onSelectMode={handleModeSelect}
                currentMode={notificationMode}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        paddingVertical: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 40,
        borderRadius: 10,
        overflow: 'hidden',
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        borderRadius: 20,
        overflow: 'hidden',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    description: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 8,
    },
    settingRow: {
        backgroundColor: '#252542',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    settingLabel: {
        fontSize: 16,
        color: '#ffffff',
    },
    settingValue: {
        fontSize: 14,
    },
    arrow: {
        fontSize: 18,
    },
    dangerSection: {
        marginTop: 24,
    },
    dangerTitle: {
        color: '#ef4444',
    },
    dangerButton: {
        // backgroundColor: '#3f1d1d', // Removed
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        // borderColor: '#7f1d1d', // Moved to inline
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
    timeoutChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timeoutChipActive: {
        backgroundColor: '#6366f1',
    },
    timeoutText: {
        color: '#ffffff',
        fontSize: 12,
    },
    timeoutTextActive: {
        fontWeight: 'bold',
    },
    warningBanner: {
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    warningIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    warningText: {
        fontSize: 14,
        fontWeight: '600',
    },
    warningSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
});
