import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useMemo } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { emergencyService, exportService } from '../../src/services';
import { EmergencyData, EmergencyContact } from '../../src/types';
import { useTheme } from '../../src/context/ThemeContext';
import { ThemeColors } from '../../src/constants/Colors';

export default function EmergencyScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { activeProfile } = useActiveProfile();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [data, setData] = useState<EmergencyData | null>(null);

    // Form state
    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');
    const [conditions, setConditions] = useState('');
    const [organDonor, setOrganDonor] = useState(false);
    const [notes, setNotes] = useState('');
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);

    const loadData = useCallback(async () => {
        if (!activeProfile) return;
        setLoading(true);
        try {
            const result = await emergencyService.getEmergencyData(activeProfile.id);
            setData(result);
            if (result) {
                setBloodType(result.bloodType || '');
                setAllergies(result.allergies.join(', '));
                setConditions(result.medicalConditions.join(', '));
                setOrganDonor(result.organDonor);
                setNotes(result.notes || '');
                setContacts(result.emergencyContacts);
            }
        } catch (error) {
            console.error('Failed to load emergency data:', error);
            Alert.alert(t('common.error'), t('common.failedToLoad'));
        } finally {
            setLoading(false);
        }
    }, [activeProfile, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async () => {
        if (!activeProfile) return;

        try {
            setLoading(true);
            const allergiesList = allergies.split(',').map(s => s.trim()).filter(Boolean);
            const conditionsList = conditions.split(',').map(s => s.trim()).filter(Boolean);

            const updated = await emergencyService.saveEmergencyData({
                profileId: activeProfile.id,
                bloodType: bloodType || undefined,
                allergies: allergiesList,
                medicalConditions: conditionsList,
                emergencyContacts: contacts,
                organDonor,
                notes: notes || undefined,
            });

            setData(updated);
            setIsEditing(false);
            Alert.alert(t('common.success'), t('common.saved'));
        } catch (error) {
            console.error('Failed to save emergency data:', error);
            Alert.alert(t('common.error'), t('common.failedToSave'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = () => {
        setContacts([...contacts, { name: '', phone: '', relation: '' }]);
    };

    const handleUpdateContact = (index: number, field: keyof EmergencyContact, value: string) => {
        const newContacts = [...contacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setContacts(newContacts);
    };

    const handleRemoveContact = (index: number) => {
        const newContacts = contacts.filter((_, i) => i !== index);
        setContacts(newContacts);
    };

    const handleExportCard = async () => {
        if (!activeProfile || !data) return;
        try {
            setLoading(true);
            await exportService.exportAndShare({
                reportType: 'emergency_card',
                profile: activeProfile,
                startDate: new Date(),
                endDate: new Date(),
                format: 'pdf'
            });
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert(t('common.error'), t('emergency.exportError'));
        } finally {
            setLoading(false);
        }
    };

    const getQRCodeData = () => {
        if (!data || !activeProfile) return '';

        const qrContent = {
            v: 1,
            name: activeProfile.name,
            dob: activeProfile.birthDate,
            bloodType: data.bloodType,
            allergies: data.allergies,
            conditions: data.medicalConditions,
            contacts: data.emergencyContacts,
            donor: data.organDonor,
            notes: data.notes
        };

        return JSON.stringify(qrContent);
    };

    if (loading && !data && !isEditing) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: true, title: t('settings.emergencyId'), headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: t('settings.emergencyId'),
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
                            <Text style={styles.headerButton}>
                                {isEditing ? t('common.save') : t('common.edit')}
                            </Text>
                        </TouchableOpacity>
                    )
                }}
            />

            <ScrollView style={styles.content}>
                {isEditing ? (
                    // Edit Mode
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('emergency.bloodType')}</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.bloodTypeContainer}
                            >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.bloodTypeChip,
                                            bloodType === type && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => setBloodType(type)}
                                    >
                                        <Text style={[
                                            styles.bloodTypeText,
                                            bloodType === type && { color: '#fff' }
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('emergency.allergies')}</Text>
                            <TextInput
                                style={styles.input}
                                value={allergies}
                                onChangeText={setAllergies}
                                placeholder={t('emergency.allergiesPlaceholder')}
                                placeholderTextColor="#6b7280"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('emergency.conditions')}</Text>
                            <TextInput
                                style={styles.input}
                                value={conditions}
                                onChangeText={setConditions}
                                placeholder={t('emergency.conditionsPlaceholder')}
                                placeholderTextColor="#6b7280"
                                multiline
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.switchRow}>
                                <Text style={styles.label}>{t('emergency.organDonor')}</Text>
                                <Switch
                                    value={organDonor}
                                    onValueChange={setOrganDonor}
                                    trackColor={{ false: colors.border || colors.card, true: colors.primary }}
                                    thumbColor={colors.text}
                                />
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>{t('emergency.contacts')}</Text>
                        {contacts.map((contact, index) => (
                            <View key={index} style={styles.contactCard}>
                                <TextInput
                                    style={styles.contactInput}
                                    value={contact.name}
                                    onChangeText={(v) => handleUpdateContact(index, 'name', v)}
                                    placeholder={t('emergency.contactNamePlaceholder')}
                                    placeholderTextColor="#6b7280"
                                />
                                <TextInput
                                    style={styles.contactInput}
                                    value={contact.relation}
                                    onChangeText={(v) => handleUpdateContact(index, 'relation', v)}
                                    placeholder={t('emergency.contactRelationPlaceholder')}
                                    placeholderTextColor="#6b7280"
                                />
                                <TextInput
                                    style={styles.contactInput}
                                    value={contact.phone}
                                    onChangeText={(v) => handleUpdateContact(index, 'phone', v)}
                                    placeholder={t('emergency.contactPhonePlaceholder')}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#6b7280"
                                />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveContact(index)}
                                >
                                    <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
                            <Text style={styles.addButtonText}>+ {t('emergency.addContact')}</Text>
                        </TouchableOpacity>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('common.notes')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder={t('emergency.notesPlaceholder')}
                                placeholderTextColor="#6b7280"
                                multiline
                            />
                        </View>
                    </View>
                ) : (
                    // View Mode
                    <View style={styles.viewMode}>
                        <View style={styles.qrContainer}>
                            {data ? (
                                <QRCode value={getQRCodeData()} size={200} backgroundColor="white" color="black" />
                            ) : (
                                <Text style={styles.emptyText}>{t('emergency.noData')}</Text>
                            )}
                            <Text style={styles.qrLabel}>{t('emergency.scanForInfo')}</Text>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/emergency/scan-emergency' as any)}>
                                <Ionicons name="qr-code-outline" size={20} color="#fff" />

                                <Text style={styles.actionButtonText}>{t('emergency.scanToImport')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleExportCard}>
                                <Ionicons name="card-outline" size={20} color={colors.primary} />
                                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>{t('emergency.exportCard')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>{t('profile.name')}</Text>
                            <Text style={styles.infoValue}>{activeProfile?.name}</Text>

                            <Text style={styles.infoLabel}>{t('emergency.bloodType')}</Text>
                            <Text style={styles.infoValue}>{data?.bloodType || '--'}</Text>

                            <Text style={styles.infoLabel}>{t('emergency.organDonor')}</Text>
                            <Text style={styles.infoValue}>{data?.organDonor ? t('common.yes') : t('common.no')}</Text>

                            <Text style={styles.infoLabel}>{t('emergency.allergies')}</Text>
                            <Text style={styles.infoValue}>{data?.allergies.length ? data.allergies.join(', ') : '--'}</Text>

                            <Text style={styles.infoLabel}>{t('emergency.conditions')}</Text>
                            <Text style={styles.infoValue}>{data?.medicalConditions.length ? data.medicalConditions.join(', ') : '--'}</Text>
                        </View>

                        {data?.emergencyContacts && data.emergencyContacts.length > 0 && (
                            <View style={styles.infoCard}>
                                <Text style={styles.cardHeader}>{t('emergency.contacts')}</Text>
                                {data.emergencyContacts.map((contact, i) => (
                                    <View key={i} style={styles.contactItem}>
                                        <Text style={styles.contactName}>{contact.name} ({contact.relation})</Text>
                                        <Text style={styles.contactPhone}>{contact.phone}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    headerButton: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
        marginRight: 16,
    },
    form: {
        gap: 16,
        paddingBottom: 40,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: colors.subtext,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        color: colors.text,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    contactCard: {
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    contactInput: {
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 12,
        color: colors.text,
    },
    removeButton: {
        alignItems: 'center',
        padding: 8,
    },
    removeButtonText: {
        color: colors.danger,
        fontSize: 14,
    },
    addButton: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    viewMode: {
        gap: 24,
        paddingBottom: 40,
    },
    qrContainer: {
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        alignSelf: 'center',
    },
    qrLabel: {
        color: '#000',
        marginTop: 12,
        fontWeight: '500',
    },
    emptyText: {
        color: colors.subtext,
    },
    infoCard: {
        backgroundColor: colors.card,
        padding: 24,
        borderRadius: 16,
        gap: 12,
    },
    infoLabel: {
        color: colors.subtext,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoValue: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    cardHeader: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    contactItem: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border || colors.card,
        paddingBottom: 12,
        marginBottom: 12,
    },
    contactName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    contactPhone: {
        color: colors.primary,
        fontSize: 14,
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    secondaryButtonText: {
        color: colors.primary,
    },
    bloodTypeContainer: {
        gap: 8,
        paddingVertical: 4,
    },
    bloodTypeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border || colors.card,
        minWidth: 48,
        alignItems: 'center',
    },
    bloodTypeText: {
        color: colors.text,
        fontWeight: '600',
        fontSize: 16,
    },
});
