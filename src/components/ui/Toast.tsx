import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    visible: boolean;
    onHide?: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    visible,
    onHide,
    duration = 2000
}) => {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(duration),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                if (onHide) onHide();
            });
        }
    }, [visible, duration, onHide]);

    if (!visible) return null;

    const getIconName = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'info': return 'information-circle';
            default: return 'checkmark-circle';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return colors.success || '#10b981';
            case 'error': return colors.danger || '#ef4444';
            case 'info': return colors.primary || '#3b82f6';
            default: return colors.success;
        }
    };

    return (
        <Animated.View style={[
            styles.container,
            {
                opacity,
                backgroundColor: colors.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
            }
        ]}>
            <View style={[styles.iconContainer, { backgroundColor: `${getColor()}20` }]}>
                <Ionicons name={getIconName()} size={24} color={getColor()} />
            </View>
            <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60, // Top positioning is often better for "toast" style notifications
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    message: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
});
