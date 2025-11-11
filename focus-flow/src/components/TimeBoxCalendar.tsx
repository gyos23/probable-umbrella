import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { TimeBlock, Task } from '../types';
import { format } from 'date-fns';

interface TimeBoxCalendarProps {
  timeBlocks: TimeBlock[];
  tasks: Task[];
  breakDuration: number; // in minutes
}

export const TimeBoxCalendar: React.FC<TimeBoxCalendarProps> = ({
  timeBlocks,
  tasks,
  breakDuration,
}) => {
  const { colors, typography, spacing } = useTheme();

  const getTaskById = (taskId: string) => {
    return tasks.find((t) => t.id === taskId);
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const getTotalMinutes = () => {
    return timeBlocks.reduce((sum, block) => sum + block.duration, 0);
  };

  const getTotalWithBreaks = () => {
    const workTime = getTotalMinutes();
    const totalBreaks = breakDuration * (timeBlocks.length - 1);
    return workTime + totalBreaks;
  };

  const renderTimeBlock = (block: TimeBlock, index: number) => {
    const task = getTaskById(block.taskId);
    if (!task) return null;

    const priorityColors = {
      critical: colors.red,
      high: colors.orange,
      medium: colors.yellow,
      low: colors.blue,
    };

    const priorityColor = priorityColors[task.priority] || colors.blue;

    return (
      <View key={`${block.taskId}-${index}`}>
        <View
          style={[
            styles.timeBlock,
            {
              backgroundColor: colors.secondaryBackground,
              borderLeftColor: priorityColor,
              borderLeftWidth: 4,
            },
          ]}
        >
          <View style={styles.timeBlockHeader}>
            <Text
              style={[
                styles.timeText,
                { color: colors.secondaryText, ...typography.caption1 },
              ]}
            >
              {formatTime(block.startTime)} - {formatTime(block.endTime)}
            </Text>
            <Text
              style={[
                styles.durationBadge,
                { color: colors.tertiaryText, ...typography.caption2 },
              ]}
            >
              {block.duration} min
            </Text>
          </View>

          <Text
            style={[styles.taskTitle, { color: colors.text, ...typography.body }]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          <View style={styles.taskMeta}>
            <View
              style={[styles.priorityBadge, { backgroundColor: priorityColor }]}
            >
              <Text
                style={[styles.priorityText, { ...typography.caption2 }]}
              >
                {task.priority.toUpperCase()}
              </Text>
            </View>
            {task.projectId && (
              <Text
                style={[
                  styles.projectText,
                  { color: colors.tertiaryText, ...typography.caption2 },
                ]}
              >
                📁 Project
              </Text>
            )}
          </View>
        </View>

        {index < timeBlocks.length - 1 && breakDuration > 0 && (
          <View
            style={[
              styles.breakBlock,
              { backgroundColor: colors.tertiaryBackground },
            ]}
          >
            <Text
              style={[
                styles.breakText,
                { color: colors.tertiaryText, ...typography.caption1 },
              ]}
            >
              ☕ Break ({breakDuration} min)
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.secondaryText, ...typography.caption1 },
              ]}
            >
              Total Work Time
            </Text>
            <Text
              style={[styles.summaryValue, { color: colors.text, ...typography.headline }]}
            >
              {Math.floor(getTotalMinutes() / 60)}h {getTotalMinutes() % 60}m
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.secondaryText, ...typography.caption1 },
              ]}
            >
              With Breaks
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: colors.secondaryText, ...typography.subheadline },
              ]}
            >
              {Math.floor(getTotalWithBreaks() / 60)}h {getTotalWithBreaks() % 60}m
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
        {timeBlocks.map((block, index) => renderTimeBlock(block, index))}

        {timeBlocks.length > 0 && (
          <View style={styles.endMarker}>
            <Text
              style={[
                styles.endText,
                { color: colors.tertiaryText, ...typography.caption1 },
              ]}
            >
              🎉 Day Complete at{' '}
              {formatTime(timeBlocks[timeBlocks.length - 1].endTime)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  summaryCard: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontWeight: '500',
  },
  summaryValue: {
    fontWeight: '600',
  },
  timeline: {
    flex: 1,
  },
  timeBlock: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  timeBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontWeight: '600',
  },
  durationBadge: {
    fontWeight: '600',
  },
  taskTitle: {
    marginBottom: 8,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  projectText: {
    fontWeight: '500',
  },
  breakBlock: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  breakText: {
    fontWeight: '500',
  },
  endMarker: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  endText: {
    fontWeight: '600',
  },
});
