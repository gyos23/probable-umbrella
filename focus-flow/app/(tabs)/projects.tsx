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
import { EmptyState } from '../../src/components/EmptyState';
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
  const [filterStatus, setFilterStatus] = useState<'active' | 'backlog' | 'archive' | 'all'>('active');
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

  const filteredProjects = projects.filter((project) => {
    if (filterStatus === 'all') return true;

    if (filterStatus === 'active') {
      return project.status === 'in-progress' || project.status === 'todo';
    }

    if (filterStatus === 'backlog') {
      return project.status === 'deferred' || project.status === 'blocked';
    }

    if (filterStatus === 'archive') {
      return project.status === 'completed';
    }

    return true;
  });

  // Organize projects into hierarchy with depth level
  const organizeProjectHierarchy = () => {
    const projectsWithDepth: Array<Project & { depth: number }> = [];

    const addProjectWithChildren = (parentId: string | undefined, depth: number) => {
      const children = filteredProjects
        .filter((p) => p.parentProjectId === parentId)
        .sort((a, b) => a.order - b.order);

      children.forEach((project) => {
        projectsWithDepth.push({ ...project, depth });
        addProjectWithChildren(project.id, depth + 1);
      });
    };

    // Start with root projects (no parent)
    addProjectWithChildren(undefined, 0);

    return projectsWithDepth;
  };

  const hierarchicalProjects = organizeProjectHierarchy();

  const getProjectCounts = () => {
    return {
      all: projects.length,
      active: projects.filter((p) => p.status === 'in-progress' || p.status === 'todo').length,
      backlog: projects.filter((p) => p.status === 'deferred' || p.status === 'blocked').length,
      archive: projects.filter((p) => p.status === 'completed').length,
    };
  };

  const counts = getProjectCounts();

  const renderProjectCard = ({ item }: { item: Project & { depth: number } }) => {
    const taskCount = getProjectTaskCount(item.id);
    const completedCount = getProjectCompletedCount(item.id);
    const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;
    const indentSize = item.depth * 24; // 24px per level

    return (
      <TouchableOpacity
        style={[
          styles.projectCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.separator,
            marginLeft: indentSize,
          },
        ]}
        onPress={() => router.push(`/project/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.colorBar, { backgroundColor: item.color }]} />
        <View style={styles.projectContent}>
          <Text style={[styles.projectName, { color: colors.text, ...typography.headline }]}>
            {item.depth > 0 && '└ '}
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
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text, ...typography.largeTitle }]}>
          Projects
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {(['active', 'backlog', 'archive', 'all'] as const).map((status) => (
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
                {status === 'active' && '🔥 Active'}
                {status === 'backlog' && '📋 Backlog'}
                {status === 'archive' && '📦 Archive'}
                {status === 'all' && '📁 All'}
                {' '}({counts[status]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={hierarchicalProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            emoji="📁"
            title="No Projects Yet"
            message="Projects help you organize related tasks. Create your first project to get started, or import from OmniFocus!"
            actionLabel="Create Project"
            onAction={() => setIsAddModalVisible(true)}
          />
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.importButton, { backgroundColor: colors.secondaryBackground, borderColor: colors.primary }]}
          onPress={() => router.push('/import')}
        >
          <Text style={[styles.importButtonText, { color: colors.primary, ...typography.caption1 }]}>
            📥 Import from OmniFocus
          </Text>
        </TouchableOpacity>

        <View style={[styles.fab, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => setIsAddModalVisible(true)} style={styles.fabButton}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 10,
    marginVertical: 4,
    marginHorizontal: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  colorBar: {
    height: 3,
  },
  projectContent: {
    padding: 12,
  },
  projectName: {
    marginBottom: 3,
    fontSize: 16,
  },
  projectDescription: {
    marginBottom: 10,
    fontSize: 13,
  },
  projectStats: {
    marginBottom: 6,
  },
  statText: {
    fontSize: 13,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'flex-end',
    gap: 12,
  },
  importButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  importButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
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
