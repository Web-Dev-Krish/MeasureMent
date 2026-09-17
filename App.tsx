import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { RootStackParamList } from './src/types';
import { Colors } from './src/theme/colors';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { CameraPermissionScreen } from './src/screens/CameraPermissionScreen';
import { CalibrationScreen } from './src/screens/CalibrationScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { ValidationScreen } from './src/screens/ValidationScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ManualMeasureScreen } from './src/screens/ManualMeasureScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HowItWorksScreen } from './src/screens/HowItWorksScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CameraPermission" component={CameraPermissionScreen} />
          <Stack.Screen name="CalibrationSetup" component={CalibrationScreen} />
          <Stack.Screen name="MultiAngleCapture" component={CaptureScreen} />
          <Stack.Screen name="AccuracyValidation" component={ValidationScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="ManualMeasure" component={ManualMeasureScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
