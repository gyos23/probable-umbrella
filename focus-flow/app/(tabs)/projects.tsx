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
import { useTheme } from '../../src/theme/useTheme';
import { Project } from '../../src/types';

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

export default function ProjectsScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const projects = useTaskStore((state) => state.projects);
  const tasks = useTaskStore((state) => state.tasks);
  const addProject = useTaskStore((state) => state.addProject);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
  });

  const handleAddProject = () => {
    if (newProject.name.trim()) {
      addProject({
        name: newProject.name,
        description: newProject.description,
        color: newProject.color,
      });
      setNewProject({
        name: '',
        description: '',
        color: PROJECT_COLORS[0],
      });
      setIsAddModalVisible(false);
    }
  };

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter((task) => task.projectId === projectId).length;
  };

  const getProjectCompletedCount = (projectId: string) => {
    return tasks.filter((task) => task.projectId === projectId && task.status === 'completed').length;
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const taskCount = getProjectTaskCount(item.id);
    const completedCount = getProjectCompletedCount(item.id);
    const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;

    return (
      <TouchableOpacity
        style={[
          styles.projectCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.separator,
          },
        ]}
        onPress={() => router.push(`/project/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.colorBar, { backgroundColor: item.color }]} />
        <View style={styles.projectContent}>
          <Text style={[styles.projectName, { color: colors.text, ...typography.headline }]}>
            {item.name}
          </Text>
          {item.description && (
            <Text
              style={[styles.projectDescription, { color: colors.secondaryText, ...typography.subheadline }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View style={styles.projectStats}>
            <Text style={[styles.statText, { color: colors.secondaryText, ...typography.caption1 }]}>
              {taskCount} task{taskCount !== 1 ? 's' : ''} • {completedCount} completed
            </Text>
          </View>

          <View style={[styles.progressBarContainer, { backgroundColor: colors.tertiaryBackground }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: item.color, width: `${progress}%` },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.tertiaryText, ...typography.body }]}>
              No projects yet. Tap + to create your first project!
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
                New Project
              </Text>
              <TouchableOpacity onPress={handleAddProject} disabled={!newProject.name.trim()}>
                <Text
                  style={[
                    styles.modalDone,
                    {
                      color: newProject.name.trim() ? colors.primary : colors.tertiaryText,
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
                  placeholder="Project name"
                  placeholderTextColor={colors.tertiaryText}
                  value={newProject.name}
                  onChangeText={(text) => setNewProject({ ...newProject, name: text })}
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
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.tertiaryText}
                  value={newProject.description}
                  onChangeText={(text) => setNewProject({ ...newProject, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, ...typography.headline }]}>
                  Color
                </Text>
                <View style={styles.colorGrid}>
                  {PROJECT_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newProject.color === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setNewProject({ ...newProject, color })}
                    >
                      {newProject.color === color && (
                        <Text style={styles.colorCheckmark}>✓</Text>
                      )}
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
  projectCard: {
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  colorBar: {
    height: 4,
  },
  projectContent: {
    padding: 16,
  },
  projectName: {
    marginBottom: 4,
  },
  projectDescription: {
    marginBottom: 12,
  },
  projectStats: {
    marginBottom: 8,
  },
  statText: {},
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
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
});
