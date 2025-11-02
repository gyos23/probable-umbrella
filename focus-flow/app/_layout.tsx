import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTaskStore } from '../src/store/taskStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { DailyFocusModal } from '../src/components/DailyFocusModal';
import { Colors } from '../src/theme/colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loadData = useTaskStore((state) => state.loadData);
  const populateSampleData = useTaskStore((state) => state.populateSampleData);
  const shouldShowDailyPrompt = useTaskStore((state) => state.shouldShowDailyPrompt);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  const [showDailyFocus, setShowDailyFocus] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      // Load settings and task data in parallel
      await Promise.all([
        loadSettings(),
        loadData(),
      ]);

      // If no data exists, populate with sample data
      const currentTasks = useTaskStore.getState().tasks;
      if (currentTasks.length === 0) {
        populateSampleData();
      }

      // Check if we should show daily prompt after data loads
      // Wait a bit for app to fully render first
      setTimeout(() => {
        if (shouldShowDailyPrompt()) {
          setShowDailyFocus(true);
        }
      }, 500);
    };

    initializeData();
  }, []);

  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.primary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="task/[id]"
            options={{
              headerShown: false,
              presentation: 'card'
            }}
          />
          <Stack.Screen
            name="project/[id]"
            options={{
              headerShown: false,
              presentation: 'card'
            }}
          />
          <Stack.Screen
            name="import"
            options={{
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: false,
              presentation: 'card'
            }}
          />
        </Stack>

        <DailyFocusModal
          visible={showDailyFocus}
          onClose={() => setShowDailyFocus(false)}
        />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
