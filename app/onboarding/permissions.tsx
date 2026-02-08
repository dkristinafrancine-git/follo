import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera } from 'react-native-vision-camera';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { checkHeavySleeperPermissions, requestFullScreenIntentPermission, requestExactAlarmPermission, type HeavySleeperPermissions } from '../../src/modules/FullScreenIntentModule';

export default function PermissionsScreen() {
    const { t } = useTranslation();
    const { colors } = useTheme();

    // Permission states
    const [cameraGranted, setCameraGranted] = useState(false);
    const [notificationGranted, setNotificationGranted] = useState(false);
    const [heavySleeperPermissions, setHeavySleeperPermissions] = useState<HeavySleeperPermissions | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);

    const needsHeavySleeperPermissions = Platform.OS === 'android' && Platform.Version >= 31;

    // Check initial status
    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        // Camera
        const camStatus = await Camera.getCameraPermissionStatus();
        setCameraGranted(camStatus === 'granted');

        // Notifee
        const settings = await notifee.getNotificationSettings();
        setNotificationGranted(settings.authorizationStatus === AuthorizationStatus.AUTHORIZED);

        // Heavy Sleeper permissions (Android 12+)
        if (needsHeavySleeperPermissions) {
            const hsPermissions = await checkHeavySleeperPermissions();
            setHeavySleeperPermissions(hsPermissions);
        }
    };

    const toggleCamera = async (value: boolean) => {
        if (value && !cameraGranted) {
            const status = await Camera.requestCameraPermission();
            setCameraGranted(status === 'granted');
        }
    };

    const toggleNotifications = async (value: boolean) => {
        if (value && !notificationGranted) {
            const settings = await notifee.requestPermission();
            setNotificationGranted(settings.authorizationStatus === AuthorizationStatus.AUTHORIZED);
        }
    };

    const handleHeavySleeperSetup = async () => {
        if (!heavySleeperPermissions) return;

        const missingPermissions = [];
        if (!heavySleeperPermissions.exactAlarm) missingPermissions.push('Exact Alarm');
        if (!heavySleeperPermissions.fullScreenIntent) missingPermissions.push('Full-Screen Intent');

        if (missingPermissions.length > 0) {
            Alert.alert(
                'Heavy Sleeper Mode Permissions',
                `To use Heavy Sleeper mode, you need to grant these permissions:\n\n• ${missingPermissions.join('\n• ')}\n\nYou will be taken to system settings to grant these permissions.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Grant Permissions',
                        onPress: async () => {
                            if (!heavySleeperPermissions.exactAlarm) {
                                await requestExactAlarmPermission();
                            }
                            if (!heavySleeperPermissions.fullScreenIntent) {
                                await requestFullScreenIntentPermission();
                            }
                            // Re-check after user returns
                            setTimeout(checkPermissions, 1000);
                        }
                    }
                ]
            );
        }
    };

    const handleContinue = () => {
        // Navigate to next step: Setup Choice
        router.push('/onboarding/setup-choice' as Href);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.stage, { color: colors.primary }]}>{t('onboarding.step', { current: 2, total: 4 })}</Text>
                    <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.permissionsTitle')}</Text>
                    <Text style={[styles.subtitle, { color: colors.subtext }]}>
                        {t('onboarding.permissionsSubtitle')}
                    </Text>
                </View>

                <View style={styles.permissionList}>
                    {/* Camera Permission */}
                    <View style={[styles.permissionItem, { backgroundColor: colors.card }]}>
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: colors.text }]}>📸 {t('onboarding.cameraPermission')}</Text>
                            <Text style={[styles.permissionDesc, { color: colors.subtext }]}>
                                {t('onboarding.cameraPermissionDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={cameraGranted}
                            onValueChange={toggleCamera}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={'#fff'}
                        />
                    </View>

                    {/* Notification Permission */}
                    <View style={[styles.permissionItem, { backgroundColor: colors.card }]}>
                        <View style={styles.textContainer}>
                            <Text style={[styles.permissionTitle, { color: colors.text }]}>🔔 {t('onboarding.notificationPermission')}</Text>
                            <Text style={[styles.permissionDesc, { color: colors.subtext }]}>
                                {t('onboarding.notificationPermissionDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={notificationGranted}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={'#fff'}
                        />
                    </View>

                    {/* Heavy Sleeper Permissions (Android 12+) */}
                    {needsHeavySleeperPermissions && heavySleeperPermissions && (
                        <View style={[styles.permissionItem, { backgroundColor: colors.card }]}>
                            <View style={styles.textContainer}>
                                <Text style={[styles.permissionTitle, { color: colors.text }]}>\u23f0 Heavy Sleeper Mode</Text>
                                <Text style={[styles.permissionDesc, { color: colors.subtext }]}>
                                    Required for full-screen alarms. Exact Alarm: {heavySleeperPermissions.exactAlarm ? '\u2705' : '\u274c'}, Full-Screen: {heavySleeperPermissions.fullScreenIntent ? '\u2705' : '\u274c'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleHeavySleeperSetup}>
                                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Setup</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
                    <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
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
        marginBottom: 32,
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
    permissionList: {
        flex: 1,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    textContainer: {
        flex: 1,
        paddingRight: 16,
    },
    permissionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    permissionDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        marginTop: 24,
    },
    button: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

