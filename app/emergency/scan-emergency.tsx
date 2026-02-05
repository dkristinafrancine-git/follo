import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Dimensions } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { emergencyService } from '../../src/services/emergencyService';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function EmergencyScanScreen() {
    const router = useRouter();
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const isFocused = useIsFocused();
    const [isActive, setIsActive] = useState(true);
    const { activeProfile } = useActiveProfile();
    const [isProcessing, setIsProcessing] = useState(false);

    // Manage camera active state
    useEffect(() => {
        setIsActive(isFocused && !isProcessing);
    }, [isFocused, isProcessing]);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            if (isProcessing) return;

            const firstCode = codes[0];
            if (firstCode?.value) {
                handleCodeScanned(firstCode.value);
            }
        }
    });

    const handleCodeScanned = async (data: string) => {
        if (!activeProfile) {
            Alert.alert('Error', 'No active profile selected.');
            return;
        }

        setIsProcessing(true);
        setIsActive(false); // Pause camera

        try {
            await emergencyService.importEmergencyData(activeProfile.id, data);

            Alert.alert(
                'Success',
                'Emergency ID imported successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            Alert.alert(
                'Invalid Code',
                'This QR code does not contain valid Follo Emergency ID data.',
                [
                    {
                        text: 'Try Again',
                        onPress: () => {
                            setIsProcessing(false);
                            setIsActive(true);
                        }
                    }
                ]
            );
        }
    };

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Camera permission is required to scan emergency IDs.</Text>
                <TouchableOpacity onPress={Linking.openSettings} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>Open Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (!device) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff' }}>Camera not available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                codeScanner={codeScanner}
                enableZoomGesture={true}
            />

            {/* Overlay */}
            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Import Emergency ID</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.scanRegionContainer}>
                    <Text style={styles.hintText}>Scan a Follo Emergency QR Code</Text>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                        {isProcessing && (
                            <View style={styles.processingContainer}>
                                <Text style={styles.processingText}>Processing...</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Scanning will overwrite existing emergency data for {activeProfile?.name}.
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    permissionButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginBottom: 12,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        padding: 12,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    scanRegionContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    hintText: {
        color: '#fff',
        marginBottom: 20,
        fontSize: 16,
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    scanFrame: {
        width: 280,
        height: 280,
        borderWidth: 0,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#ef4444', // Red for emergency
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    processingContainer: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 16,
        borderRadius: 8,
    },
    processingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        fontSize: 12,
    },
});
