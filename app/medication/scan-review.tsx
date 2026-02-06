import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OCRService, ParsedMedication } from '../../src/services/ocrService';
import { Ionicons } from '@expo/vector-icons';

export default function ScanReviewScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const imageUri = params.imageUri as string;

    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [form, setForm] = useState('');
    const [frequency, setFrequency] = useState('');

    useEffect(() => {
        if (imageUri) {
            processImage();
        }
    }, [imageUri]);

    const processImage = async () => {
        try {
            setLoading(true);
            const lines = await OCRService.recognizeText(imageUri);
            const data = OCRService.parseMedicationDetails(lines);

            if (data.name) setName(data.name);
            if (data.dosage) setDosage(data.dosage);
            if (data.form) setForm(data.form);
            if (data.frequency) setFrequency(data.frequency);

        } catch (error) {
            console.error('Processing failed:', error);
            Alert.alert(t('scanner.scanFailedTitle'), t('scanner.scanFailedMessage'));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!name) {
            Alert.alert(t('scanner.nameRequiredTitle'), t('scanner.nameRequiredMessage'));
            return;
        }

        // Navigate to Add screen with pre-filled data or just save directly?
        // User story implies adding "without manual typing".
        // Let's navigate to the main Add Medication form with these params pre-filled.
        router.push({
            pathname: '/medication/add' as any,
            params: {
                prefilledName: name,
                prefilledDosage: dosage,
                prefilledForm: form,
                prefilledFrequency: frequency,
                prefilledPhoto: imageUri,
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>{t('scanner.reviewTitle')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#ffffff" />
                            <Text style={styles.loadingText}>{t('scanner.analyzing')}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.instructions}>
                    {t('scanner.verifyDetails')}
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('medication.name')}</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('medication.namePlaceholder')}
                            placeholderTextColor="#999999"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>{t('medication.dosage')}</Text>
                            <TextInput
                                style={styles.input}
                                value={dosage}
                                onChangeText={setDosage}
                                placeholder={t('medication.dosagePlaceholder')}
                                placeholderTextColor="#999999"
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>{t('medication.form')}</Text>
                            <TextInput
                                style={styles.input}
                                value={form}
                                onChangeText={setForm}
                                placeholder="e.g. Tablet"
                                placeholderTextColor="#999999"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('medication.frequency')}</Text>
                        <TextInput
                            style={styles.input}
                            value={frequency}
                            onChangeText={setFrequency}
                            placeholder="e.g. Daily"
                            placeholderTextColor="#999999"
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>{t('scanner.confirmContinue')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        padding: 16,
    },
    imageContainer: {
        height: 200,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#eee',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 8,
        fontWeight: '500',
    },
    instructions: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    confirmButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
