import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router, Href } from 'expo-router';

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const [isKorean, setIsKorean] = useState(i18n.language === 'ko');

    const toggleLanguage = () => {
        const newLang = isKorean ? 'en' : 'ko';
        i18n.changeLanguage(newLang);
        setIsKorean(!isKorean);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('settings.title')}</Text>
                </View>

                {/* Language Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>{t('settings.useKorean')}</Text>
                        <Switch
                            value={isKorean}
                            onValueChange={toggleLanguage}
                            trackColor={{ false: '#3e3e5e', true: '#6366f1' }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
                    <TouchableOpacity style={styles.settingRow}>
                        <Text style={styles.settingLabel}>{t('settings.notificationMode')}</Text>
                        <Text style={styles.settingValue}>{t('settings.homeMode')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Export Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.export')}</Text>
                    <TouchableOpacity
                        style={styles.settingRow}
                        onPress={() => router.push('/export' as Href)}
                    >
                        <Text style={styles.settingLabel}>{t('settings.exportData')}</Text>
                        <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Emergency ID Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.emergency')}</Text>
                    <TouchableOpacity
                        style={styles.settingRow}
                        onPress={() => router.push('/emergency' as Href)}
                    >
                        <Text style={styles.settingLabel}>{t('settings.emergencyId')}</Text>
                        <Text style={styles.arrow}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={[styles.section, styles.dangerSection]}>
                    <Text style={[styles.sectionTitle, styles.dangerTitle]}>{t('settings.dangerZone')}</Text>
                    <TouchableOpacity style={styles.dangerButton}>
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
        color: '#6b7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
        color: '#6366f1',
    },
    arrow: {
        fontSize: 18,
        color: '#6b7280',
    },
    dangerSection: {
        marginTop: 24,
    },
    dangerTitle: {
        color: '#ef4444',
    },
    dangerButton: {
        backgroundColor: '#3f1d1d',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#7f1d1d',
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
});
