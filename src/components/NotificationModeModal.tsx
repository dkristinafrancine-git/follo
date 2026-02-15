import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface NotificationModeModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectMode: (mode: 'home' | 'heavy_sleeper') => void;
    currentMode: 'home' | 'heavy_sleeper' | null;
}

export const NotificationModeModal: React.FC<NotificationModeModalProps> = ({
    visible,
    onClose,
    onSelectMode,
    currentMode
}) => {
    const { t } = useTranslation();
    const { colors, themeMode } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.container, { backgroundColor: colors.card }]}>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: colors.text }]}>
                                    {t('settings.notificationMode')}
                                </Text>
                                <Text style={[styles.subtitle, { color: colors.subtext }]}>
                                    {t('settings.selectMode')}
                                </Text>
                            </View>

                            <View style={styles.optionsContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        {
                                            backgroundColor: currentMode === 'home' ? colors.primary + '20' : colors.background,
                                            borderColor: currentMode === 'home' ? colors.primary : colors.border
                                        }
                                    ]}
                                    onPress={() => onSelectMode('home')}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                                        <Ionicons name="home-outline" size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                                            {t('settings.homeMode')}
                                        </Text>
                                        <Text style={[styles.optionDescription, { color: colors.subtext }]}>
                                            {t('settings.homeModeDesc') || "Standard notifications"}
                                        </Text>
                                    </View>
                                    {currentMode === 'home' && (
                                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        {
                                            backgroundColor: currentMode === 'heavy_sleeper' ? '#f59e0b20' : colors.background,
                                            borderColor: currentMode === 'heavy_sleeper' ? '#f59e0b' : colors.border
                                        }
                                    ]}
                                    onPress={() => onSelectMode('heavy_sleeper')}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: '#f59e0b20' }]}>
                                        <Ionicons name="alarm-outline" size={24} color="#f59e0b" />
                                    </View>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>
                                            {t('settings.heavySleeperMode')}
                                        </Text>
                                        <Text style={[styles.optionDescription, { color: colors.subtext }]}>
                                            {t('settings.heavySleeperModeDesc') || "Full-screen loud alarms"}
                                        </Text>
                                    </View>
                                    {currentMode === 'heavy_sleeper' && (
                                        <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.cancelButton, { borderTopColor: colors.border }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.cancelText, { color: colors.subtext }]}>
                                    {t('common.cancel')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 0,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 12,
    },
    cancelButton: {
        width: '100%',
        paddingVertical: 16,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
