import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTaskStore } from '../src/store/taskStore';
import { useTheme } from '../src/theme/useTheme';
import { formatDate, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval } from '../src/utils/dateUtils';
import { Task, Project } from '../src/types';

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmedProjects, setConfirmedProjects] = useState<Set<string>>(new Set());

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => endOfWeek(selectedDate), [selectedDate]);

  const weeklyStats = useMemo(() => {
    const weekTasks = tasks.filter((task) => {
      if (!task.createdAt && !task.dueDate && !task.updatedAt) return false;

      const taskDate = task.dueDate || task.updatedAt || task.createdAt;
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });

    const completedThisWeek = weekTasks.filter((t) =>
      t.status === 'completed' &&
      t.updatedAt &&
      isWithinInterval(t.updatedAt, { start: weekStart, end: weekEnd })
    );

    const activeProjects = projects.filter((p) =>
      p.status === 'in-progress' || p.status === 'todo'
    );

    return {
      totalTasks: weekTasks.length,
      completedTasks: completedThisWeek.length,
      activeProjects,
      completionRate: weekTasks.length > 0
        ? Math.round((completedThisWeek.length / weekTasks.length) * 100)
        : 0,
    };
  }, [tasks, projects, weekStart, weekEnd]);

  const toggleProjectConfirmation = (projectId: string) => {
    setConfirmedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const goToPreviousWeek = () => {
    setSelectedDate((prev) => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setSelectedDate((prev) => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setSelectedDate(new Date());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.primary, ...typography.body }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, ...typography.largeTitle }]}>
          Weekly Review
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Week Selector */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.weekSelector}>
            <TouchableOpacity
              onPress={goToPreviousWeek}
              style={[styles.weekButton, { backgroundColor: colors.secondaryBackground }]}
            >
              <Text style={{ fontSize: 20 }}>←</Text>
            </TouchableOpacity>

            <View style={styles.weekInfo}>
              <Text style={[styles.weekRange, { color: colors.text, ...typography.title3 }]}>
                {formatDate(weekStart, 'MMM d')} - {formatDate(weekEnd, 'MMM d, yyyy')}
              </Text>
              <TouchableOpacity onPress={goToCurrentWeek}>
                <Text style={[styles.todayButton, { color: colors.primary, ...typography.caption1 }]}>
                  Today
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={goToNextWeek}
              style={[styles.weekButton, { backgroundColor: colors.secondaryBackground }]}
            >
              <Text style={{ fontSize: 20 }}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Stats */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
            Week Summary
          </Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[styles.statValue, { color: colors.primary, ...typography.largeTitle }]}>
                {weeklyStats.completedTasks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
                Tasks Completed
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[styles.statValue, { color: colors.green, ...typography.largeTitle }]}>
                {weeklyStats.completionRate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
                Completion Rate
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[styles.statValue, { color: colors.orange, ...typography.largeTitle }]}>
                {weeklyStats.activeProjects.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
                Active Projects
              </Text>
            </View>
          </View>
        </View>

        {/* Projects Review */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
            Confirm Active Projects
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
            Review and confirm the projects you're actively working on this week
          </Text>

          {weeklyStats.activeProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.tertiaryText, ...typography.body }]}>
                No active projects found.{'\n'}
                Create some projects to get started!
              </Text>
            </View>
          ) : (
            <View style={styles.projectsList}>
              {weeklyStats.activeProjects.map((project) => {
                const isConfirmed = confirmedProjects.has(project.id);
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;

                return (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectCard,
                      {
                        backgroundColor: isConfirmed ? colors.primary + '20' : colors.secondaryBackground,
                        borderColor: isConfirmed ? colors.primary : colors.separator,
                      },
                    ]}
                    onPress={() => toggleProjectConfirmation(project.id)}
                  >
                    <View style={styles.projectHeader}>
                      <View style={styles.projectInfo}>
                        <View style={[styles.projectColorDot, { backgroundColor: project.color }]} />
                        <Text style={[styles.projectName, { color: colors.text, ...typography.body }]}>
                          {project.name}
                        </Text>
                      </View>
                      <View style={[styles.confirmCheckbox, { borderColor: isConfirmed ? colors.primary : colors.separator }]}>
                        {isConfirmed && <Text style={{ fontSize: 16 }}>✓</Text>}
                      </View>
                    </View>

                    {project.description && (
                      <Text style={[styles.projectDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                        {project.description}
                      </Text>
                    )}

                    <View style={styles.projectStats}>
                      <Text style={[styles.projectStat, { color: colors.secondaryText, ...typography.caption2 }]}>
                        {completedTasks}/{projectTasks.length} tasks completed
                      </Text>
                      <Text style={[styles.projectStat, { color: colors.secondaryText, ...typography.caption2 }]}>
                        {project.progress}% progress
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Confirmation Summary */}
        {confirmedProjects.size > 0 && (
          <View style={[styles.section, { backgroundColor: colors.primary }]}>
            <Text style={[styles.summaryText, { ...typography.body }]}>
              ✓ You've confirmed {confirmedProjects.size} project{confirmedProjects.size === 1 ? '' : 's'} for this week
            </Text>
          </View>
        )}
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
  },
  backButton: {
    fontWeight: '600',
  },
  headerTitle: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekRange: {
    fontWeight: '600',
  },
  todayButton: {
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  projectColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  projectName: {
    fontWeight: '600',
    flex: 1,
  },
  confirmCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectDescription: {
    marginBottom: 8,
  },
  projectStats: {
    flexDirection: 'row',
    gap: 16,
  },
  projectStat: {},
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  summaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
});
