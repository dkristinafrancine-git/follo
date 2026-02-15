import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';
import { useActiveProfile } from '../../src/hooks/useProfiles';
import { ReminderForm } from '../../src/components/forms/ReminderForm';
import { useReminders } from '../../src/hooks/useReminders';
import { useEffect, useState } from 'react';
import { reminderService } from '../../src/services/reminderService';
import { Reminder, CreateReminderInput } from '../../src/types';

export default function ManageReminderScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colors } = useTheme();
    const { activeProfile: profile } = useActiveProfile();
    const params = useLocalSearchParams();
    const id = params.id as string | undefined;

    const { createReminder, updateReminder } = useReminders(profile?.id);
    const [initialValues, setInitialValues] = useState<Partial<Reminder> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false); // Local loading for fetch
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            setIsLoading(true);
            reminderService.getById(id)
                .then(reminder => {
                    if (reminder) setInitialValues(reminder);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            // Check for passed type via params to pre-fill
            if (params.type) {
                setInitialValues({ type: params.type as any });
            }
        }
    }, [id, params.type]);

    const handleSubmit = async (data: Partial<CreateReminderInput>) => {
        if (!profile) return;
        setIsSaving(true);
        try {
            if (id) {
                await updateReminder(id, data);
            } else {
                await createReminder({
                    ...data as CreateReminderInput, // Type guard needed or ensure form validation provides all
                    profileId: profile.id,
                });
            }
            router.back();
        } catch (error) {
            console.error('Failed to save reminder', error);
            // Alert handled by hook or global error handler?
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: id ? t('reminder.edit') : t('reminder.add'),
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />
            <ReminderForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onCancel={() => router.back()}
                isLoading={isSaving}
                mode={id ? 'edit' : 'add'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
