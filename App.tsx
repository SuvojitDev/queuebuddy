import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueueProvider } from './src/context/QueueContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <QueueProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </QueueProvider>
    </SafeAreaProvider>
  );
}
