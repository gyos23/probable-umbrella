import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SectionList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { TaskRow } from '../../src/components/TaskRow';
import { useTheme } from '../../src/theme/useTheme';
import { isSameDay, isToday, addDays } from '../../src/utils/dateUtils';
import { Task } from '../../src/types';

export default function ForecastScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);

  const forecastData = useMemo(() => {
    const today = new Date();
    const sections = [];

    // Filter out completed tasks
    const activeTasks = tasks.filter((t) => t.status !== 'completed');

    // Today
    const todayTasks = activeTasks.filter(
      (task) => task.dueDate && isToday(task.dueDate)
    );

    if (todayTasks.length > 0) {
      sections.push({
        title: 'Today',
        emoji: '📍',
        color: colors.primary,
        data: todayTasks,
      });
    }

    // Overdue
    const overdueTasks = activeTasks.filter(
      (task) => task.dueDate && task.dueDate < today && !isToday(task.dueDate)
    );

    if (overdueTasks.length > 0) {
      sections.push({
        title: 'Overdue',
        emoji: '⚠️',
        color: colors.red,
        data: overdueTasks,
      });
    }

    // Tomorrow
    const tomorrow = addDays(today, 1);
    const tomorrowTasks = activeTasks.filter(
      (task) => task.dueDate && isSameDay(task.dueDate, tomorrow)
    );

    if (tomorrowTasks.length > 0) {
      sections.push({
        title: 'Tomorrow',
        emoji: '📅',
        color: colors.blue,
        data: tomorrowTasks,
      });
    }

    // Next 7 days
    const next7Days = addDays(today, 7);
    const upcomingTasks = activeTasks.filter((task) => {
      if (!task.dueDate) return false;
      return (
        task.dueDate > tomorrow &&
        task.dueDate <= next7Days
      );
    });

    if (upcomingTasks.length > 0) {
      sections.push({
        title: 'Next 7 Days',
        emoji: '🗓️',
        color: colors.secondaryText,
        data: upcomingTasks,
      });
    }

    // Someday (tasks with no due date)
    const somedayTasks = activeTasks.filter((task) => !task.dueDate);

    if (somedayTasks.length > 0) {
      sections.push({
        title: 'Someday',
        emoji: '💭',
        color: colors.tertiaryText,
        data: somedayTasks.slice(0, 5), // Show max 5
      });
    }

    return sections;
  }, [tasks, colors]);

  const getTotalTaskCount = () => {
    return forecastData.reduce((sum, section) => sum + section.data.length, 0);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text, ...typography.largeTitle }]}>
            Forecast
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText, ...typography.body }]}>
            {getTotalTaskCount()} active tasks
          </Text>
        </View>
      </View>

      {forecastData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
          <Text style={[styles.emptyTitle, { color: colors.text, ...typography.title2 }]}>
            All Caught Up!
          </Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText, ...typography.body }]}>
            You have no active tasks with due dates.{'\n'}
            Time to plan your next move!
          </Text>
        </View>
      ) : (
        <SectionList
          sections={forecastData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onPress={() => router.push(`/task/${item.id}`)}
              onToggleComplete={() => toggleTaskComplete(item.id)}
            />
          )}
          renderSectionHeader={({ section: { title, emoji, color, data } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <View style={styles.sectionHeaderContent}>
                <View style={styles.sectionTitleRow}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{emoji}</Text>
                  <Text style={[styles.sectionTitle, { color, ...typography.title3 }]}>
                    {title}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
                  <Text style={[styles.badgeText, { color, ...typography.caption1 }]}>
                    {data.length}
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {},
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
