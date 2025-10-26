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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { TaskRow } from '../../src/components/TaskRow';

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
  const tasks = useTaskStore((state) => state.tasks.filter((t) => t.projectId === id));
  const updateProject = useTaskStore((state) => state.updateProject);
  const deleteProject = useTaskStore((state) => state.deleteProject);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color);
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
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={[styles.deleteButtonText, { color: colors.red, ...typography.body }]}>
              Delete Project
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
});
