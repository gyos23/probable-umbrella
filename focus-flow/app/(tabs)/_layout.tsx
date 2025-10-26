import { Tabs } from 'expo-router';
import { useColorScheme, Text } from 'react-native';
import { Colors } from '../../src/theme/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tertiaryText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.separator,
          borderTopWidth: 0.5,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 28,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <TabBarIcon name="checklist" color={color} />,
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Forecast',
          tabBarIcon: ({ color }) => <TabBarIcon name="forecast" color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <TabBarIcon name="folder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'List',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gantt"
        options={{
          title: 'Gantt',
          tabBarIcon: ({ color }) => <TabBarIcon name="chart" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabBarIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    checklist: '✓',
    forecast: '🔮',
    folder: '📁',
    calendar: '📅',
    list: '📋',
    chart: '📊',
  };

  return (
    <Text style={{ fontSize: 24, color }}>
      {icons[name] || '•'}
    </Text>
  );
}
