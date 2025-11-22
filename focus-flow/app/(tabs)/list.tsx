import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Platform, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTheme } from '../../src/theme/useTheme';
import { Task, Project, TaskStatus, TaskPriority } from '../../src/types';
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
  const updateTask = useTaskStore((state) => state.updateTask);
  const addTask = useTaskStore((state) => state.addTask);
  const addDependency = useTaskStore((state) => state.addDependency);
  const removeDependency = useTaskStore((state) => state.removeDependency);
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [editingCell, setEditingCell] = useState<{ taskId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkPriorityModal, setShowBulkPriorityModal] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0);
  const inputRef = useRef<TextInput>(null);

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible && c.id !== 'title'), [columns]);

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

  const startColumnResize = (columnId: string, startX: number) => {
    const column = columns.find((c) => c.id === columnId);
    if (column) {
      setResizingColumn(columnId);
      setResizeStartX(startX);
      setResizeStartWidth(column.width);
    }
  };

  const handleColumnResize = (currentX: number) => {
    if (resizingColumn) {
      const delta = currentX - resizeStartX;
      const newWidth = Math.max(80, resizeStartWidth + delta); // Min width of 80
      setColumns((prev) =>
        prev.map((col) =>
          col.id === resizingColumn ? { ...col, width: newWidth } : col
        )
      );
    }
  };

  const stopColumnResize = () => {
    setResizingColumn(null);
  };

  // Add event listeners for column resizing on web
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMouseMove = (e: MouseEvent) => {
        if (resizingColumn) {
          handleColumnResize(e.clientX);
        }
      };

      const handleMouseUp = () => {
        if (resizingColumn) {
          stopColumnResize();
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const startEditing = (taskId: string, columnId: string, currentValue: string, task?: Task) => {
    // Allow editing: title, progress, status, priority, dueDate, dependencies
    if (['title', 'progress', 'status', 'priority', 'dueDate', 'dependencies'].includes(columnId)) {
      setEditingCell({ taskId, columnId });
      setEditValue(currentValue);

      if (['status', 'priority', 'dependencies'].includes(columnId)) {
        setShowPickerModal(true);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const saveEdit = (taskId: string, columnId: string, value?: string) => {
    const valueToSave = value || editValue;

    if (!valueToSave.trim() && columnId === 'title') {
      setEditingCell(null);
      setShowPickerModal(false);
      return;
    }

    const updates: Partial<Task> = {};

    if (columnId === 'title') {
      updates.title = valueToSave.trim();
    } else if (columnId === 'progress') {
      const numValue = parseInt(valueToSave);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        updates.progress = numValue;
      }
    } else if (columnId === 'status') {
      updates.status = valueToSave.toLowerCase() as TaskStatus;
    } else if (columnId === 'priority') {
      updates.priority = valueToSave.toLowerCase() as TaskPriority;
    } else if (columnId === 'dueDate') {
      updates.dueDate = valueToSave;
    }

    if (Object.keys(updates).length > 0) {
      updateTask(taskId, updates);
    }

    setEditingCell(null);
    setEditValue('');
    setShowPickerModal(false);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setShowPickerModal(false);
  };

  const toggleDependency = (taskId: string, dependencyId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.dependsOn.includes(dependencyId)) {
      removeDependency(taskId, dependencyId);
    } else {
      addDependency(taskId, dependencyId);
    }
  };

  const toggleTaskSelection = (taskId: string, shiftKey: boolean = false) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);

      // Shift+click: range select
      if (shiftKey && lastSelectedTaskId && lastSelectedTaskId !== taskId) {
        const allTaskIds = tasks.map(t => t.id);
        const lastIndex = allTaskIds.indexOf(lastSelectedTaskId);
        const currentIndex = allTaskIds.indexOf(taskId);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);

          // Add all tasks in range
          for (let i = start; i <= end; i++) {
            newSet.add(allTaskIds[i]);
          }
        }
      } else {
        // Regular click: toggle single
        if (newSet.has(taskId)) {
          newSet.delete(taskId);
        } else {
          newSet.add(taskId);
        }
      }

      setLastSelectedTaskId(taskId);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  };

  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        status: 'todo',
        priority: 'medium',
      });
      setNewTaskTitle('');
      setShowAddTaskModal(false);
    }
  };

  const bulkUpdateStatus = (status: TaskStatus) => {
    selectedTasks.forEach((taskId) => {
      updateTask(taskId, { status });
    });
    setSelectedTasks(new Set());
    setShowBulkStatusModal(false);
  };

  const bulkUpdatePriority = (priority: TaskPriority) => {
    selectedTasks.forEach((taskId) => {
      updateTask(taskId, { priority });
    });
    setSelectedTasks(new Set());
    setShowBulkPriorityModal(false);
  };

  const bulkDelete = () => {
    if (Platform.OS === 'web') {
      if (confirm(`Delete ${selectedTasks.size} tasks?`)) {
        const deleteTask = useTaskStore.getState().deleteTask;
        selectedTasks.forEach((taskId) => {
          deleteTask(taskId);
        });
        setSelectedTasks(new Set());
      }
    } else {
      Alert.alert(
        'Delete Tasks',
        `Delete ${selectedTasks.size} tasks?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              const deleteTask = useTaskStore.getState().deleteTask;
              selectedTasks.forEach((taskId) => {
                deleteTask(taskId);
              });
              setSelectedTasks(new Set());
            },
          },
        ]
      );
    }
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
      <TouchableOpacity
        style={[styles.checkboxColumn, { borderRightColor: colors.separator }]}
        onPress={toggleSelectAll}
      >
        <View style={[styles.checkbox, { borderColor: colors.separator }]}>
          {selectedTasks.size > 0 && selectedTasks.size === tasks.length && (
            <Text style={styles.checkboxCheck}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
      <View style={[styles.projectColumn, { width: 250, borderRightColor: colors.separator }]}>
        <Text style={[styles.headerText, { color: colors.text, ...typography.headline }]}>Project / Task</Text>
      </View>
      {visibleColumns.map((column, index) => (
        <View
          key={column.id}
          style={[styles.columnHeader, { width: column.width, borderRightColor: colors.separator }]}
        >
          <Text style={[styles.headerText, { color: colors.text, ...typography.headline }]} numberOfLines={1}>
            {column.label}
          </Text>
          {Platform.OS === 'web' && (
            <View
              style={styles.resizeHandle}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e: any) => {
                const nativeEvent = e.nativeEvent;
                if (nativeEvent && nativeEvent.clientX) {
                  startColumnResize(column.id, nativeEvent.clientX);
                }
              }}
            >
              <View style={[styles.resizeHandleBar, { backgroundColor: colors.separator }]} />
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderTaskRow = (task: Task, isLast: boolean) => {
    const isEditingTitle = editingCell?.taskId === task.id && editingCell?.columnId === 'title';
    const isSelected = selectedTasks.has(task.id);

    return (
      <View
        key={task.id}
        style={[
          styles.taskRow,
          {
            backgroundColor: isSelected ? colors.tertiaryBackground : colors.background,
            borderBottomColor: colors.separator,
            borderBottomWidth: isLast ? 0 : 0.5,
            borderLeftWidth: isSelected ? 3 : 0,
            borderLeftColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
      >
        <Pressable
          style={[styles.checkboxColumn, { borderRightColor: colors.separator }]}
          onPress={(e: any) => {
            // On web, Pressable passes the native DOM event which has shiftKey
            let shiftKey = false;
            if (Platform.OS === 'web') {
              // Access the DOM event directly
              const nativeEvent = e?.nativeEvent;
              if (nativeEvent instanceof MouseEvent) {
                shiftKey = nativeEvent.shiftKey;
              }
            }
            toggleTaskSelection(task.id, shiftKey);
          }}
        >
          <View style={[styles.checkbox, { borderColor: colors.separator }]}>
            {selectedTasks.has(task.id) && <Text style={styles.checkboxCheck}>✓</Text>}
          </View>
        </Pressable>
        <TouchableOpacity
          style={[styles.taskTitleCell, { width: 250, borderRightColor: colors.separator }]}
          onPress={() => {
            if (!isEditingTitle) {
              startEditing(task.id, 'title', task.title);
            }
          }}
          onLongPress={() => router.push(`/task/${task.id}`)}
        >
          {isEditingTitle ? (
            <TextInput
              ref={inputRef}
              style={[styles.editInput, { color: colors.text, ...typography.body }]}
              value={editValue}
              onChangeText={setEditValue}
              onBlur={() => saveEdit(task.id, 'title')}
              onSubmitEditing={() => saveEdit(task.id, 'title')}
              autoFocus
            />
          ) : (
            <Text style={[styles.taskTitle, { color: colors.text, ...typography.body }]} numberOfLines={1}>
              {task.title}
            </Text>
          )}
        </TouchableOpacity>
        {visibleColumns.map((column) => {
          const value = getCellValue(task, column.id);
          const isEditing = editingCell?.taskId === task.id && editingCell?.columnId === column.id;
          let textColor = colors.secondaryText;

          if (column.id === 'status') {
            textColor = getStatusColor(value);
          } else if (column.id === 'priority') {
            textColor = getPriorityColor(value);
          } else if (column.id === 'progress') {
            textColor = colors.text;
          }

          return (
            <TouchableOpacity
              key={column.id}
              style={[styles.column, { width: column.width, borderRightColor: colors.separator }]}
              onPress={() => {
                if (!isEditing && ['progress', 'status', 'priority', 'dueDate', 'dependencies'].includes(column.id)) {
                  const cleanValue = column.id === 'progress' ? value.replace('%', '') : value;
                  startEditing(task.id, column.id, cleanValue, task);
                }
              }}
              onLongPress={() => router.push(`/task/${task.id}`)}
            >
              {isEditing && !['status', 'priority', 'dependencies'].includes(column.id) ? (
                column.id === 'dueDate' && Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={editValue && editValue !== '—' ? new Date(editValue).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value);
                        saveEdit(task.id, column.id, newDate.toISOString());
                      }
                    }}
                    style={{
                      padding: 4,
                      fontSize: 12,
                      borderRadius: 4,
                      border: `1px solid ${colors.separator}`,
                      backgroundColor: colors.secondaryBackground,
                      color: colors.text,
                      width: '100%',
                    }}
                  />
                ) : (
                  <TextInput
                    ref={inputRef}
                    style={[styles.editInput, { color: textColor, ...typography.caption1 }]}
                    value={editValue}
                    onChangeText={setEditValue}
                    onBlur={() => saveEdit(task.id, column.id)}
                    onSubmitEditing={() => saveEdit(task.id, column.id)}
                    keyboardType={column.id === 'progress' ? 'numeric' : 'default'}
                    autoFocus
                  />
                )
              ) : (
                <Text style={[styles.cellText, { color: textColor, ...typography.caption1 }]}>
                  {value}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderProjectGroup = (item: { project: Project; tasks: Task[] }, groupIndex: number) => {
    const isCollapsed = collapsedProjects.has(item.project.id);

    return (
      <View key={item.project.id} style={styles.projectGroup}>
        <View style={[styles.projectRow, { backgroundColor: colors.secondaryBackground, borderBottomColor: colors.separator }]}>
          {/* Checkbox column for alignment */}
          <View style={[styles.checkboxColumn, { borderRightColor: colors.separator }]} />

          {/* Project title column with collapse button */}
          <TouchableOpacity
            style={[styles.projectColumn, { width: 250, borderRightColor: colors.separator }]}
            onPress={() => toggleProjectCollapse(item.project.id)}
          >
            <View style={styles.projectHeader}>
              <Text style={{ fontSize: 12, marginRight: 4 }}>
                {isCollapsed ? '▶' : '▼'}
              </Text>
              <View style={[styles.projectColorDot, { backgroundColor: item.project.color }]} />
              <Text style={[styles.projectName, { color: colors.text, ...typography.title3 }]}>
                {item.project.name}
              </Text>
              <Text style={[styles.taskCount, { color: colors.secondaryText, ...typography.caption1 }]}>
                ({item.tasks.length})
              </Text>
            </View>
          </TouchableOpacity>

          {/* Column values */}
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

        {/* Render tasks only if not collapsed */}
        {!isCollapsed && item.tasks.map((task, taskIndex) => renderTaskRow(task, taskIndex === item.tasks.length - 1))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header with Column Config */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.configButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddTaskModal(true)}
        >
          <Text style={{ fontSize: 16, color: '#FFFFFF' }}>+ Add Task</Text>
        </TouchableOpacity>
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

      {/* Bulk Actions Toolbar */}
      {selectedTasks.size > 0 && (
        <View style={[styles.bulkActionsBar, { backgroundColor: colors.primary, borderBottomColor: colors.separator }]}>
          <Text style={[styles.bulkActionsCount, { ...typography.body }]}>
            {selectedTasks.size} selected
          </Text>
          <View style={styles.bulkActionButtons}>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => setShowBulkStatusModal(true)}
            >
              <Text style={[styles.bulkActionButtonText, { ...typography.caption1 }]}>Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => setShowBulkPriorityModal(true)}
            >
              <Text style={[styles.bulkActionButtonText, { ...typography.caption1 }]}>Priority</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: colors.red }]}
              onPress={bulkDelete}
            >
              <Text style={[styles.bulkActionButtonText, { ...typography.caption1 }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}
              onPress={() => setSelectedTasks(new Set())}
            >
              <Text style={[styles.bulkActionButtonText, { ...typography.caption1 }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.outerScrollView}
        contentContainerStyle={styles.outerScrollContent}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <View style={styles.tableContainer}>
            {renderHeader()}
            {projectsWithTasks.map((item, index) => renderProjectGroup(item, index))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Picker Modal for Status/Priority */}
      {showPickerModal && editingCell && (
        <Modal
          visible={showPickerModal}
          transparent
          animationType="fade"
          onRequestClose={cancelEdit}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={cancelEdit}
          >
            <View
              style={[styles.pickerModal, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text, ...typography.headline }]}>
                  {editingCell.columnId === 'status' && 'Select Status'}
                  {editingCell.columnId === 'priority' && 'Select Priority'}
                  {editingCell.columnId === 'dependencies' && 'Select Dependencies'}
                </Text>
                <TouchableOpacity onPress={cancelEdit}>
                  <Text style={[styles.doneButton, { color: colors.primary, ...typography.body }]}>Done</Text>
                </TouchableOpacity>
              </View>

              {editingCell.columnId === 'status' && (
                <>
                  {(['todo', 'in-progress', 'completed', 'blocked', 'deferred'] as TaskStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.pickerOption, { backgroundColor: colors.secondaryBackground }]}
                      onPress={() => saveEdit(editingCell.taskId, editingCell.columnId, s)}
                    >
                      <Text style={[styles.pickerOptionText, { color: getStatusColor(s.charAt(0).toUpperCase() + s.slice(1)), ...typography.body }]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {editingCell.columnId === 'priority' && (
                <>
                  {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pickerOption, { backgroundColor: colors.secondaryBackground }]}
                      onPress={() => saveEdit(editingCell.taskId, editingCell.columnId, p)}
                    >
                      <Text style={[styles.pickerOptionText, { color: getPriorityColor(p.charAt(0).toUpperCase() + p.slice(1)), ...typography.body }]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {editingCell.columnId === 'dependencies' && (
                <ScrollView style={styles.dependenciesScroll}>
                  {tasks
                    .filter((t) => t.id !== editingCell.taskId && t.status !== 'completed')
                    .map((t) => {
                      const currentTask = tasks.find((task) => task.id === editingCell.taskId);
                      const isDependent = currentTask?.dependsOn.includes(t.id);
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.dependencyOption,
                            {
                              backgroundColor: isDependent ? colors.primary : colors.secondaryBackground,
                              borderColor: colors.separator,
                            },
                          ]}
                          onPress={() => toggleDependency(editingCell.taskId, t.id)}
                        >
                          <Text
                            style={[
                              styles.dependencyOptionText,
                              { color: isDependent ? '#FFFFFF' : colors.text, ...typography.body },
                            ]}
                            numberOfLines={1}
                          >
                            {t.title}
                          </Text>
                          {isDependent && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Bulk Status Modal */}
      {showBulkStatusModal && (
        <Modal
          visible={showBulkStatusModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBulkStatusModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBulkStatusModal(false)}
          >
            <View
              style={[styles.pickerModal, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text, ...typography.headline }]}>
                  Change Status ({selectedTasks.size} tasks)
                </Text>
                <TouchableOpacity onPress={() => setShowBulkStatusModal(false)}>
                  <Text style={[styles.doneButton, { color: colors.primary, ...typography.body }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
              {(['todo', 'in-progress', 'completed', 'blocked', 'deferred'] as TaskStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pickerOption, { backgroundColor: colors.secondaryBackground }]}
                  onPress={() => bulkUpdateStatus(s)}
                >
                  <Text style={[styles.pickerOptionText, { color: getStatusColor(s.charAt(0).toUpperCase() + s.slice(1)), ...typography.body }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Bulk Priority Modal */}
      {showBulkPriorityModal && (
        <Modal
          visible={showBulkPriorityModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBulkPriorityModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBulkPriorityModal(false)}
          >
            <View
              style={[styles.pickerModal, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text, ...typography.headline }]}>
                  Change Priority ({selectedTasks.size} tasks)
                </Text>
                <TouchableOpacity onPress={() => setShowBulkPriorityModal(false)}>
                  <Text style={[styles.doneButton, { color: colors.primary, ...typography.body }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
              {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pickerOption, { backgroundColor: colors.secondaryBackground }]}
                  onPress={() => bulkUpdatePriority(p)}
                >
                  <Text style={[styles.pickerOptionText, { color: getPriorityColor(p.charAt(0).toUpperCase() + p.slice(1)), ...typography.body }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <Modal
          visible={showAddTaskModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddTaskModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddTaskModal(false)}
          >
            <View
              style={[styles.addTaskModal, { backgroundColor: colors.card }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text, ...typography.headline }]}>
                  Add New Task
                </Text>
                <TouchableOpacity onPress={() => setShowAddTaskModal(false)}>
                  <Text style={[styles.doneButton, { color: colors.primary, ...typography.body }]}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.addTaskInput, { color: colors.text, backgroundColor: colors.secondaryBackground, borderColor: colors.separator, ...typography.body }]}
                placeholder="Task title..."
                placeholderTextColor={colors.tertiaryText}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                onSubmitEditing={handleAddTask}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.addTaskButton, { backgroundColor: colors.primary }]}
                onPress={handleAddTask}
              >
                <Text style={[styles.addTaskButtonText, { ...typography.body }]}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
  outerScrollView: {
    flex: 1,
  },
  outerScrollContent: {
    flexGrow: 1,
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    minWidth: '100%',
    flex: 1,
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
    paddingVertical: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    flexWrap: 'wrap',
  },
  columnHeader: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    position: 'relative',
  },
  resizeHandle: {
    position: 'absolute',
    right: -4,
    top: 0,
    bottom: 0,
    width: 8,
    cursor: 'col-resize',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  resizeHandleBar: {
    width: 2,
    height: '100%',
    opacity: 0,
  },
  headerText: {
    fontWeight: '700',
  },
  cellText: {
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  editInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontWeight: '600',
  },
  doneButton: {
    fontWeight: '600',
  },
  pickerOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerOptionText: {
    fontWeight: '500',
  },
  dependenciesScroll: {
    maxHeight: 400,
  },
  dependencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  dependencyOptionText: {
    flex: 1,
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  checkboxColumn: {
    width: 50,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bulkActionsCount: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bulkActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addTaskModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  addTaskInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    fontSize: 16,
  },
  addTaskButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
