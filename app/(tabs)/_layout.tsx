import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

function TimelineIcon({ color, size = 24 }: { color: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 8V12L15 15"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
        </Svg>
    );
}

function ScannerIcon({ color, size = 24 }: { color: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M7 3H5C3.89543 3 3 3.89543 3 5V7"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
            <Path
                d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
            <Path
                d="M7 21H5C3.89543 21 3 20.1046 3 19V17"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
            <Path
                d="M17 21H19C20.1046 21 21 20.1046 21 19V17"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
            <Rect x="7" y="8" width="10" height="8" rx="1" stroke={color} strokeWidth={2} />
        </Svg>
    );
}

function MyFlowIcon({ color, size = 24 }: { color: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M3 12L7 8L11 14L17 6L21 12"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M3 18H21"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    );
}

function SettingsIcon({ color, size = 24 }: { color: string; size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
            <Path
                d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    );
}

export default function TabLayout() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#6366f1',
                tabBarInactiveTintColor: '#6b7280',
                tabBarStyle: {
                    backgroundColor: '#0f0f1a',
                    borderTopColor: '#1e1e3f',
                    borderTopWidth: 1,
                    height: 60 + insets.bottom,
                    paddingBottom: 8 + insets.bottom,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.timeline'),
                    tabBarIcon: ({ color }) => <TimelineIcon color={color} />,
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    title: t('tabs.scanner'),
                    tabBarIcon: ({ color }) => <ScannerIcon color={color} />,
                }}
            />
            <Tabs.Screen
                name="my-flow"
                options={{
                    title: t('tabs.myFlow'),
                    tabBarIcon: ({ color }) => <MyFlowIcon color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('tabs.settings'),
                    tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
                }}
            />
        </Tabs>
    );
}
