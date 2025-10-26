import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Task } from '../types';
import { useTheme } from '../theme/useTheme';
import { formatDate } from '../utils/dateUtils';

interface TaskRowProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onPress, onToggleComplete }) => {
  const { colors, typography, spacing, borderRadius, shadow } = useTheme();

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'critical':
        return colors.red;
      case 'high':
        return colors.orange;
      case 'medium':
        return colors.yellow;
      case 'low':
        return colors.blue;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return colors.green;
      case 'in-progress':
        return colors.blue;
      case 'blocked':
        return colors.red;
      case 'deferred':
        return colors.tertiaryText;
      default:
        return colors.secondaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.separator,
          ...shadow.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Pressable
          onPress={onToggleComplete}
          style={[
            styles.checkbox,
            {
              borderColor: task.status === 'completed' ? colors.green : colors.separator,
              backgroundColor: task.status === 'completed' ? colors.green : 'transparent',
            },
          ]}
        >
          {task.status === 'completed' && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </Pressable>

        <View style={styles.taskInfo}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: task.status === 'completed' ? colors.tertiaryText : colors.text,
                  textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
                  ...typography.body,
                },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: getPriorityColor() },
              ]}
            />
          </View>

          <View style={styles.metadata}>
            {task.dueDate && (
              <View style={[styles.badge, { backgroundColor: colors.secondaryBackground }]}>
                <Text style={[styles.badgeText, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Due: {formatDate(task.dueDate, 'MMM d')}
                </Text>
              </View>
            )}
            {task.plannedDate && (
              <View style={[styles.badge, { backgroundColor: colors.secondaryBackground }]}>
                <Text style={[styles.badgeText, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Planned: {formatDate(task.plannedDate, 'MMM d')}
                </Text>
              </View>
            )}
            {task.progress > 0 && task.progress < 100 && (
              <View style={[styles.badge, { backgroundColor: colors.secondaryBackground }]}>
                <Text style={[styles.badgeText, { color: colors.secondaryText, ...typography.caption1 }]}>
                  {task.progress}%
                </Text>
              </View>
            )}
          </View>

          {task.dependsOn.length > 0 && (
            <View style={styles.dependencies}>
              <Text style={[styles.dependencyText, { color: colors.tertiaryText, ...typography.caption1 }]}>
                Depends on {task.dependsOn.length} task{task.dependsOn.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
  },
  dependencies: {
    marginTop: 4,
  },
  dependencyText: {
    fontStyle: 'italic',
  },
});
