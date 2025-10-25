import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { TaskRow } from '../../src/components/TaskRow';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/useTheme';
import { Task, TaskStatus, TaskPriority } from '../../src/types';

export default function TasksScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);
  const projects = useTaskStore((state) => state.projects);
  const focusAreas = useTaskStore((state) => state.focusAreas);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    notes: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
  });

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      addTask({
        title: newTask.title,
        notes: newTask.notes,
        status: newTask.status,
        priority: newTask.priority,
      });
      setNewTask({
        title: '',
        notes: '',
        status: 'todo',
        priority: 'medium',
      });
      setIsAddModalVisible(false);
    }
  };

  const getTaskCounts = () => {
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  };

  const counts = getTaskCounts();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {(['all', 'todo', 'in-progress', 'completed'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filterStatus === status ? colors.primary : colors.secondaryBackground,
                  borderColor: colors.separator,
                },
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: filterStatus === status ? '#FFFFFF' : colors.text,
                    ...typography.subheadline,
                  },
                ]}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}{' '}
                ({counts[status]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onPress={() => router.push(`/task/${item.id}`)}
            onToggleComplete={() => toggleTaskComplete(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.tertiaryText, ...typography.body }]}>
              {filterStatus === 'all'
                ? 'No tasks yet. Tap + to create your first task!'
                : `No ${filterStatus} tasks`}
            </Text>
          </View>
        }
      />

      <View style={[styles.fab, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => setIsAddModalVisible(true)} style={styles.fabButton}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Text style={[styles.modalCancel, { color: colors.primary, ...typography.body }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text, ...typography.headline }]}>
                New Task
              </Text>
              <TouchableOpacity onPress={handleAddTask} disabled={!newTask.title.trim()}>
                <Text
                  style={[
                    styles.modalDone,
                    {
                      color: newTask.title.trim() ? colors.primary : colors.tertiaryText,
                      ...typography.body,
                      fontWeight: '600',
                    },
                  ]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={[styles.inputGroup, { backgroundColor: colors.secondaryBackground }]}>
                <TextInput
                  style={[styles.input, { color: colors.text, ...typography.body }]}
                  placeholder="Task title"
                  placeholderTextColor={colors.tertiaryText}
                  value={newTask.title}
                  onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                  autoFocus
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  { backgroundColor: colors.secondaryBackground, marginTop: spacing.md },
                ]}
              >
                <TextInput
                  style={[styles.input, styles.notesInput, { color: colors.text, ...typography.body }]}
                  placeholder="Notes (optional)"
                  placeholderTextColor={colors.tertiaryText}
                  value={newTask.notes}
                  onChangeText={(text) => setNewTask({ ...newTask, notes: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
                  Priority
                </Text>
                <View style={styles.optionsRow}>
                  {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor:
                            newTask.priority === priority
                              ? colors.primary
                              : colors.secondaryBackground,
                          borderColor: colors.separator,
                        },
                      ]}
                      onPress={() => setNewTask({ ...newTask, priority })}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          {
                            color: newTask.priority === priority ? '#FFFFFF' : colors.text,
                            ...typography.subheadline,
                          },
                        ]}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
                  Status
                </Text>
                <View style={styles.optionsRow}>
                  {(['todo', 'in-progress', 'blocked'] as TaskStatus[]).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor:
                            newTask.status === status ? colors.primary : colors.secondaryBackground,
                          borderColor: colors.separator,
                        },
                      ]}
                      onPress={() => setNewTask({ ...newTask, status })}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          {
                            color: newTask.status === status ? '#FFFFFF' : colors.text,
                            ...typography.subheadline,
                          },
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontWeight: '600',
  },
  modalCancel: {},
  modalDone: {},
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  inputGroup: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 17,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  section: {
    marginTop: 24,
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
});
