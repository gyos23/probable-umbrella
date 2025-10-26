import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { Task, Project } from '../../src/types';
import { formatDate } from '../../src/utils/dateUtils';

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

export default function ListViewScreen() {
  const { colors, typography } = useTheme();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.toolbar}>
        <Text style={[styles.toolbarTitle, { color: colors.text, ...typography.title3 }]}>
          List View
        </Text>
        <TouchableOpacity
          style={[styles.configButton, { backgroundColor: colors.secondaryBackground }]}
          onPress={() => setShowColumnConfig(!showColumnConfig)}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {showColumnConfig && (
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

      <ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === 'web'}>
          <View style={styles.tableContainer}>
            {renderHeader()}
            {projectsWithTasks.map((item, index) => renderProjectGroup(item, index))}
          </View>
        </ScrollView>
      </ScrollView>
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
});
