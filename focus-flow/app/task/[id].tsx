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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { TaskStatus, TaskPriority } from '../../src/types';
import { format } from 'date-fns';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  const task = useTaskStore((state) => state.tasks.find((t) => t.id === id));
  const projects = useTaskStore((state) => state.projects);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const [title, setTitle] = useState(task?.title || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [projectId, setProjectId] = useState<string | undefined>(task?.projectId);

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Task not found</Text>
      </SafeAreaView>
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

  const handleSetDueDate = () => {
    // For now, set to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateTask(id!, { dueDate: tomorrow });
  };

  const handleSetPlannedDate = () => {
    // For now, set to today
    const today = new Date();
    updateTask(id!, { plannedDate: today });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
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
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
                Due Date
              </Text>
              {task.dueDate ? (
                <View style={styles.dateValue}>
                  <Text style={[styles.dateText, { color: colors.text, ...typography.body }]}>
                    {format(task.dueDate, 'MMM d, yyyy')}
                  </Text>
                  <TouchableOpacity onPress={() => updateTask(id!, { dueDate: undefined })}>
                    <Text style={[styles.clearButton, { color: colors.red }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={handleSetDueDate}>
                  <Text style={[styles.addButton, { color: colors.primary }]}>Set Date</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
                Planned Date
              </Text>
              {task.plannedDate ? (
                <View style={styles.dateValue}>
                  <Text style={[styles.dateText, { color: colors.text, ...typography.body }]}>
                    {format(task.plannedDate, 'MMM d, yyyy')}
                  </Text>
                  <TouchableOpacity onPress={() => updateTask(id!, { plannedDate: undefined })}>
                    <Text style={[styles.clearButton, { color: colors.red }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={handleSetPlannedDate}>
                  <Text style={[styles.addButton, { color: colors.primary }]}>Set Date</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={[styles.deleteButtonText, { color: colors.red, ...typography.body }]}>
              Delete Task
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
