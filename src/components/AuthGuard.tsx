import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useSecurity } from '../hooks/useSecurity';
import PinScreen from '../screens/auth/PinScreen';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLocked, isAuthenticated } = useSecurity();

    return (
        <View style={{ flex: 1 }}>
            {children}
            {isLocked && (
                <View style={styles.absoluteFill}>
                    <PinScreen mode="unlock" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    absoluteFill: {
        paddingTop: 30, // Status bar path
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#F8FAFC', // Match PinScreen background
    },
});
