import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withRepeat,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSecurity } from '../../context/SecurityContext';

// Colors (can be moved to theme)
const COLORS = {
    background: '#F8FAFC',
    text: '#1E293B',
    subtext: '#64748B',
    primary: '#2563EB',
    error: '#EF4444',
    keyBackground: '#FFFFFF',
    keyText: '#334155',
};

interface PinScreenProps {
    mode: 'setup' | 'unlock' | 'verify' | 'disable'; // 'verify' for before changing settings
    onSuccess?: () => void;
    onCancel?: () => void;
}

const PIN_LENGTH = 4;

export default function PinScreen({ mode = 'unlock', onSuccess, onCancel }: PinScreenProps) {
    const { enablePin, disablePin, unlockWithPin, unlockWithBiometrics, isBiometricsEnabled } = useSecurity();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState('');
    const router = useRouter();

    // Animation for error shake
    const offset = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: offset.value }],
        };
    });

    const shake = () => {
        offset.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withRepeat(withTiming(10, { duration: 100 }), 5, true),
            withTiming(0, { duration: 50 })
        );
    };

    useEffect(() => {
        if (mode === 'unlock' && isBiometricsEnabled) {
            unlockWithBiometrics().then((success) => {
                if (success && onSuccess) onSuccess();
            });
        }
    }, []);

    const handlePress = (key: string) => {
        setError('');
        if (key === 'backspace') {
            setPin((prev) => prev.slice(0, -1));
        } else if (pin.length < PIN_LENGTH) {
            setPin((prev) => prev + key);
        }
    };

    useEffect(() => {
        if (pin.length === PIN_LENGTH) {
            handlePinComplete();
        }
    }, [pin]);

    const handlePinComplete = async () => {
        // Small delay for UX
        setTimeout(async () => {
            if (mode === 'setup') {
                if (step === 'enter') {
                    setConfirmPin(pin);
                    setPin('');
                    setStep('confirm');
                } else if (step === 'confirm') {
                    if (pin === confirmPin) {
                        await enablePin(pin);
                        if (onSuccess) onSuccess();
                    } else {
                        setError('PINs do not match');
                        shake();
                        setPin('');
                        setConfirmPin('');
                        setStep('enter');
                    }
                }
            } else if (mode === 'unlock' || mode === 'verify' || mode === 'disable') {
                const success = await unlockWithPin(pin);
                if (success) {
                    if (mode === 'disable') {
                        await disablePin();
                    }
                    if (onSuccess) onSuccess();
                } else {
                    setError('Incorrect PIN');
                    shake();
                    setPin('');
                }
            }
        }, 100);
    };

    const getTitle = () => {
        if (mode === 'setup') {
            return step === 'enter' ? 'Create a PIN' : 'Confirm your PIN';
        }
        if (mode === 'disable') return 'Enter PIN to Disable';
        if (mode === 'verify') return 'Enter PIN';
        return 'Enter PIN to Unlock';
    };

    const renderKey = (item: string | React.ReactNode, value?: string) => {
        return (
            <TouchableOpacity
                key={value || (typeof item === 'string' ? item : undefined)}
                style={styles.key}
                onPress={() => handlePress(value || item as string)}
                activeOpacity={0.7}
            >
                {typeof item === 'string' ? (
                    <Text style={styles.keyText}>{item}</Text>
                ) : (
                    item
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{getTitle()}</Text>
                    <Text style={styles.subtitle}>
                        {error || 'Enter 4-digit PIN to secure your data'}
                    </Text>
                </View>

                <Animated.View style={[styles.dotsContainer, animatedStyle]}>
                    {[...Array(PIN_LENGTH)].map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor:
                                        i < pin.length
                                            ? error
                                                ? COLORS.error
                                                : COLORS.primary
                                            : '#CBD5E1',
                                },
                            ]}
                        />
                    ))}
                </Animated.View>

                <View style={styles.keypad}>
                    <View style={styles.row}>
                        {['1', '2', '3'].map((key) => renderKey(key))}
                    </View>
                    <View style={styles.row}>
                        {['4', '5', '6'].map((key) => renderKey(key))}
                    </View>
                    <View style={styles.row}>
                        {['7', '8', '9'].map((key) => renderKey(key))}
                    </View>
                    <View style={styles.row}>
                        {mode === 'unlock' && isBiometricsEnabled ? (
                            <TouchableOpacity
                                style={styles.key}
                                onPress={() => unlockWithBiometrics().then(s => s && onSuccess && onSuccess())}
                            >
                                <Ionicons name="finger-print" size={28} color={COLORS.primary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.key} />
                        )}

                        {renderKey('0')}

                        <TouchableOpacity
                            style={styles.key}
                            onPress={() => handlePress('backspace')}
                        >
                            <Ionicons name="backspace-outline" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {onCancel && (
                    <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.subtext,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 60,
        gap: 20,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    keypad: {
        width: '100%',
        maxWidth: 300,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    key: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.keyBackground,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '600',
        color: COLORS.keyText,
    },
    cancelButton: {
        marginTop: 20,
        padding: 10
    },
    cancelText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '500'
    }
});
