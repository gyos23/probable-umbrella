import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { haptics } from '../utils/haptics';
import { Task, TaskPriority, TaskStatus } from '../types';
import { useTheme } from '../theme/useTheme';
import { formatDate } from '../utils/dateUtils';
import { ViewDensity } from '../store/settingsStore';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface TaskRowProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  onToggleFlag?: () => void;
  onDelete?: () => void;
  onChangeStatus?: (status: TaskStatus) => void;
  onChangePriority?: (priority: TaskPriority) => void;
  density?: ViewDensity;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onPress,
  onToggleComplete,
  onToggleFlag,
  onDelete,
  onChangeStatus,
  onChangePriority,
  density = 'comfortable'
}) => {
  const { colors, typography, spacing, borderRadius, shadow } = useTheme();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Calculate spacing based on view density
  const getDensitySpacing = () => {
    switch (density) {
      case 'compact':
        return {
          verticalPadding: 6,
          horizontalPadding: 10,
          checkboxSize: 18,
          marginVertical: 2,
          titleFontSize: 14,
          metadataGap: 3,
          badgePaddingV: 1,
          badgePaddingH: 6,
        };
      case 'cozy':
        return {
          verticalPadding: 16,
          horizontalPadding: 14,
          checkboxSize: 22,
          marginVertical: 30, // 60px total spacing between tasks
          titleFontSize: 16,
          metadataGap: 6,
          badgePaddingV: 3,
          badgePaddingH: 8,
          minHeight: isPressed ? 125 : undefined, // 125px when highlighted
        };
      default: // comfortable
        return {
          verticalPadding: 12,
          horizontalPadding: 12,
          checkboxSize: 20,
          marginVertical: 3,
          titleFontSize: 15,
          metadataGap: 5,
          badgePaddingV: 2,
          badgePaddingH: 7,
        };
    }
  };

  const densitySpacing = getDensitySpacing();

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
      haptics.light();
    } else {
      haptics.success();
    }
    onToggleComplete();
  };

  const handleDelete = () => {
    haptics.warning();
    onDelete?.();
  };

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const getContextMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    // Complete/Uncomplete
    items.push({
      label: task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete',
      icon: task.status === 'completed' ? '↩' : '✓',
      onPress: onToggleComplete,
    });

    // Flag/Unflag
    if (onToggleFlag) {
      items.push({
        label: task.isFlagged ? 'Unflag' : 'Flag',
        icon: task.isFlagged ? '⭐' : '☆',
        onPress: onToggleFlag,
      });
    }

    // Status submenu items
    if (onChangeStatus) {
      if (task.status !== 'in-progress') {
        items.push({
          label: 'Start Task',
          icon: '▶',
          onPress: () => onChangeStatus('in-progress'),
        });
      }
      if (task.status !== 'deferred') {
        items.push({
          label: 'Defer',
          icon: '⏸',
          onPress: () => onChangeStatus('deferred'),
        });
      }
      if (task.status !== 'blocked') {
        items.push({
          label: 'Mark Blocked',
          icon: '🚫',
          onPress: () => onChangeStatus('blocked'),
        });
      }
    }

    // Priority submenu items
    if (onChangePriority) {
      const priorityOptions: { priority: TaskPriority; label: string; icon: string; level: number }[] = [
        { priority: 'critical', label: 'Critical Priority', icon: '🔴', level: 3 },
        { priority: 'high', label: 'High Priority', icon: '🟠', level: 2 },
        { priority: 'medium', label: 'Medium Priority', icon: '🟡', level: 1 },
        { priority: 'low', label: 'Low Priority', icon: '🔵', level: 0 },
      ];

      const currentLevel = priorityOptions.find(p => p.priority === task.priority)?.level || 1;

      priorityOptions
        .filter(p => p.priority !== task.priority)
        .forEach(p => {
          items.push({
            label: p.label,
            icon: p.icon,
            onPress: () => {
              if (p.level > currentLevel) {
                haptics.priorityUp();
              } else {
                haptics.priorityDown();
              }
              onChangePriority(p.priority);
            },
          });
        });
    }

    // Edit
    items.push({
      label: 'Edit',
      icon: '✏',
      onPress: handlePress,
    });

    // Delete
    if (onDelete) {
      items.push({
        label: 'Delete',
        icon: '🗑',
        onPress: onDelete,
        destructive: true,
      });
    }

    return items;
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
            marginVertical: densitySpacing.marginVertical,
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
            marginVertical: densitySpacing.marginVertical,
            minHeight: densitySpacing.minHeight,
            ...shadow.sm,
          },
        ]}
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getAccessibilityLabel()}
        accessibilityHint="Double tap to view task details. Swipe left for quick actions. Tap menu button for more options."
        accessibilityState={{
          checked: task.status === 'completed',
        }}
      >
        <View style={[styles.content, {
          padding: densitySpacing.verticalPadding,
          paddingHorizontal: densitySpacing.horizontalPadding,
        }]}>
          <Pressable
            onPress={handleToggleComplete}
            style={[
              styles.checkbox,
              {
                borderColor: task.status === 'completed' ? colors.green : colors.separator,
                backgroundColor: task.status === 'completed' ? colors.green : 'transparent',
                width: densitySpacing.checkboxSize,
                height: densitySpacing.checkboxSize,
                borderRadius: densitySpacing.checkboxSize / 2,
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
              <Text style={[styles.checkmark, { fontSize: densitySpacing.checkboxSize * 0.6 }]}>✓</Text>
            )}
          </Pressable>

          <View style={styles.taskInfo}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  typography.body,
                  {
                    color: task.status === 'completed' ? colors.tertiaryText : colors.text,
                    textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
                    fontSize: densitySpacing.titleFontSize,
                  },
                ]}
                numberOfLines={density === 'compact' ? 1 : 2}
                accessible={false}
              >
                {task.title}
              </Text>
              {onToggleFlag && (
                <TouchableOpacity
                  onPress={() => {
                    if (!task.isFlagged) {
                      haptics.flagged();
                    } else {
                      haptics.soft();
                    }
                    onToggleFlag();
                  }}
                  style={styles.flagButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={task.isFlagged ? 'Unflag task' : 'Flag task'}
                  accessibilityHint="Double tap to toggle flag status"
                >
                  <Text style={[styles.flagIcon, { fontSize: densitySpacing.checkboxSize }]}>
                    {task.isFlagged ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  haptics.medium();
                  setShowContextMenu(true);
                }}
                style={styles.menuButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="More options"
                accessibilityHint="Double tap to show task options"
              >
                <Text style={[styles.menuIcon, { fontSize: densitySpacing.checkboxSize, color: colors.secondaryText }]}>
                  ⋯
                </Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor() },
                ]}
                accessible={false}
              />
            </View>

            <View style={[styles.metadata, { gap: densitySpacing.metadataGap }]} accessible={false}>
              {task.dueDate && (
                <View style={[styles.badge, {
                  backgroundColor: colors.secondaryBackground,
                  paddingVertical: densitySpacing.badgePaddingV,
                  paddingHorizontal: densitySpacing.badgePaddingH,
                }]}>
                  <Text style={[styles.badgeText, { color: colors.secondaryText, ...typography.caption1 }]}>
                    Due: {formatDate(task.dueDate, 'MMM d')}
                  </Text>
                </View>
              )}
              {task.plannedDate && density !== 'compact' && (
                <View style={[styles.badge, {
                  backgroundColor: colors.secondaryBackground,
                  paddingVertical: densitySpacing.badgePaddingV,
                  paddingHorizontal: densitySpacing.badgePaddingH,
                }]}>
                  <Text style={[styles.badgeText, { color: colors.secondaryText, ...typography.caption1 }]}>
                    Planned: {formatDate(task.plannedDate, 'MMM d')}
                  </Text>
                </View>
              )}
              {task.progress > 0 && task.progress < 100 && (
                <View style={[styles.badge, {
                  backgroundColor: colors.secondaryBackground,
                  paddingVertical: densitySpacing.badgePaddingV,
                  paddingHorizontal: densitySpacing.badgePaddingH,
                }]}>
                  <Text style={[styles.badgeText, { color: colors.secondaryText, ...typography.caption1 }]}>
                    {task.progress}%
                  </Text>
                </View>
              )}
            </View>

            {task.dependsOn.length > 0 && density !== 'compact' && (
              <View style={styles.dependencies} accessible={false}>
                <Text style={[styles.dependencyText, { color: colors.tertiaryText, ...typography.caption1 }]}>
                  Depends on {task.dependsOn.length} task{task.dependsOn.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <ContextMenu
        visible={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        items={getContextMenuItems()}
      />
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginHorizontal: 12,
    borderWidth: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    borderWidth: 1.5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
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
  },
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
  },
  flagButton: {
    paddingHorizontal: 4,
    marginRight: 4,
    marginTop: -2,
  },
  flagIcon: {
    color: '#FFD700',
  },
  menuButton: {
    paddingHorizontal: 4,
    marginRight: 4,
    marginTop: -2,
  },
  menuIcon: {
    fontWeight: '700',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  badge: {
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
