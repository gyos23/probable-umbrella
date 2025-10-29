import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../../src/store/taskStore';
import { QuickAddTask } from '../../src/components/QuickAddTask';
import { useTheme } from '../../src/theme/useTheme';
import { Task, Project } from '../../src/types';
import { formatDate, isToday, differenceInDays } from '../../src/utils/dateUtils';

export default function DashboardScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;

    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
      return dueDate < today;
    });

    const dueTodayTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
      return isToday(dueDate);
    });

    const upcomingTasks = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
      const diff = differenceInDays(dueDate, today);
      return diff > 0 && diff <= 7;
    }).sort((a, b) => {
      const dateA = typeof a.dueDate === 'string' ? new Date(a.dueDate) : a.dueDate!;
      const dateB = typeof b.dueDate === 'string' ? new Date(b.dueDate) : b.dueDate!;
      return dateA.getTime() - dateB.getTime();
    });

    const activeProjects = projects.filter(
      (p) => p.status === 'in-progress' || p.status === 'todo'
    );

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      dueTodayTasks,
      upcomingTasks,
      activeProjects,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [tasks, projects]);

  const renderStatCard = (label: string, value: string | number, color: string, onPress?: () => void) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.secondaryBackground }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.statValue, { color, ...typography.largeTitle }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.secondaryText, ...typography.caption1 }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderTaskRow = (task: Task, showProject = true) => {
    const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
    const dueDate = task.dueDate ? (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskRow,
          {
            backgroundColor: isOverdue ? '#FFF5F5' : colors.background,
            borderColor: isOverdue ? '#FEB2B2' : colors.separator,
            borderLeftWidth: isOverdue ? 4 : 1,
            borderLeftColor: isOverdue ? colors.red : colors.separator,
          }
        ]}
        onPress={() => router.push(`/task/${task.id}`)}
      >
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: colors.text, ...typography.body }]} numberOfLines={1}>
            {task.title}
          </Text>
          {showProject && project && (
            <View style={styles.projectBadge}>
              <View style={[styles.projectDot, { backgroundColor: project.color }]} />
              <Text style={[styles.projectName, { color: colors.secondaryText, ...typography.caption2 }]}>
                {project.name}
              </Text>
            </View>
          )}
        </View>
        {dueDate && (
          <Text
            style={[
              styles.taskDate,
              {
                color: isOverdue ? colors.red : colors.secondaryText,
                ...typography.caption1,
              },
            ]}
          >
            {formatDate(dueDate, 'MMM d')}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderProjectCard = (project: Project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const completedCount = projectTasks.filter((t) => t.status === 'completed').length;

    return (
      <TouchableOpacity
        key={project.id}
        style={[styles.projectCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.separator }]}
        onPress={() => router.push(`/project/${project.id}`)}
      >
        <View style={[styles.projectColorBar, { backgroundColor: project.color }]} />
        <View style={styles.projectCardContent}>
          <Text style={[styles.projectCardName, { color: colors.text, ...typography.headline }]} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={[styles.projectCardStats, { color: colors.secondaryText, ...typography.caption1 }]}>
            {completedCount}/{projectTasks.length} tasks • {project.progress}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text, ...typography.largeTitle }]}>
            Command Center
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText, ...typography.body }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard('Total Tasks', stats.totalTasks, colors.blue)}
          {renderStatCard('Completed', stats.completedTasks, colors.green)}
          {renderStatCard('In Progress', stats.inProgressTasks, colors.orange)}
          {renderStatCard('Completion Rate (All Time)', `${stats.completionRate}%`, colors.purple)}
        </View>

        {/* Overdue Section */}
        {stats.overdueTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.red, ...typography.title2 }]}>
                ⚠️ Overdue ({stats.overdueTasks.length})
              </Text>
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.secondaryBackground }]}>
              {stats.overdueTasks.slice(0, 5).map((task) => renderTaskRow(task))}
              {stats.overdueTasks.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => router.push('/tasks')}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary, ...typography.caption1 }]}>
                    View all {stats.overdueTasks.length} overdue tasks
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Due Today Section */}
        {stats.dueTodayTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
                📅 Due Today ({stats.dueTodayTasks.length})
              </Text>
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.secondaryBackground }]}>
              {stats.dueTodayTasks.map((task) => renderTaskRow(task))}
            </View>
          </View>
        )}

        {/* Coming Soon Section */}
        {stats.upcomingTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
                🔮 Coming Soon (Next 7 Days)
              </Text>
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.secondaryBackground }]}>
              {stats.upcomingTasks.slice(0, 5).map((task) => renderTaskRow(task))}
              {stats.upcomingTasks.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => router.push('/forecast')}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary, ...typography.caption1 }]}>
                    View all upcoming tasks
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Active Projects Section */}
        {stats.activeProjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
                📁 Active Projects ({stats.activeProjects.length})
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectsScroll}>
              {stats.activeProjects.map((project) => renderProjectCard(project))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
              ⚡ Quick Actions
            </Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/tasks')}
            >
              <Text style={[styles.quickActionText, { ...typography.headline }]}>✓</Text>
              <Text style={[styles.quickActionLabel, { ...typography.caption1 }]}>All Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.blue }]}
              onPress={() => router.push('/projects')}
            >
              <Text style={[styles.quickActionText, { ...typography.headline }]}>📁</Text>
              <Text style={[styles.quickActionLabel, { ...typography.caption1 }]}>Projects</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.orange }]}
              onPress={() => router.push('/calendar')}
            >
              <Text style={[styles.quickActionText, { ...typography.headline }]}>📅</Text>
              <Text style={[styles.quickActionLabel, { ...typography.caption1 }]}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.purple }]}
              onPress={() => router.push('/list')}
            >
              <Text style={[styles.quickActionText, { ...typography.headline }]}>📊</Text>
              <Text style={[styles.quickActionLabel, { ...typography.caption1 }]}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowQuickAdd(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <QuickAddTask
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 0.5,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  projectName: {
    fontSize: 11,
  },
  taskDate: {
    fontWeight: '600',
    marginLeft: 12,
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontWeight: '600',
  },
  projectsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  projectCard: {
    width: 180,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  projectColorBar: {
    height: 4,
  },
  projectCardContent: {
    padding: 12,
  },
  projectCardName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  projectCardStats: {},
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  quickActionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
