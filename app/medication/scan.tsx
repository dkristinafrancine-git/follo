import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

export default function ScannerScreen() {
    const router = useRouter();
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const camera = useRef<Camera>(null);
    const isFocused = useIsFocused();
    const [isActive, setIsActive] = useState(true);

    // Manage camera active state based on focus to prevent battery drain/conflicts
    useEffect(() => {
        setIsActive(isFocused);
    }, [isFocused]);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    const handleCapture = async () => {
        if (camera.current) {
            try {
                const photo = await camera.current.takePhoto({
                    flash: 'auto',
                    enableShutterSound: true,
                });

                // Navigate to review screen
                router.push({
                    pathname: '/medication/scan-review' as any,
                    params: { imageUri: 'file://' + photo.path }, // Ensure file:// scheme
                });
            } catch (error) {
                console.error('Capture failed:', error);
                Alert.alert('Error', 'Failed to capture photo.');
            }
        }
    };

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Camera permission is required to scan medications.</Text>
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
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text>Loading Camera...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {isActive && (
                <Camera
                    ref={camera}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isActive}
                    photo={true}
                    enableZoomGesture={true}
                />
            )}

            {/* Overlay */}
            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Scan Label</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.scanRegionContainer}>
                    <Text style={styles.hintText}>Align label within frame</Text>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
                        <View style={styles.captureInner} />
                    </TouchableOpacity>
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
        alignItems: 'center', // Fix: center items horizontally
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
        backgroundColor: '#4A90E2',
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
        height: 180,
        borderWidth: 0,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#fff',
        borderWidth: 3,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    footer: {
        paddingBottom: 32,
        alignItems: 'center',
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
});
