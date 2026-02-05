import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PinScreen from '../../src/screens/auth/PinScreen';

export default function PinRoute() {
    const router = useRouter();
    const { mode } = useLocalSearchParams<{ mode: 'setup' | 'unlock' | 'verify' | 'disable' }>();

    return (
        <PinScreen
            mode={mode || 'setup'}
            onSuccess={() => router.back()}
            onCancel={() => router.back()}
        />
    );
}
