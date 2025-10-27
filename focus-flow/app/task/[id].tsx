import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { TaskStatus, TaskPriority } from '../../src/types';
import { formatDate } from '../../src/utils/dateUtils';
import { DatePicker } from '../../src/components/DatePicker';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  const task = useTaskStore((state) => state.tasks.find((t) => t.id === id));
  const allTasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const addTask = useTaskStore((state) => state.addTask);
  const addDependency = useTaskStore((state) => state.addDependency);
  const removeDependency = useTaskStore((state) => state.removeDependency);

  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [projectId, setProjectId] = useState<string | undefined>(task?.projectId);
  const [showNewDependency, setShowNewDependency] = useState(false);
  const [newDependencyTitle, setNewDependencyTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setStatus(task.status);
      setPriority(task.priority);
      setProjectId(task.projectId);
    }
  }, [task]);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Task not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    updateTask(id!, {
      title: title.trim(),
      notes: notes.trim(),
      status,
      priority,
      projectId,
    });

    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTask(id!);
            router.back();
          },
        },
      ]
    );
  };

  const handleCreateDependency = () => {
    if (!newDependencyTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    // Create new task with same project
    addTask({
      title: newDependencyTitle.trim(),
      status: 'todo',
      priority: 'medium',
      projectId: task?.projectId,
    });

    // Get the newly created task ID (it will be the last task)
    setTimeout(() => {
      const allCurrentTasks = useTaskStore.getState().tasks;
      const newTask = allCurrentTasks[allCurrentTasks.length - 1];
      if (newTask) {
        addDependency(id!, newTask.id);
      }
      setNewDependencyTitle('');
      setShowNewDependency(false);
    }, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.headerButton, { color: colors.primary, ...typography.body }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, ...typography.headline }]}>
          Edit Task
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text
            style={[
              styles.headerButton,
              { color: colors.primary, ...typography.body, fontWeight: '600' },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.secondaryBackground }]}>
          <TextInput
            style={[styles.input, styles.titleInput, { color: colors.text, ...typography.title3 }]}
            placeholder="Task title"
            placeholderTextColor={colors.tertiaryText}
            value={title}
            onChangeText={setTitle}
            multiline
          />
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.secondaryBackground, marginTop: spacing.md },
          ]}
        >
          <TextInput
            style={[styles.input, styles.notesInput, { color: colors.text, ...typography.body }]}
            placeholder="Notes"
            placeholderTextColor={colors.tertiaryText}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Priority
          </Text>
          <View style={styles.optionsRow}>
            {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: priority === p ? colors.primary : colors.secondaryBackground,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    {
                      color: priority === p ? '#FFFFFF' : colors.text,
                      ...typography.subheadline,
                    },
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Status
          </Text>
          <View style={styles.optionsRow}>
            {(['todo', 'in-progress', 'completed', 'blocked'] as TaskStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor: status === s ? colors.primary : colors.secondaryBackground,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    {
                      color: status === s ? '#FFFFFF' : colors.text,
                      ...typography.subheadline,
                    },
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Project
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionChip,
                {
                  backgroundColor: !projectId ? colors.primary : colors.secondaryBackground,
                  borderColor: colors.separator,
                },
              ]}
              onPress={() => setProjectId(undefined)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  {
                    color: !projectId ? '#FFFFFF' : colors.text,
                    ...typography.subheadline,
                  },
                ]}
              >
                None
              </Text>
            </TouchableOpacity>
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor:
                      projectId === project.id ? colors.primary : colors.secondaryBackground,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={() => setProjectId(project.id)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    {
                      color: projectId === project.id ? '#FFFFFF' : colors.text,
                      ...typography.subheadline,
                    },
                  ]}
                >
                  {project.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Dates
          </Text>
          <DatePicker
            label="Due Date"
            value={task.dueDate}
            onChange={(date) => updateTask(id!, { dueDate: date })}
            placeholder="No due date"
          />
          <DatePicker
            label="Planned Date"
            value={task.plannedDate}
            onChange={(date) => updateTask(id!, { plannedDate: date })}
            placeholder="No planned date"
          />
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Dependencies
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondaryText, ...typography.caption1 }]}>
            Select tasks that must be completed before this task can start
          </Text>
          <View style={styles.dependenciesContainer}>
            {allTasks
              .filter((t) => t.id !== id && t.status !== 'completed')
              .map((t) => {
                const isDependent = task.dependsOn.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.dependencyChip,
                      {
                        backgroundColor: isDependent ? colors.primary : colors.secondaryBackground,
                        borderColor: colors.separator,
                      },
                    ]}
                    onPress={() => {
                      if (isDependent) {
                        removeDependency(id!, t.id);
                      } else {
                        addDependency(id!, t.id);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.dependencyChipText,
                        {
                          color: isDependent ? '#FFFFFF' : colors.text,
                          ...typography.caption1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
          {task.dependsOn.length === 0 && !showNewDependency && (
            <Text style={[styles.noDependenciesText, { color: colors.tertiaryText, ...typography.caption1 }]}>
              No dependencies added
            </Text>
          )}

          {/* Create New Dependency */}
          {showNewDependency ? (
            <View style={[styles.newDependencyContainer, { backgroundColor: colors.secondaryBackground }]}>
              <TextInput
                style={[styles.newDependencyInput, { color: colors.text, borderColor: colors.separator, ...typography.body }]}
                placeholder="New dependency task title"
                placeholderTextColor={colors.tertiaryText}
                value={newDependencyTitle}
                onChangeText={setNewDependencyTitle}
                autoFocus
              />
              <View style={styles.newDependencyActions}>
                <TouchableOpacity
                  style={[styles.newDependencyButton, { backgroundColor: colors.primary }]}
                  onPress={handleCreateDependency}
                >
                  <Text style={[styles.newDependencyButtonText, { ...typography.caption1 }]}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.newDependencyButton, { backgroundColor: colors.secondaryText }]}
                  onPress={() => {
                    setShowNewDependency(false);
                    setNewDependencyTitle('');
                  }}
                >
                  <Text style={[styles.newDependencyButtonText, { ...typography.caption1 }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addDependencyButton, { borderColor: colors.separator }]}
              onPress={() => setShowNewDependency(true)}
            >
              <Text style={[styles.addDependencyButtonText, { color: colors.primary, ...typography.caption1 }]}>
                + Create New Dependent Task
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={[styles.deleteButtonText, { color: colors.red, ...typography.body }]}>
              Delete Task
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  input: {
    padding: 0,
  },
  titleInput: {
    fontWeight: '600',
    minHeight: 40,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  optionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionSubtitle: {
    marginBottom: 12,
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dependenciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dependencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '100%',
  },
  dependencyChipText: {
    fontWeight: '500',
  },
  noDependenciesText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  newDependencyContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  newDependencyInput: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
  },
  newDependencyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  newDependencyButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  newDependencyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addDependencyButton: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
  },
  addDependencyButtonText: {
    fontWeight: '600',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionChipText: {
    fontWeight: '500',
  },
  dateRow: {
    gap: 16,
  },
  dateItem: {
    paddingVertical: 12,
  },
  dateLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {},
  addButton: {
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerSection: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  deleteButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    fontWeight: '600',
  },
});
