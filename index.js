import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import 'expo-router/entry';

import notifee from '@notifee/react-native';
import { notificationService } from './src/services/notificationService';

// Register background handler for Notifee
notifee.onBackgroundEvent(async (event) => {
    // Ensure DB is ready for background actions
    try {
        const { initDatabase } = require('./src/database/index');
        await initDatabase();
    } catch (e) {
        console.error('[Background] Failed to init DB:', e);
    }
    await notificationService.handleNotificationEvent(event);
});

// Register background handler for the Widget
AppRegistry.registerHeadlessTask('WidgetActionTask', () => require('./src/services/widgetHeadlessTask'));
