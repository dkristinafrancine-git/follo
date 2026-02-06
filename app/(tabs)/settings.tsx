import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router, Href } from 'expo-router';
import { healthConnectService } from '../../src/services';
import { useSecurity } from '../../src/hooks/useSecurity';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useProfileStore } from '../../src/hooks/useProfiles';
import { resetDatabase } from '../../src/database/index';
import { useTheme } from '../../src/context/ThemeContext';
import { useSettings } from '../../src/hooks/useSettings';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const { themeMode, toggleTheme, colors } = useTheme();
    const [isKorean, setIsKorean] = useState(i18n.language === 'ko');
    const [hcAvailable, setHcAvailable] = useState(false);
    const [hcConnected, setHcConnected] = useState(false);
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

    const loadProfiles = useProfileStore(state => state.loadProfiles);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        const checkHardware = async () => {
            const available = await healthConnectService.isAvailable();
            setHcAvailable(available);
            if (available) {
                const connected = await healthConnectService.checkPermissions();
                setHcConnected(connected);
            }

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

    const handleHealthConnectToggle = async () => {
        if (!hcAvailable) return;

        if (!hcConnected) {
            const success = await healthConnectService.requestPermissions();
            if (success) {
                setHcConnected(true);
                Alert.alert(t('common.success'), t('settings.healthConnectConnected'));
            } else {
                Alert.alert(t('common.error'), t('settings.healthConnectFailed'));
            }
        } else {
            // Provide instruction on how to disconnect (usually via system settings)
            Alert.alert(t('settings.healthConnect'), t('settings.healthConnectDisconnect'));
        }
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
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

                {/* Health Connect Section */}
                {hcAvailable && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.healthConnect')}</Text>
                        <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.syncHealthConnect')}</Text>
                            <Switch
                                value={hcConnected}
                                onValueChange={handleHealthConnectToggle}
                                trackColor={{ false: '#d1d5db', true: colors.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>
                        <Text style={[styles.description, { color: colors.subtext }]}>{t('settings.healthConnectDesc')}</Text>
                    </View>
                )}

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.notifications')}</Text>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => {
                            Alert.alert(
                                t('settings.notificationMode'),
                                t('settings.selectMode'),
                                [
                                    { text: t('settings.homeMode'), onPress: () => setNotificationMode('home') },
                                    { text: t('settings.heavySleeperMode'), onPress: () => setNotificationMode('heavy_sleeper') },
                                    { text: t('common.cancel'), style: 'cancel' }
                                ]
                            );
                        }}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.notificationMode')}</Text>
                        <Text style={[styles.settingValue, { color: colors.primary }]}>
                            {notificationMode === 'heavy_sleeper'
                                ? t('settings.heavySleeperMode')
                                : t('settings.homeMode')}
                        </Text>
                    </TouchableOpacity>
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

                {/* Help Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{t('settings.help') || 'Help'}</Text>
                    <TouchableOpacity
                        style={[styles.settingRow, { backgroundColor: colors.card }]}
                        onPress={() => router.push('/onboarding/welcome?mode=tutorial' as Href)}
                    >
                        <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.replayTutorial') || 'Replay Tutorial'}</Text>
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
});
