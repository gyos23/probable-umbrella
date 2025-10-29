import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../src/store/taskStore';
import { TaskRow } from '../../src/components/TaskRow';
import { QuickAddTask } from '../../src/components/QuickAddTask';
import { useTheme } from '../../src/theme/useTheme';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  formatDate as format,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
} from '../../src/utils/dateUtils';

export default function CalendarScreen() {
  const { colors, typography, spacing } = useTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter(
      (task) =>
        (task.dueDate && isSameDay(task.dueDate, selectedDate)) ||
        (task.plannedDate && isSameDay(task.plannedDate, selectedDate))
    );
  }, [tasks, selectedDate]);

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (task) =>
        (task.dueDate && isSameDay(task.dueDate, date)) ||
        (task.plannedDate && isSameDay(task.plannedDate, date))
    );
  };

  const renderCalendarDay = (date: Date) => {
    const isSelected = isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const todayDate = isToday(date);
    const tasksForDate = getTasksForDate(date);
    const hasTasks = tasksForDate.length > 0;
    const hasOverdueTasks = tasksForDate.some(
      (task) => task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
    );

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.calendarDay,
          isSelected && { backgroundColor: colors.primary },
          todayDate && !isSelected && { borderWidth: 2, borderColor: colors.primary },
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text
          style={[
            styles.calendarDayText,
            {
              color: isSelected
                ? '#FFFFFF'
                : isCurrentMonth
                ? colors.text
                : colors.tertiaryText,
              ...typography.body,
            },
            todayDate && !isSelected && { color: colors.primary, fontWeight: '700' },
          ]}
        >
          {format(date, 'd')}
        </Text>
        {hasTasks && (
          <View
            style={[
              styles.taskIndicator,
              {
                backgroundColor: hasOverdueTasks
                  ? colors.red
                  : isSelected
                  ? '#FFFFFF'
                  : colors.blue,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.calendarHeader, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={styles.navButton}
        >
          <Text style={[styles.navButtonText, { color: colors.primary, ...typography.title3 }]}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={[styles.monthTitle, { color: colors.text, ...typography.title2 }]}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={styles.navButton}
        >
          <Text style={[styles.navButtonText, { color: colors.primary, ...typography.title3 }]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.weekDaysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <Text style={[styles.weekDayText, { color: colors.secondaryText, ...typography.caption1 }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((date) => renderCalendarDay(date))}
        </View>
      </View>

      <View style={styles.tasksSection}>
        <Text style={[styles.tasksSectionTitle, { color: colors.text, ...typography.headline }]}>
          {format(selectedDate, 'EEEE, MMMM d')}
        </Text>

        <FlatList
          data={tasksForSelectedDate}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onPress={() => {}}
              onToggleComplete={() => toggleTaskComplete(item.id)}
            />
          )}
          contentContainerStyle={styles.tasksListContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text
                style={[styles.emptyStateText, { color: colors.tertiaryText, ...typography.subheadline }]}
              >
                No tasks for this date
              </Text>
            </View>
          }
        />
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowQuickAdd(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <QuickAddTask
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        defaultDate={selectedDate.toISOString()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 32,
  },
  monthTitle: {
    fontWeight: '700',
  },
  calendarContainer: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayText: {},
  taskIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  tasksSection: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
    paddingTop: 16,
  },
  tasksSectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tasksListContent: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
