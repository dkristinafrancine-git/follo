import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Href, router } from 'expo-router';



interface IconProps {
    color: string;
    size?: number;
}

const MedicationIcon = ({ color, size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="2" y="6" width="20" height="12" rx="6" />
        <Path d="M14 6L10 18" />{/* Diagonal line to simulate a pill split or reflection */}
    </Svg>
);

const SupplementIcon = ({ color, size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 3H15M10 9L14 9M10 14L14 14" />
        <Path d="M6 6H18" />
        <Path d="M6 6V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V6" />
    </Svg>
);

const AppointmentIcon = ({ color, size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Line x1="16" y1="2" x2="16" y2="6" />
        <Line x1="8" y1="2" x2="8" y2="6" />
        <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
);

const ActivityIcon = ({ color, size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
);

const GratitudeIcon = ({ color, size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
);

const SymptomIcon = ({ color, size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </Svg>
);

interface QuickActionSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickActionSelector({ isOpen, onClose }: QuickActionSelectorProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const slideAnim = useRef(new Animated.Value(300)).current; // Slide from bottom
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const handleAction = (path: Href) => {
        Haptics.selectionAsync();
        onClose();
        // Small delay to allow animation to start closing
        setTimeout(() => {
            router.push(path);
        }, 150);
    };

    if (!isOpen) return null;

    const dynamicStyles = {
        backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
        container: {
            backgroundColor: colors.card,
            paddingBottom: Math.max(insets.bottom, 20) + 16 // Safe area + padding 
        },
        title: { color: colors.subtext },
        item: { backgroundColor: colors.background },
        text: { color: colors.text },
    };

    const actions = [
        {
            id: 'medication',
            path: '/medication/add' as Href,
            Icon: MedicationIcon,
            color: '#4A90D9',
            label: t('medication.addTitle') || 'Medication',
        },
        {
            id: 'supplement',
            path: '/supplement/add' as Href,
            Icon: SupplementIcon,
            color: '#F59E0B',
            label: t('supplement.addTitle') || 'Supplement',
        },
        {
            id: 'appointment',
            path: '/appointment/add' as Href,
            Icon: AppointmentIcon,
            color: '#8b5cf6',
            label: t('appointment.addTitle') || 'Appointment',
        },
        {
            id: 'activity',
            path: '/activity/add' as Href,
            Icon: ActivityIcon,
            color: '#10b981',
            label: t('activity.addTitle') || 'Activity',
        },
        {
            id: 'gratitude',
            path: '/gratitude/entry' as Href,
            Icon: GratitudeIcon,
            color: '#ec4899',
            label: t('gratitude.addTitle') || 'Gratitude',
        },
        {
            id: 'symptom',
            path: '/symptom/add' as Href,
            Icon: SymptomIcon,
            color: '#ef4444',
            label: t('symptom.addTitle') || 'Symptom',
        },
    ];

    return (
        <Modal
            transparent
            visible={isOpen}
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Animated.View
                    style={[
                        styles.container,
                        dynamicStyles.container,
                        {
                            transform: [{ translateY: slideAnim }],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <View style={styles.handle} />
                    <Text style={[styles.title, dynamicStyles.title]}>
                        {t('common.add') || 'Add New'}
                    </Text>

                    <View style={styles.list}>
                        {actions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[styles.item, dynamicStyles.item]}
                                onPress={() => handleAction(action.path)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
                                    <action.Icon color={action.color} size={22} />
                                </View>
                                <Text style={[styles.label, dynamicStyles.text]} numberOfLines={1}>
                                    {action.label}
                                </Text>
                                <Text style={[styles.chevron, { color: colors.subtext }]}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        // paddingBottom is handled dynamically
        backgroundColor: '#252542',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#9ca3af',
    },
    list: {
        flexDirection: 'column',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // Increased padding for single row 
        marginBottom: 10,
        borderRadius: 16,
        backgroundColor: '#3f3f5a',
    },
    iconContainer: {
        width: 40, // Slightly larger icon container
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    label: {
        flex: 1,
        fontSize: 16, // Slightly larger text
        fontWeight: '500',
        color: '#fff',
    },
    chevron: {
        fontSize: 20,
        fontWeight: '300',
        marginLeft: 8,
    },
});
