import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { TaskRow } from '../../src/components/TaskRow';
import { DatePicker } from '../../src/components/DatePicker';
import { TaskPriority } from '../../src/types';

const PROJECT_COLORS = [
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#5AC8FA',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#FF2D55',
];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  const project = useTaskStore((state) => state.projects.find((p) => p.id === id));
  const allProjects = useTaskStore((state) => state.projects);
  const tasks = useTaskStore((state) => state.tasks.filter((t) => t.projectId === id));
  const subprojects = useTaskStore((state) => state.projects.filter((p) => p.parentProjectId === id));
  const updateProject = useTaskStore((state) => state.updateProject);
  const deleteProject = useTaskStore((state) => state.deleteProject);
  const addProject = useTaskStore((state) => state.addProject);
  const addTask = useTaskStore((state) => state.addTask);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0]);
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'completed' | 'deferred' | 'blocked'>(
    project?.status || 'todo'
  );
  const [parentProjectId, setParentProjectId] = useState<string | undefined>(project?.parentProjectId);
  const [startDate, setStartDate] = useState<string | undefined>(
    project?.startDate ? (typeof project.startDate === 'string' ? project.startDate : project.startDate.toISOString()) : undefined
  );
  const [targetDate, setTargetDate] = useState<string | undefined>(
    project?.targetDate ? (typeof project.targetDate === 'string' ? project.targetDate : project.targetDate.toISOString()) : undefined
  );
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddSubprojectModal, setShowAddSubprojectModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newSubprojectName, setNewSubprojectName] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color);
      setStatus(project.status);
      setParentProjectId(project.parentProjectId);
      setStartDate(project.startDate ? (typeof project.startDate === 'string' ? project.startDate : project.startDate.toISOString()) : undefined);
      setTargetDate(project.targetDate ? (typeof project.targetDate === 'string' ? project.targetDate : project.targetDate.toISOString()) : undefined);
    }
  }, [project]);

  if (!project) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Project not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    updateProject(id!, {
      name: name.trim(),
      description: description.trim(),
      color,
      status,
      parentProjectId,
      startDate,
      targetDate,
    });

    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete this project? This will also remove ${tasks.length} task(s) from the project.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProject(id!);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: newTaskPriority,
      projectId: id,
    });

    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setShowAddTaskModal(false);
  };

  const handleAddSubproject = () => {
    if (!newSubprojectName.trim()) return;

    addProject({
      name: newSubprojectName.trim(),
      color: color,
      parentProjectId: id,
    });

    setNewSubprojectName('');
    setShowAddSubprojectModal(false);
  };

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.headerButton, { color: colors.primary, ...typography.body }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, ...typography.headline }]}>
          Edit Project
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
            style={[styles.input, styles.nameInput, { color: colors.text, ...typography.title3 }]}
            placeholder="Project name"
            placeholderTextColor={colors.tertiaryText}
            value={name}
            onChangeText={setName}
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
            style={[styles.input, styles.descriptionInput, { color: colors.text, ...typography.body }]}
            placeholder="Description"
            placeholderTextColor={colors.tertiaryText}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* SMART Framework Display */}
        {project.smartFramework && (
          <View style={[styles.smartFrameworkSection, { backgroundColor: colors.tertiaryBackground, borderColor: colors.primary, marginTop: spacing.md }]}>
            <View style={styles.smartHeader}>
              <Text style={[styles.smartTitle, { color: colors.text, ...typography.title3 }]}>
                🎯 SMART Goal Framework
              </Text>
              <Text style={[styles.smartSubtitle, { color: colors.secondaryText, ...typography.caption1 }]}>
                Your structured goal breakdown
              </Text>
            </View>

            <View style={[styles.smartItem, { backgroundColor: colors.background }]}>
              <View style={styles.smartItemHeader}>
                <View style={[styles.smartBadge, { backgroundColor: colors.blue }]}>
                  <Text style={styles.smartBadgeText}>S</Text>
                </View>
                <Text style={[styles.smartItemTitle, { color: colors.text, ...typography.subheadline }]}>
                  Specific
                </Text>
              </View>
              <Text style={[styles.smartItemContent, { color: colors.secondaryText, ...typography.body }]}>
                {project.smartFramework.specific}
              </Text>
            </View>

            <View style={[styles.smartItem, { backgroundColor: colors.background }]}>
              <View style={styles.smartItemHeader}>
                <View style={[styles.smartBadge, { backgroundColor: colors.green }]}>
                  <Text style={styles.smartBadgeText}>M</Text>
                </View>
                <Text style={[styles.smartItemTitle, { color: colors.text, ...typography.subheadline }]}>
                  Measurable
                </Text>
              </View>
              <Text style={[styles.smartItemContent, { color: colors.secondaryText, ...typography.body }]}>
                {project.smartFramework.measurable}
              </Text>
            </View>

            <View style={[styles.smartItem, { backgroundColor: colors.background }]}>
              <View style={styles.smartItemHeader}>
                <View style={[styles.smartBadge, { backgroundColor: colors.orange }]}>
                  <Text style={styles.smartBadgeText}>A</Text>
                </View>
                <Text style={[styles.smartItemTitle, { color: colors.text, ...typography.subheadline }]}>
                  Achievable
                </Text>
              </View>
              <Text style={[styles.smartItemContent, { color: colors.secondaryText, ...typography.body }]}>
                {project.smartFramework.achievable}
              </Text>
            </View>

            <View style={[styles.smartItem, { backgroundColor: colors.background }]}>
              <View style={styles.smartItemHeader}>
                <View style={[styles.smartBadge, { backgroundColor: colors.purple }]}>
                  <Text style={styles.smartBadgeText}>R</Text>
                </View>
                <Text style={[styles.smartItemTitle, { color: colors.text, ...typography.subheadline }]}>
                  Relevant
                </Text>
              </View>
              <Text style={[styles.smartItemContent, { color: colors.secondaryText, ...typography.body }]}>
                {project.smartFramework.relevant}
              </Text>
            </View>

            <View style={[styles.smartItem, { backgroundColor: colors.background }]}>
              <View style={styles.smartItemHeader}>
                <View style={[styles.smartBadge, { backgroundColor: colors.red }]}>
                  <Text style={styles.smartBadgeText}>T</Text>
                </View>
                <Text style={[styles.smartItemTitle, { color: colors.text, ...typography.subheadline }]}>
                  Time-bound
                </Text>
              </View>
              <Text style={[styles.smartItemContent, { color: colors.secondaryText, ...typography.body }]}>
                {project.smartFramework.timeBound}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Color
          </Text>
          <View style={styles.colorGrid}>
            {PROJECT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorOptionSelected,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && <Text style={styles.colorCheckmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Parent Project
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondaryText, ...typography.caption1 }]}>
            Make this a sub-project of another project
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionChip,
                {
                  backgroundColor: !parentProjectId ? colors.primary : colors.secondaryBackground,
                  borderColor: colors.separator,
                },
              ]}
              onPress={() => setParentProjectId(undefined)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  {
                    color: !parentProjectId ? '#FFFFFF' : colors.text,
                    ...typography.subheadline,
                  },
                ]}
              >
                None
              </Text>
            </TouchableOpacity>
            {allProjects
              .filter((p) => p.id !== id)
              .map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: parentProjectId === p.id ? colors.primary : colors.secondaryBackground,
                      borderColor: colors.separator,
                    },
                  ]}
                  onPress={() => setParentProjectId(p.id)}
                >
                  <View style={[styles.projectDot, { backgroundColor: p.color }]} />
                  <Text
                    style={[
                      styles.optionChipText,
                      {
                        color: parentProjectId === p.id ? '#FFFFFF' : colors.text,
                        ...typography.subheadline,
                      },
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Status
          </Text>
          <View style={styles.statusGrid}>
            <TouchableOpacity
              style={[
                styles.statusOption,
                { backgroundColor: colors.secondaryBackground, borderColor: colors.separator },
                (status === 'todo' || status === 'in-progress') && styles.statusOptionSelected,
                (status === 'todo' || status === 'in-progress') && { borderColor: colors.orange },
              ]}
              onPress={() => setStatus('in-progress')}
            >
              <Text style={styles.statusEmoji}>🔥</Text>
              <Text style={[styles.statusLabel, { color: colors.text, ...typography.caption1 }]}>
                Active
              </Text>
              {(status === 'todo' || status === 'in-progress') && (
                <Text style={styles.statusCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                { backgroundColor: colors.secondaryBackground, borderColor: colors.separator },
                status === 'deferred' && styles.statusOptionSelected,
                status === 'deferred' && { borderColor: colors.blue },
              ]}
              onPress={() => setStatus('deferred')}
            >
              <Text style={styles.statusEmoji}>📋</Text>
              <Text style={[styles.statusLabel, { color: colors.text, ...typography.caption1 }]}>
                Backlog
              </Text>
              {status === 'deferred' && <Text style={styles.statusCheckmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                { backgroundColor: colors.secondaryBackground, borderColor: colors.separator },
                status === 'completed' && styles.statusOptionSelected,
                status === 'completed' && { borderColor: colors.green },
              ]}
              onPress={() => setStatus('completed')}
            >
              <Text style={styles.statusEmoji}>📦</Text>
              <Text style={[styles.statusLabel, { color: colors.text, ...typography.caption1 }]}>
                Archive
              </Text>
              {status === 'completed' && <Text style={styles.statusCheckmark}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Timeline
          </Text>
          <DatePicker
            label="Start Date"
            value={startDate ? new Date(startDate) : undefined}
            onChange={(date) => setStartDate(date?.toISOString())}
            placeholder="No start date"
          />
          <DatePicker
            label="Target Date"
            value={targetDate ? new Date(targetDate) : undefined}
            onChange={(date) => setTargetDate(date?.toISOString())}
            placeholder="No target date"
          />
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Progress
          </Text>
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: colors.secondaryText, ...typography.body }]}>
              {completedTasks} of {tasks.length} tasks completed ({Math.round(progress)}%)
            </Text>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.tertiaryBackground }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: color, width: `${progress}%` },
              ]}
            />
          </View>
        </View>

        {subprojects.length > 0 && (
          <View style={styles.tasksSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
              Sub-Projects ({subprojects.length})
            </Text>
            {subprojects.map((subproject) => (
              <TouchableOpacity
                key={subproject.id}
                style={[styles.subprojectCard, { backgroundColor: colors.secondaryBackground }]}
                onPress={() => router.push(`/project/${subproject.id}`)}
              >
                <View style={[styles.projectDot, { backgroundColor: subproject.color }]} />
                <Text style={[styles.subprojectName, { color: colors.text, ...typography.body }]}>
                  {subproject.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.secondaryBackground }]}
              onPress={() => setShowAddSubprojectModal(true)}
            >
              <Text style={[styles.addButtonText, { color: colors.primary, ...typography.body }]}>
                + Add Sub-Project
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tasksSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
            Tasks ({tasks.length})
          </Text>
          {tasks.length > 0 ? (
            <FlatList
              data={tasks}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskRow
                  task={item}
                  onPress={() => router.push(`/task/${item.id}`)}
                  onToggleComplete={() => toggleTaskComplete(item.id)}
                />
              )}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.tertiaryText, ...typography.body }]}>
              No tasks in this project yet
            </Text>
          )}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.secondaryBackground }]}
            onPress={() => setShowAddTaskModal(true)}
          >
            <Text style={[styles.addButtonText, { color: colors.primary, ...typography.body }]}>
              + Add Task
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={[styles.deleteButtonText, { color: colors.red, ...typography.body }]}>
              Delete Project
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTaskModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddTaskModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.secondaryBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text, ...typography.headline }]}>
              Add Task
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.separator, ...typography.body }]}
              placeholder="Task title"
              placeholderTextColor={colors.tertiaryText}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            <Text style={[styles.inputLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
              Priority
            </Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor: newTaskPriority === p ? colors.primary : colors.background,
                      borderColor: colors.separator,
                    },
                  ]}
                  onPress={() => setNewTaskPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      {
                        color: newTaskPriority === p ? '#FFFFFF' : colors.text,
                        ...typography.caption1,
                      },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.separator }]}
                onPress={() => setShowAddTaskModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text, ...typography.body }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal, { backgroundColor: colors.primary }]}
                onPress={handleAddTask}
              >
                <Text style={[styles.addButtonTextModal, { ...typography.body }]}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Subproject Modal */}
      <Modal
        visible={showAddSubprojectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSubprojectModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddSubprojectModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.secondaryBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text, ...typography.headline }]}>
              Add Sub-Project
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.separator, ...typography.body }]}
              placeholder="Sub-project name"
              placeholderTextColor={colors.tertiaryText}
              value={newSubprojectName}
              onChangeText={setNewSubprojectName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.separator }]}
                onPress={() => setShowAddSubprojectModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text, ...typography.body }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal, { backgroundColor: colors.primary }]}
                onPress={handleAddSubproject}
              >
                <Text style={[styles.addButtonTextModal, { ...typography.body }]}>Add Sub-Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  nameInput: {
    fontWeight: '600',
    minHeight: 40,
  },
  descriptionInput: {
    minHeight: 100,
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
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  optionChipText: {
    fontWeight: '500',
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  colorCheckmark: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statusOptionSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusEmoji: {
    fontSize: 28,
  },
  statusLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  statusCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    color: '#34C759',
    fontSize: 18,
    fontWeight: '700',
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statsRow: {
    marginBottom: 12,
  },
  statsText: {},
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  tasksSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
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
  subprojectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  subprojectName: {
    fontWeight: '500',
  },
  addButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  priorityChipText: {
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  addButtonModal: {},
  addButtonTextModal: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  smartFrameworkSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  smartHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  smartTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  smartSubtitle: {
    fontStyle: 'italic',
  },
  smartItem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  smartItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  smartBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  smartItemTitle: {
    fontWeight: '600',
  },
  smartItemContent: {
    lineHeight: 20,
    marginLeft: 38,
  },
});
