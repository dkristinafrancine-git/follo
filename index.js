import { AppRegistry } from 'react-native';
import 'expo-router/entry';

// Register background handler for the Widget
AppRegistry.registerHeadlessTask('WidgetActionTask', () => require('./src/services/widgetHeadlessTask'));
