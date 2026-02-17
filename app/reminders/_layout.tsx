import { Stack } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

export default function RemindersLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.background },
            }}
        />
    );
}
