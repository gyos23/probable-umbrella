import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Platform, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTaskStore } from '../../src/store/taskStore';
import { QuickAddTask } from '../../src/components/QuickAddTask';
import { DailyFocusModal } from '../../src/components/DailyFocusModal';
import { useTheme } from '../../src/theme/useTheme';
import { haptics } from '../../src/utils/haptics';
import { Task, Project } from '../../src/types';
import { formatDate, isToday, differenceInDays } from '../../src/utils/dateUtils';

export default function DashboardScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const dailyGoal = useTaskStore((state) => state.dailyGoal);
  const focusedTaskIds = useTaskStore((state) => state.focusedTaskIds);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDailyFocusModal, setShowDailyFocusModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    // Simulate refresh - in production, this would sync data
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ Good Morning';
    if (hour < 17) return '🌤️ Good Afternoon';
    if (hour < 21) return '🌆 Good Evening';
    return '🌙 Good Night';
  }, []);

  // Streak tracking
  useEffect(() => {
    const loadStreak = async () => {
      try {
        const streakData = await AsyncStorage.getItem('@FocusFlow:streak');
        if (streakData) {
          const { current, best, lastDate } = JSON.parse(streakData);
          const today = new Date().toDateString();

          // Check if streak should continue
          const last = new Date(lastDate);
          const diffDays = Math.floor((new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays <= 1) {
            setStreak(current);
            setBestStreak(best);
          } else if (diffDays > 1) {
            // Streak broken
            setStreak(0);
            setBestStreak(best);
          }
        }
      } catch (error) {
        console.error('Failed to load streak:', error);
      }
    };

    loadStreak();
  }, []);

  // Update streak when daily goal is met
  useEffect(() => {
    const updateStreak = async () => {
      if (dailyFocusStats && dailyFocusStats.progressPercent === 100) {
        try {
          const today = new Date().toDateString();
          const streakData = await AsyncStorage.getItem('@FocusFlow:streak');

          let newStreak = 1;
          let newBest = 1;
          let lastDate = today;

          if (streakData) {
            const { current, best, lastDate: last } = JSON.parse(streakData);
            lastDate = last;

            if (last !== today) {
              newStreak = current + 1;
              newBest = Math.max(newStreak, best);
              lastDate = today;

              await AsyncStorage.setItem('@FocusFlow:streak', JSON.stringify({
                current: newStreak,
                best: newBest,
                lastDate,
              }));

              setStreak(newStreak);
              setBestStreak(newBest);
            }
          } else {
            await AsyncStorage.setItem('@FocusFlow:streak', JSON.stringify({
              current: 1,
              best: 1,
              lastDate: today,
            }));
            setStreak(1);
            setBestStreak(1);
          }
        } catch (error) {
          console.error('Failed to update streak:', error);
        }
      }
    };

    updateStreak();
  }, [dailyFocusStats]);

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

    const flaggedTasks = tasks.filter(
      (t) => t.isFlagged && t.status !== 'completed'
    );

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      dueTodayTasks,
      upcomingTasks,
      activeProjects,
      flaggedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [tasks, projects]);

  const dailyFocusStats = useMemo(() => {
    if (dailyGoal === 0 || focusedTaskIds.length === 0) {
      return null;
    }

    const focusedTasks = tasks.filter((t) => focusedTaskIds.includes(t.id));
    const completedCount = focusedTasks.filter((t) => t.status === 'completed').length;
    const progressPercent = Math.round((completedCount / dailyGoal) * 100);

    return {
      focusedTasks,
      completedCount,
      progressPercent,
    };
  }, [tasks, dailyGoal, focusedTaskIds]);

  // Smart "Do This Now" task selection
  const suggestedTask = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();

    // Get incomplete tasks
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');

    // Priority 1: Overdue critical/high tasks
    const overdueImportant = incompleteTasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
      return dueDate < now && (t.priority === 'critical' || t.priority === 'high');
    });
    if (overdueImportant.length > 0) return overdueImportant[0];

    // Priority 2: Due today flagged tasks
    const dueTodayFlagged = stats.dueTodayTasks.filter(t => t.isFlagged);
    if (dueTodayFlagged.length > 0) return dueTodayFlagged[0];

    // Priority 3: In-progress tasks
    const inProgress = incompleteTasks.filter(t => t.status === 'in-progress');
    if (inProgress.length > 0) return inProgress[0];

    // Priority 4: Due today tasks by priority
    if (stats.dueTodayTasks.length > 0) {
      return stats.dueTodayTasks.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })[0];
    }

    // Priority 5: High priority tasks
    const highPriority = incompleteTasks.filter(t => t.priority === 'critical' || t.priority === 'high');
    if (highPriority.length > 0) return highPriority[0];

    // Default: First incomplete task
    return incompleteTasks[0] || null;
  }, [tasks, stats]);

  const renderStatCard = (label: string, value: string | number, color: string, onPress?: () => void) => {
    const handlePress = () => {
      if (onPress) {
        haptics.light();
        onPress();
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.statCard,
          {
            backgroundColor: colors.secondaryBackground,
            opacity: onPress ? 1 : 0.8,
          }
        ]}
        onPress={handlePress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.statValue, { color, ...typography.largeTitle }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.secondaryText, ...typography.caption1 }]}>{label}</Text>
        {onPress && <Text style={[styles.statChevron, { color: colors.tertiaryText }]}>›</Text>}
      </TouchableOpacity>
    );
  };

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerGreeting, { color: colors.secondaryText, ...typography.body }]}>
            {greeting}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text, ...typography.largeTitle }]}>
            Command Center
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText, ...typography.body }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Do This Now Hero Section */}
        {suggestedTask && (
          <TouchableOpacity
            style={[styles.heroCard, { backgroundColor: colors.primary }]}
            onPress={() => {
              haptics.medium();
              router.push(`/task/${suggestedTask.id}`);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.heroHeader}>
              <Text style={[styles.heroLabel, { ...typography.caption1 }]}>
                ⚡ DO THIS NOW
              </Text>
              <View style={styles.heroBadge}>
                <Text style={[styles.heroBadgeText, { ...typography.caption2 }]}>
                  {suggestedTask.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.heroTitle, { ...typography.title1 }]} numberOfLines={2}>
              {suggestedTask.title}
            </Text>
            {suggestedTask.dueDate && (
              <Text style={[styles.heroSubtitle, { ...typography.body }]}>
                Due {formatDate(typeof suggestedTask.dueDate === 'string' ? new Date(suggestedTask.dueDate) : suggestedTask.dueDate, 'MMM d, h:mm a')}
              </Text>
            )}
            <View style={styles.heroAction}>
              <Text style={[styles.heroActionText, { ...typography.body }]}>
                Tap to start →
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard('Overdue', stats.overdueTasks.length, colors.red, stats.overdueTasks.length > 0 ? () => router.push('/tasks') : undefined)}
          {renderStatCard('Due Today', stats.dueTodayTasks.length, colors.orange, stats.dueTodayTasks.length > 0 ? () => router.push('/tasks') : undefined)}
          {renderStatCard('Completed', stats.completedTasks, colors.green, () => router.push('/tasks'))}
        </View>

        {/* Streak Counter */}
        {streak > 0 && (
          <View style={[styles.streakCard, { backgroundColor: colors.secondaryBackground }]}>
            <View style={styles.streakContent}>
              <View style={styles.streakMain}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <View>
                  <Text style={[styles.streakNumber, { color: colors.orange, ...typography.title1 }]}>
                    {streak} {streak === 1 ? 'Day' : 'Days'}
                  </Text>
                  <Text style={[styles.streakLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
                    Current Streak
                  </Text>
                </View>
              </View>
              {bestStreak > streak && (
                <View style={styles.streakBest}>
                  <Text style={[styles.streakBestNumber, { color: colors.tertiaryText, ...typography.caption1 }]}>
                    Best: {bestStreak}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Daily Focus Section */}
        {dailyFocusStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
                🎯 Today's Focus
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondaryText, ...typography.caption1 }]}>
                {dailyFocusStats.completedCount} of {dailyGoal} completed
              </Text>
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.secondaryBackground }]}>
              {/* Progress Bar */}
              <View style={[styles.progressBarContainer, { backgroundColor: colors.tertiaryBackground }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: dailyFocusStats.progressPercent === 100 ? colors.green : colors.primary,
                      width: `${dailyFocusStats.progressPercent}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.secondaryText, ...typography.caption1 }]}>
                {dailyFocusStats.progressPercent}% complete
                {dailyFocusStats.progressPercent === 100 && ' 🎉'}
              </Text>

              {/* Focused Tasks */}
              {dailyFocusStats.focusedTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.focusTaskRow,
                    {
                      backgroundColor: task.status === 'completed' ? colors.background : 'transparent',
                      borderLeftColor: task.status === 'completed' ? colors.green : colors.primary,
                    },
                  ]}
                  onPress={() => router.push(`/task/${task.id}`)}
                >
                  <Pressable
                    onPress={() => toggleTaskComplete(task.id)}
                    style={[
                      styles.focusCheckbox,
                      {
                        borderColor: task.status === 'completed' ? colors.green : colors.separator,
                        backgroundColor: task.status === 'completed' ? colors.green : 'transparent',
                      },
                    ]}
                  >
                    {task.status === 'completed' && (
                      <Text style={styles.focusCheckmark}>✓</Text>
                    )}
                  </Pressable>
                  <Text
                    style={[
                      styles.focusTaskTitle,
                      {
                        color: task.status === 'completed' ? colors.tertiaryText : colors.text,
                        textDecorationLine: task.status === 'completed' ? 'line-through' : 'none',
                        ...typography.body,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Flagged Tasks Section */}
        {stats.flaggedTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title2 }]}>
                ⭐ Flagged ({stats.flaggedTasks.length})
              </Text>
            </View>
            <View style={[styles.sectionContent, { backgroundColor: colors.secondaryBackground }]}>
              {stats.flaggedTasks.slice(0, 5).map((task) => renderTaskRow(task))}
              {stats.flaggedTasks.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => router.push('/tasks')}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary, ...typography.caption1 }]}>
                    View all {stats.flaggedTasks.length} flagged tasks
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

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
              style={[styles.quickActionButton, { backgroundColor: colors.green }]}
              onPress={() => setShowDailyFocusModal(true)}
            >
              <Text style={[styles.quickActionText, { ...typography.headline }]}>🎯</Text>
              <Text style={[styles.quickActionLabel, { ...typography.caption1 }]}>Plan Day</Text>
            </TouchableOpacity>
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
              style={[styles.quickActionButton, { backgroundColor: colors.teal }]}
              onPress={() => router.push('/weekly-review')}
            >
              <Text style={[styles.quickActionText, { ...typography.headline }]}>📊</Text>
              <Text style={[styles.quickActionLabel, { ...typography.caption1 }]}>Weekly Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.purple }]}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Text style={[styles.quickActionText, { ...typography.headline }]}>⚙️</Text>
              <Text style={[styles.quickActionLabel, { ...typography.caption1 }]}>Settings</Text>
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

      <DailyFocusModal
        visible={showDailyFocusModal}
        onClose={() => setShowDailyFocusModal(false)}
      />

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
  headerGreeting: {
    marginBottom: 4,
    opacity: 0.9,
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
  heroCard: {
    marginHorizontal: 0,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 30,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  heroAction: {
    alignItems: 'flex-end',
  },
  heroActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  statChevron: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  streakCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakNumber: {
    fontWeight: '700',
  },
  streakLabel: {},
  streakBest: {},
  streakBestNumber: {
    fontWeight: '600',
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
  sectionSubtitle: {
    marginTop: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginVertical: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  focusTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 3,
  },
  focusCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  focusTaskTitle: {
    flex: 1,
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
