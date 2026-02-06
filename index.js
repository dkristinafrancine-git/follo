import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import 'expo-router/entry';

import notifee from '@notifee/react-native';
import { notificationService } from './src/services/notificationService';

// Register background handler for Notifee
notifee.onBackgroundEvent(async (event) => {
    await notificationService.handleNotificationEvent(event);
});

// Register background handler for the Widget
AppRegistry.registerHeadlessTask('WidgetActionTask', () => require('./src/services/widgetHeadlessTask'));
