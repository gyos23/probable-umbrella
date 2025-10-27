import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { Task, Project } from '../../src/types';
import { formatDate, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, addDays, subDays, min, max } from '../../src/utils/dateUtils';

type ViewMode = 'list' | 'gantt';

type Column = {
  id: string;
  label: string;
  width: number;
  visible: boolean;
};

const DEFAULT_COLUMNS: Column[] = [
  { id: 'title', label: 'Title', width: 250, visible: true },
  { id: 'status', label: 'Status', width: 120, visible: true },
  { id: 'priority', label: 'Priority', width: 100, visible: true },
  { id: 'dueDate', label: 'Due Date', width: 120, visible: true },
  { id: 'plannedDate', label: 'Planned', width: 120, visible: false },
  { id: 'startDate', label: 'Start Date', width: 120, visible: false },
  { id: 'progress', label: 'Progress', width: 100, visible: true },
  { id: 'dependencies', label: 'Dependencies', width: 150, visible: true },
];

const DAY_WIDTH = 40;
const ROW_HEIGHT = 60;
const LEFT_COLUMN_WIDTH = 200;

export default function ListViewScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const updateTask = useTaskStore((state) => state.updateTask);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);

  const projectsWithTasks = useMemo(() => {
    const grouped = projects.map((project) => ({
      project,
      tasks: tasks.filter((t) => t.projectId === project.id),
    }));

    // Add unassigned tasks
    const unassignedTasks = tasks.filter((t) => !t.projectId);
    if (unassignedTasks.length > 0) {
      grouped.push({
        project: {
          id: 'unassigned',
          name: 'Inbox',
          description: 'Tasks without a project',
          color: colors.secondaryText,
          status: 'todo' as const,
          progress: 0,
          order: 999,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        tasks: unassignedTasks,
      });
    }

    return grouped;
  }, [projects, tasks, colors]);

  const toggleColumn = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const getCellValue = (task: Task, columnId: string): string => {
    switch (columnId) {
      case 'title':
        return task.title;
      case 'status':
        return task.status.charAt(0).toUpperCase() + task.status.slice(1);
      case 'priority':
        return task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      case 'dueDate':
        return task.dueDate ? formatDate(task.dueDate, 'MMM d, yyyy') : '—';
      case 'plannedDate':
        return task.plannedDate ? formatDate(task.plannedDate, 'MMM d, yyyy') : '—';
      case 'startDate':
        return task.startDate ? formatDate(task.startDate, 'MMM d, yyyy') : '—';
      case 'progress':
        return `${task.progress}%`;
      case 'dependencies':
        return task.dependsOn.length > 0 ? `${task.dependsOn.length} deps` : '—';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.green;
      case 'in-progress':
        return colors.blue;
      case 'blocked':
        return colors.red;
      case 'deferred':
        return colors.orange;
      default:
        return colors.secondaryText;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return colors.red;
      case 'high':
        return colors.orange;
      case 'medium':
        return colors.blue;
      case 'low':
        return colors.teal;
      default:
        return colors.secondaryText;
    }
  };

  // Gantt View Logic
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

  const renderHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: colors.secondaryBackground, borderBottomColor: colors.separator }]}>
      <View style={[styles.projectColumn, { width: 250, borderRightColor: colors.separator }]}>
        <Text style={[styles.headerText, { color: colors.text, ...typography.headline }]}>Project / Task</Text>
      </View>
      {visibleColumns.map((column) => (
        <View
          key={column.id}
          style={[styles.column, { width: column.width, borderRightColor: colors.separator }]}
        >
          <Text style={[styles.headerText, { color: colors.text, ...typography.headline }]} numberOfLines={1}>
            {column.label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTaskRow = (task: Task, isLast: boolean) => (
    <TouchableOpacity
      key={task.id}
      style={[
        styles.taskRow,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.separator,
          borderBottomWidth: isLast ? 0 : 0.5,
        },
      ]}
      onPress={() => router.push(`/task/${task.id}`)}
    >
      <View style={[styles.taskTitleCell, { width: 250, borderRightColor: colors.separator }]}>
        <Text style={[styles.taskTitle, { color: colors.text, ...typography.body }]} numberOfLines={1}>
          {task.title}
        </Text>
      </View>
      {visibleColumns.map((column) => {
        const value = getCellValue(task, column.id);
        let textColor = colors.secondaryText;

        if (column.id === 'status') {
          textColor = getStatusColor(value);
        } else if (column.id === 'priority') {
          textColor = getPriorityColor(value);
        } else if (column.id === 'progress') {
          textColor = colors.text;
        }

        return (
          <View
            key={column.id}
            style={[styles.column, { width: column.width, borderRightColor: colors.separator }]}
          >
            <Text style={[styles.cellText, { color: textColor, ...typography.caption1 }]} numberOfLines={1}>
              {value}
            </Text>
          </View>
        );
      })}
    </TouchableOpacity>
  );

  const renderProjectGroup = (item: { project: Project; tasks: Task[] }, groupIndex: number) => (
    <View key={item.project.id} style={styles.projectGroup}>
      <View style={[styles.projectRow, { backgroundColor: colors.secondaryBackground, borderBottomColor: colors.separator }]}>
        <View style={[styles.projectColumn, { width: 250, borderRightColor: colors.separator }]}>
          <View style={styles.projectHeader}>
            <View style={[styles.projectColorDot, { backgroundColor: item.project.color }]} />
            <Text style={[styles.projectName, { color: colors.text, ...typography.title3 }]}>
              {item.project.name}
            </Text>
            <Text style={[styles.taskCount, { color: colors.secondaryText, ...typography.caption1 }]}>
              ({item.tasks.length})
            </Text>
          </View>
        </View>
        {visibleColumns.map((column) => (
          <View
            key={column.id}
            style={[styles.column, { width: column.width, borderRightColor: colors.separator }]}
          >
            {column.id === 'progress' && (
              <Text style={[styles.cellText, { color: colors.text, ...typography.caption1 }]}>
                {item.project.progress}%
              </Text>
            )}
          </View>
        ))}
      </View>
      {item.tasks.map((task, taskIndex) => renderTaskRow(task, taskIndex === item.tasks.length - 1))}
    </View>
  );

  // Gantt render functions
  const renderGanttTimelineHeader = () => (
    <View style={styles.timelineHeader}>
      <View style={[styles.leftColumn, { width: LEFT_COLUMN_WIDTH }]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.daysRow}>
          {days.map((day, index) => (
            <View
              key={index}
              style={[
                styles.dayCell,
                {
                  width: DAY_WIDTH,
                  backgroundColor:
                    formatDate(day, 'EEE') === 'Sat' || formatDate(day, 'EEE') === 'Sun'
                      ? colors.secondaryBackground
                      : colors.background,
                },
              ]}
            >
              <Text style={[styles.dayText, { color: colors.secondaryText, ...typography.caption1 }]}>
                {formatDate(day, 'EEE')}
              </Text>
              <Text style={[styles.dateText, { color: colors.text, ...typography.caption2 }]}>
                {formatDate(day, 'd')}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderGanttTaskRow = (task: Task, index: number) => {
    const position = getTaskPosition(task);
    const taskColor = getTaskColor(task);

    return (
      <View
        key={task.id}
        style={[
          styles.ganttTaskRow,
          { height: ROW_HEIGHT, backgroundColor: index % 2 === 0 ? colors.background : colors.secondaryBackground },
        ]}
      >
        <View
          style={[
            styles.taskNameCell,
            { width: LEFT_COLUMN_WIDTH, borderRightColor: colors.separator },
          ]}
        >
          <Text
            style={[styles.ganttTaskName, { color: colors.text, ...typography.subheadline }]}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.timelineArea, { width: days.length * DAY_WIDTH }]}>
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
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header with View Toggle */}
      <View style={styles.toolbar}>
        <View style={[styles.viewToggle, { backgroundColor: colors.secondaryBackground }]}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text
              style={[
                styles.viewToggleText,
                { color: viewMode === 'list' ? '#FFFFFF' : colors.text, ...typography.caption1 },
              ]}
            >
              📋 List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'gantt' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setViewMode('gantt')}
          >
            <Text
              style={[
                styles.viewToggleText,
                { color: viewMode === 'gantt' ? '#FFFFFF' : colors.text, ...typography.caption1 },
              ]}
            >
              📊 Gantt
            </Text>
          </TouchableOpacity>
        </View>
        {viewMode === 'list' && (
          <TouchableOpacity
            style={[styles.configButton, { backgroundColor: colors.secondaryBackground }]}
            onPress={() => setShowColumnConfig(!showColumnConfig)}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>

      {viewMode === 'list' && showColumnConfig && (
        <View style={[styles.columnConfig, { backgroundColor: colors.secondaryBackground, borderBottomColor: colors.separator }]}>
          <Text style={[styles.configTitle, { color: colors.text, ...typography.headline }]}>
            Configure Columns
          </Text>
          <View style={styles.columnToggles}>
            {columns.map((column) => (
              <TouchableOpacity
                key={column.id}
                style={[
                  styles.columnToggle,
                  {
                    backgroundColor: column.visible ? colors.primary : colors.background,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={() => toggleColumn(column.id)}
              >
                <Text
                  style={[
                    styles.columnToggleText,
                    {
                      color: column.visible ? '#FFFFFF' : colors.text,
                      ...typography.caption1,
                    },
                  ]}
                >
                  {column.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {viewMode === 'list' ? (
        <ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === 'web'}>
            <View style={styles.tableContainer}>
              {renderHeader()}
              {projectsWithTasks.map((item, index) => renderProjectGroup(item, index))}
            </View>
          </ScrollView>
        </ScrollView>
      ) : (
        <>
          {tasksWithDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.tertiaryText, ...typography.body }]}>
                No tasks with dates to display on Gantt chart.{'\n\n'}
                Add start dates, planned dates, or due dates to your tasks to see them here.
              </Text>
            </View>
          ) : (
            <ScrollView>
              {renderGanttTimelineHeader()}
              {tasksWithDates.map((task, index) => renderGanttTaskRow(task, index))}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toolbarTitle: {
    fontWeight: '600',
  },
  configButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnConfig: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  configTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  columnToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  columnToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  columnToggleText: {
    fontWeight: '500',
  },
  tableContainer: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingVertical: 12,
  },
  projectGroup: {
    marginBottom: 0,
  },
  projectRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  projectColumn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  projectName: {
    fontWeight: '600',
  },
  taskCount: {
    marginLeft: 4,
  },
  taskRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  taskTitleCell: {
    paddingHorizontal: 12,
    paddingLeft: 32,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  taskTitle: {
    fontWeight: '400',
  },
  column: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  headerText: {
    fontWeight: '700',
  },
  cellText: {
    fontWeight: '500',
  },
  // View Toggle Styles
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewToggleText: {
    fontWeight: '600',
  },
  // Gantt Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    textAlign: 'center',
  },
  timelineHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E5E5',
  },
  leftColumn: {
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  daysRow: {
    flexDirection: 'row',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  dayText: {
    marginBottom: 2,
  },
  dateText: {},
  ganttTaskRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskNameCell: {
    padding: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  ganttTaskName: {
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
    transition: 'all 0.2s ease',
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
