import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

interface SecurityContextType {
    isAuthenticated: boolean;
    isLocked: boolean;
    hasPin: boolean;
    isBiometricsEnabled: boolean;
    autoLockTimeout: number; // in minutes
    enablePin: (pin: string) => Promise<void>;
    disablePin: () => Promise<void>;
    changePin: (oldPin: string, newPin: string) => Promise<boolean>;
    unlockWithPin: (pin: string) => Promise<boolean>;
    unlockWithBiometrics: () => Promise<boolean>;
    toggleBiometrics: (enabled: boolean) => Promise<void>;
    setAutoLockTimeout: (minutes: number) => Promise<void>;
    lockApp: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// Storage Keys
const KEY_PIN_HASH = 'auth_pin_hash';
const KEY_BIOMETRICS_ENABLED = 'auth_biometrics_enabled';
const KEY_AUTO_LOCK_TIMEOUT = 'auth_auto_lock_timeout';

// Default timeout: 5 minutes
const DEFAULT_TIMEOUT = 5;

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLocked, setIsLocked] = useState(true); // Default to locked on launch
    const [hasPin, setHasPin] = useState(false);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [autoLockTimeout, setAutoLockTimeoutState] = useState(DEFAULT_TIMEOUT);

    const appState = useRef(AppState.currentState);
    const backgroundTimestamp = useRef<number | null>(null);

    useEffect(() => {
        checkSecurityState();
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    const checkSecurityState = async () => {
        try {
            const pinHash = await SecureStore.getItemAsync(KEY_PIN_HASH);
            const bioEnabled = await SecureStore.getItemAsync(KEY_BIOMETRICS_ENABLED);
            const savedTimeout = await SecureStore.getItemAsync(KEY_AUTO_LOCK_TIMEOUT);

            if (pinHash) {
                setHasPin(true);
                setIsAuthenticated(false);
                setIsLocked(true);
            } else {
                setHasPin(false);
                setIsAuthenticated(true); // No PIN means technically "authenticated" or open
                setIsLocked(false);
            }

            setIsBiometricsEnabled(bioEnabled === 'true');
            setAutoLockTimeoutState(savedTimeout ? parseInt(savedTimeout, 10) : DEFAULT_TIMEOUT);
        } catch (error) {
            console.error('Error checking security state:', error);
        }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
            // Going to background
            backgroundTimestamp.current = Date.now();
        } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // Coming to foreground
            if (hasPin && backgroundTimestamp.current && autoLockTimeout > 0) {
                const elapsedMinutes = (Date.now() - backgroundTimestamp.current) / 60000;
                if (elapsedMinutes >= autoLockTimeout) {
                    lockApp();
                }
            }
        }
        appState.current = nextAppState;
    };

    const hashPin = async (pin: string) => {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pin
        );
    };

    const enablePin = async (pin: string) => {
        const hash = await hashPin(pin);
        await SecureStore.setItemAsync(KEY_PIN_HASH, hash);
        setHasPin(true);
        setIsAuthenticated(true);
        setIsLocked(false);
    };

    const disablePin = async () => {
        await SecureStore.deleteItemAsync(KEY_PIN_HASH);
        await SecureStore.deleteItemAsync(KEY_BIOMETRICS_ENABLED);
        setHasPin(false);
        setIsAuthenticated(true);
        setIsLocked(false);
        setIsBiometricsEnabled(false);
    };

    const changePin = async (oldPin: string, newPin: string) => {
        const storedHash = await SecureStore.getItemAsync(KEY_PIN_HASH);
        const oldHash = await hashPin(oldPin);

        if (storedHash === oldHash) {
            const newHash = await hashPin(newPin);
            await SecureStore.setItemAsync(KEY_PIN_HASH, newHash);
            return true;
        }
        return false;
    };

    const unlockWithPin = async (pin: string) => {
        const storedHash = await SecureStore.getItemAsync(KEY_PIN_HASH);
        const enteredHash = await hashPin(pin);

        if (storedHash === enteredHash) {
            setIsAuthenticated(true);
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const unlockWithBiometrics = async () => {
        if (!isBiometricsEnabled) return false;

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Follo',
                fallbackLabel: 'Use PIN',
            });

            if (result.success) {
                setIsAuthenticated(true);
                setIsLocked(false);
                return true;
            }
        }
        return false;
    };

    const toggleBiometrics = async (enabled: boolean) => {
        await SecureStore.setItemAsync(KEY_BIOMETRICS_ENABLED, String(enabled));
        setIsBiometricsEnabled(enabled);
    };

    const setAutoLockTimeout = async (minutes: number) => {
        await SecureStore.setItemAsync(KEY_AUTO_LOCK_TIMEOUT, String(minutes));
        setAutoLockTimeoutState(minutes);
    };

    const lockApp = () => {
        if (hasPin) {
            setIsLocked(true);
            setIsAuthenticated(false);
        }
    };

    return (
        <SecurityContext.Provider
            value={{
                isAuthenticated,
                isLocked,
                hasPin,
                isBiometricsEnabled,
                autoLockTimeout,
                enablePin,
                disablePin,
                changePin,
                unlockWithPin,
                unlockWithBiometrics,
                toggleBiometrics,
                setAutoLockTimeout,
                lockApp,
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
};
