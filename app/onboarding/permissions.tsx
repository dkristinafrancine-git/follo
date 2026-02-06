import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera } from 'react-native-vision-camera';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

export default function PermissionsScreen() {
    const { t } = useTranslation();

    // Permission states
    const [cameraGranted, setCameraGranted] = useState(false);
    const [notificationGranted, setNotificationGranted] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

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

    const handleContinue = () => {
        // Navigate to next step: Setup Choice
        router.push('/onboarding/setup-choice' as Href);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.stage}>{t('onboarding.step', { current: 2, total: 4 })}</Text>
                    <Text style={styles.title}>{t('onboarding.permissionsTitle')}</Text>
                    <Text style={styles.subtitle}>
                        {t('onboarding.permissionsSubtitle')}
                    </Text>
                </View>

                <View style={styles.permissionList}>
                    {/* Camera Permission */}
                    <View style={styles.permissionItem}>
                        <View style={styles.textContainer}>
                            <Text style={styles.permissionTitle}>📸 {t('onboarding.cameraPermission')}</Text>
                            <Text style={styles.permissionDesc}>
                                {t('onboarding.cameraPermissionDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={cameraGranted}
                            onValueChange={toggleCamera}
                            trackColor={{ false: '#3f3f5a', true: '#6366f1' }}
                            thumbColor={'#fff'}
                        />
                    </View>

                    {/* Notification Permission */}
                    <View style={styles.permissionItem}>
                        <View style={styles.textContainer}>
                            <Text style={styles.permissionTitle}>🔔 {t('onboarding.notificationPermission')}</Text>
                            <Text style={styles.permissionDesc}>
                                {t('onboarding.notificationPermissionDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={notificationGranted}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#3f3f5a', true: '#6366f1' }}
                            thumbColor={'#fff'}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.button} onPress={handleContinue}>
                        <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        padding: 24,
    },
    header: {
        marginBottom: 32,
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
    permissionList: {
        flex: 1,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252542',
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
        color: '#fff',
        marginBottom: 4,
    },
    permissionDesc: {
        fontSize: 14,
        color: '#9ca3af',
        lineHeight: 20,
    },
    footer: {
        marginTop: 24,
    },
    button: {
        backgroundColor: '#6366f1',
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
