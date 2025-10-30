import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Task } from '../types';
import { useTheme } from '../theme/useTheme';
import { formatDate } from '../utils/dateUtils';

interface TaskRowProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  onDelete?: () => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onPress, onToggleComplete, onDelete }) => {
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

  const handleToggleComplete = () => {
    // Haptic feedback based on completion state
    if (task.status === 'completed') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onToggleComplete();
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Swipe actions
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-150, 0],
      outputRange: [0, 150],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeActions,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: colors.green }]}
          onPress={handleToggleComplete}
          accessibilityLabel={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          accessibilityRole="button"
        >
          <Text style={styles.swipeActionText}>
            {task.status === 'completed' ? '↩' : '✓'}
          </Text>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity
            style={[styles.swipeAction, { backgroundColor: colors.red }]}
            onPress={handleDelete}
            accessibilityLabel="Delete task"
            accessibilityRole="button"
          >
            <Text style={styles.swipeActionText}>🗑</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  // Generate accessibility label
  const getAccessibilityLabel = () => {
    let label = task.title;
    if (task.status === 'completed') {
      label += ', completed';
    }
    label += `, priority: ${task.priority}`;
    if (task.dueDate) {
      label += `, due ${formatDate(task.dueDate, 'MMMM d')}`;
    }
    if (task.dependsOn.length > 0) {
      label += `, depends on ${task.dependsOn.length} task${task.dependsOn.length > 1 ? 's' : ''}`;
    }
    return label;
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: colors.separator,
            ...shadow.sm,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint="Double tap to view task details. Swipe left for quick actions."
        accessibilityState={{
          checked: task.status === 'completed',
        }}
      >
        <View style={styles.content}>
          <Pressable
            onPress={handleToggleComplete}
            style={[
              styles.checkbox,
              {
                borderColor: task.status === 'completed' ? colors.green : colors.separator,
                backgroundColor: task.status === 'completed' ? colors.green : 'transparent',
              },
            ]}
            accessible={true}
            accessibilityRole="checkbox"
            accessibilityLabel={task.status === 'completed' ? 'Task completed' : 'Task not completed'}
            accessibilityHint="Double tap to toggle completion status"
            accessibilityState={{
              checked: task.status === 'completed',
            }}
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
                accessible={false}
              >
                {task.title}
              </Text>
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor() },
                ]}
                accessible={false}
              />
            </View>

            <View style={styles.metadata} accessible={false}>
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
              <View style={styles.dependencies} accessible={false}>
                <Text style={[styles.dependencyText, { color: colors.tertiaryText, ...typography.caption1 }]}>
                  Depends on {task.dependsOn.length} task{task.dependsOn.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginVertical: 3,
    marginHorizontal: 12,
    borderWidth: 0.5,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    marginRight: 8,
    fontSize: 15,
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 3,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 11,
  },
  dependencies: {
    marginTop: 3,
  },
  dependencyText: {
    fontStyle: 'italic',
    fontSize: 11,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: 3,
    marginRight: 12,
  },
  swipeAction: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 5,
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});
