import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { Task } from '../../src/types';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  formatDate as format,
  differenceInDays,
  addDays,
  subDays,
  min,
  max,
} from '../../src/utils/dateUtils';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

const DAY_WIDTH = 40;
const ROW_HEIGHT = 60;
const LEFT_COLUMN_WIDTH = 200;

export default function GanttScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const updateTask = useTaskStore((state) => state.updateTask);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const tasksWithDates = useMemo(() => {
    return tasks.filter((task) => task.startDate || task.plannedDate || task.dueDate);
  }, [tasks]);

  const { minDate, maxDate, days } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const today = new Date();
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return {
        minDate: start,
        maxDate: end,
        days: eachDayOfInterval({ start, end }),
      };
    }

    const dates = tasksWithDates
      .flatMap((task) => [task.startDate, task.plannedDate, task.dueDate])
      .filter((date): date is Date | string => date != null);

    if (dates.length === 0) {
      const today = new Date();
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return {
        minDate: start,
        maxDate: end,
        days: eachDayOfInterval({ start, end }),
      };
    }

    const earliest = min(dates);
    const latest = max(dates);

    const start = subDays(earliest, 7);
    const end = addDays(latest, 7);

    return {
      minDate: start,
      maxDate: end,
      days: eachDayOfInterval({ start, end }),
    };
  }, [tasksWithDates]);

  const getTaskPosition = (task: Task) => {
    const startDate = task.startDate || task.plannedDate || task.dueDate;
    const endDate = task.dueDate || task.plannedDate || task.startDate;

    if (!startDate || !endDate) return null;

    const startOffset = differenceInDays(startDate, minDate);
    const duration = differenceInDays(endDate, startDate) + 1;

    return {
      x: startOffset * DAY_WIDTH,
      width: duration * DAY_WIDTH,
    };
  };

  const getTaskColor = (task: Task) => {
    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId);
      if (project) return project.color;
    }

    switch (task.priority) {
      case 'critical':
        return colors.red;
      case 'high':
        return colors.orange;
      case 'medium':
        return colors.blue;
      case 'low':
        return colors.teal;
    }
  };

  const handleTaskBarPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  const handleTaskBarLongPress = (task: Task) => {
    Alert.alert(
      'Quick Actions',
      task.title,
      [
        {
          text: 'Mark Complete',
          onPress: () => updateTask(task.id, { status: 'completed', progress: 100 }),
        },
        {
          text: 'Edit',
          onPress: () => router.push(`/task/${task.id}`),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // Render the fixed left column overlay with task names
  const renderLeftColumnOverlay = () => {
    const HEADER_HEIGHT = 60; // Height of the timeline header

    return (
      <View style={[styles.leftColumnOverlay, { width: LEFT_COLUMN_WIDTH, backgroundColor: colors.background }]}>
        {/* Header spacer */}
        <View style={[styles.leftColumnHeader, { height: HEADER_HEIGHT, borderBottomColor: colors.separator }]} />

        {/* Task name cells */}
        {tasksWithDates.map((task, index) => (
          <View
            key={task.id}
            style={[
              styles.taskNameCell,
              {
                height: ROW_HEIGHT,
                backgroundColor: index % 2 === 0 ? colors.background : colors.secondaryBackground,
                borderRightColor: colors.separator,
                borderBottomColor: colors.separator,
              },
            ]}
          >
            <Text
              style={[styles.taskName, { color: colors.text, ...typography.subheadline }]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            {task.progress > 0 && (
              <Text style={[styles.progressText, { color: colors.secondaryText, ...typography.caption1 }]}>
                {task.progress}%
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  // Render the timeline content (header + task rows) in a single scrollable area
  const renderTimelineContent = () => {
    const HEADER_HEIGHT = 60;
    const totalHeight = HEADER_HEIGHT + (tasksWithDates.length * ROW_HEIGHT);
    const totalWidth = LEFT_COLUMN_WIDTH + (days.length * DAY_WIDTH);

    return (
      <View style={[styles.timelineContent, { height: totalHeight, width: totalWidth }]}>
        {/* Timeline Header */}
        <View style={[styles.timelineHeader, { height: HEADER_HEIGHT, borderBottomColor: colors.separator }]}>
          {/* Spacer for left column */}
          <View style={{ width: LEFT_COLUMN_WIDTH }} />

          {/* Days row */}
          <View style={styles.daysRow}>
            {days.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.dayCell,
                  {
                    width: DAY_WIDTH,
                    backgroundColor:
                      format(day, 'EEE') === 'Sat' || format(day, 'EEE') === 'Sun'
                        ? colors.secondaryBackground
                        : colors.background,
                    borderRightColor: colors.separator,
                  },
                ]}
              >
                <Text style={[styles.dayText, { color: colors.secondaryText, ...typography.caption1 }]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[styles.dateText, { color: colors.text, ...typography.caption2 }]}>
                  {format(day, 'd')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Task Rows */}
        {tasksWithDates.map((task, index) => {
          const position = getTaskPosition(task);
          const taskColor = getTaskColor(task);
          const rowTop = HEADER_HEIGHT + (index * ROW_HEIGHT);

          return (
            <View
              key={task.id}
              style={[
                styles.taskRow,
                {
                  position: 'absolute',
                  top: rowTop,
                  left: 0,
                  right: 0,
                  height: ROW_HEIGHT,
                  backgroundColor: index % 2 === 0 ? colors.background : colors.secondaryBackground,
                  borderBottomColor: colors.separator,
                },
              ]}
            >
              {/* Spacer for left column */}
              <View style={{ width: LEFT_COLUMN_WIDTH }} />

              {/* Timeline area with grid and task bar */}
              <View style={[styles.timelineArea, { width: days.length * DAY_WIDTH }]}>
                {/* Grid cells */}
                {days.map((day, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={[
                      styles.gridCell,
                      {
                        left: dayIndex * DAY_WIDTH,
                        width: DAY_WIDTH,
                        borderRightColor: colors.separator,
                      },
                    ]}
                  />
                ))}

                {/* Task bar */}
                {position && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleTaskBarPress(task)}
                    onLongPress={() => handleTaskBarLongPress(task)}
                    onMouseEnter={() => Platform.OS === 'web' && setHoveredTaskId(task.id)}
                    onMouseLeave={() => Platform.OS === 'web' && setHoveredTaskId(null)}
                    style={[
                      styles.taskBar,
                      {
                        left: position.x,
                        width: position.width,
                        backgroundColor: taskColor,
                        opacity: task.status === 'completed' ? 0.5 : hoveredTaskId === task.id ? 1 : 0.9,
                        transform: hoveredTaskId === task.id ? [{ scale: 1.05 }] : [{ scale: 1 }],
                        cursor: Platform.OS === 'web' ? 'pointer' : undefined,
                      } as any,
                    ]}
                  >
                    {task.progress > 0 && task.progress < 100 && (
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${task.progress}%`,
                            backgroundColor: taskColor,
                          },
                        ]}
                      />
                    )}
                    <Text
                      style={[styles.taskBarText, { color: '#FFFFFF', ...typography.caption1 }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    {hoveredTaskId === task.id && Platform.OS === 'web' && (
                      <View style={styles.resizeHandles}>
                        <View style={[styles.resizeHandle, styles.leftHandle, { backgroundColor: '#FFFFFF' }]} />
                        <View style={[styles.resizeHandle, styles.rightHandle, { backgroundColor: '#FFFFFF' }]} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {tasksWithDates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.tertiaryText, ...typography.body }]}>
            No tasks with dates to display on Gantt chart.{'\n\n'}
            Add start dates, planned dates, or due dates to your tasks to see them here.
          </Text>
        </View>
      ) : (
        <View style={styles.ganttContainer}>
          {/* Fixed left column overlay with task names */}
          {renderLeftColumnOverlay()}

          {/* Single unified ScrollView for the entire timeline */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={false}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
            >
              {renderTimelineContent()}
            </ScrollView>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    textAlign: 'center',
  },
  ganttContainer: {
    flex: 1,
    position: 'relative',
  },
  leftColumnOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  leftColumnHeader: {
    borderBottomWidth: 2,
    borderRightWidth: 1,
  },
  timelineContent: {
    position: 'relative',
  },
  timelineHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
  },
  daysRow: {
    flexDirection: 'row',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
  },
  dayText: {
    marginBottom: 2,
  },
  dateText: {},
  taskRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  taskNameCell: {
    padding: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  taskName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  progressText: {},
  timelineArea: {
    position: 'relative',
    height: '100%',
  },
  gridCell: {
    position: 'absolute',
    height: '100%',
    borderRightWidth: 1,
  },
  taskBar: {
    position: 'absolute',
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
    top: '50%',
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'visible',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
  },
  taskBarText: {
    fontWeight: '600',
  },
  resizeHandles: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  resizeHandle: {
    position: 'absolute',
    width: 4,
    height: '100%',
    opacity: 0.8,
  },
  leftHandle: {
    left: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  rightHandle: {
    right: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
});
