import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { haptics } from '../../src/utils/haptics';
import { useTaskStore } from '../../src/store/taskStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { TaskRow } from '../../src/components/TaskRow';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { CelebrationConfetti } from '../../src/components/CelebrationConfetti';
import { DailyFocusModal } from '../../src/components/DailyFocusModal';
import { TimeBoxCalendar } from '../../src/components/TimeBoxCalendar';
import { useTheme } from '../../src/theme/useTheme';
import { Task, TaskStatus, TaskPriority } from '../../src/types';

export default function TasksScreen() {
  const router = useRouter();
  const { colors, typography, spacing, reduceMotion } = useTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const toggleTaskComplete = useTaskStore((state) => state.toggleTaskComplete);
  const toggleTaskFlag = useTaskStore((state) => state.toggleTaskFlag);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const loadData = useTaskStore((state) => state.loadData);
  const projects = useTaskStore((state) => state.projects);
  const focusAreas = useTaskStore((state) => state.focusAreas);
  const dailyPlan = useTaskStore((state) => state.dailyPlan);
  const viewDensity = useSettingsStore((state) => state.viewDensity);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDailyFocusModal, setShowDailyFocusModal] = useState(false);
  const [showDayView, setShowDayView] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    notes: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
  });

  // Check if daily plan is for today
  const hasTodaysPlan = useMemo(() => {
    if (!dailyPlan) return false;
    const today = new Date().toISOString().split('T')[0];
    return dailyPlan.date === today;
  }, [dailyPlan]);

  // Check if all tasks are completed for celebration
  const allTasksCompleted = useMemo(() => {
    const incompleteTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'deferred'
    );
    return tasks.length > 0 && incompleteTasks.length === 0;
  }, [tasks]);

  // Trigger celebration when all tasks completed
  useEffect(() => {
    if (allTasksCompleted && !reduceMotion) {
      setShowCelebration(true);
    }
  }, [allTasksCompleted, reduceMotion]);

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.refresh();
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredTasks = tasks
    .filter((task) => {
      // Show only flagged filter
      if (showOnlyFlagged && !task.isFlagged) return false;

      // Hide completed filter
      if (hideCompleted && task.status === 'completed') return false;

      // Status filter
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.notes?.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort logic
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        // Sort by date (due date or created date)
        const aDate = a.dueDate || a.createdAt;
        const bDate = b.dueDate || b.createdAt;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      }
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
        {/* Search Bar */}
        <View
          style={[styles.searchContainer, { backgroundColor: colors.secondaryBackground }]}
          accessible={false}
        >
          <Text style={{ fontSize: 16, marginRight: 8 }} accessible={false}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text, ...typography.body }]}
            placeholder="Search tasks..."
            placeholderTextColor={colors.tertiaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessible={true}
            accessibilityLabel="Search tasks"
            accessibilityHint="Type to search through your tasks"
            accessibilityRole="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              accessible={true}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 16, color: colors.tertiaryText }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort and Filter */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.secondaryBackground, borderColor: colors.separator }]}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Text style={[styles.sortButtonText, { color: colors.text, ...typography.subheadline }]}>
              Sort: {sortBy === 'date' ? '📅 Date' : sortBy === 'priority' ? '⚡ Priority' : '🔤 Title'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: hideCompleted ? colors.primary : colors.secondaryBackground,
                borderColor: colors.separator,
                marginLeft: 8,
              }
            ]}
            onPress={() => setHideCompleted(!hideCompleted)}
          >
            <Text style={[styles.sortButtonText, { color: hideCompleted ? '#FFFFFF' : colors.text, ...typography.subheadline }]}>
              {hideCompleted ? '👁️ Show All' : '👁️‍🗨️ Hide Done'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: showOnlyFlagged ? colors.primary : colors.secondaryBackground,
                borderColor: colors.separator,
                marginLeft: 8,
              }
            ]}
            onPress={() => setShowOnlyFlagged(!showOnlyFlagged)}
          >
            <Text style={[styles.sortButtonText, { color: showOnlyFlagged ? '#FFFFFF' : colors.text, ...typography.subheadline }]}>
              {showOnlyFlagged ? '⭐ All' : '⭐ Flagged'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              {
                backgroundColor: colors.green,
                borderColor: colors.separator,
                marginLeft: 8,
              }
            ]}
            onPress={() => {
              haptics.medium();
              setShowDailyFocusModal(true);
            }}
          >
            <Text style={[styles.sortButtonText, { color: '#FFFFFF', ...typography.subheadline }]}>
              🎯 Plan Day
            </Text>
          </TouchableOpacity>

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

        {/* Sort Menu */}
        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            {(['date', 'priority', 'title'] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={styles.sortOption}
                onPress={() => {
                  setSortBy(sort);
                  setShowSortMenu(false);
                }}
              >
                <Text style={[styles.sortOptionText, { color: colors.text, ...typography.body }]}>
                  {sort === 'date' && '📅 Due Date'}
                  {sort === 'priority' && '⚡ Priority'}
                  {sort === 'title' && '🔤 Alphabetical'}
                </Text>
                {sortBy === sort && <Text style={{ color: colors.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          hasTodaysPlan && dailyPlan ? (
            <View style={styles.dayViewContainer}>
              <View style={styles.dayViewHeader}>
                <Text style={[styles.dayViewTitle, { color: colors.text, ...typography.title2 }]}>
                  Today's Schedule
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    setShowDayView(!showDayView);
                  }}
                  style={styles.collapseButton}
                >
                  <Text style={[styles.collapseIcon, { color: colors.secondaryText }]}>
                    {showDayView ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
              </View>
              {showDayView && (
                <View style={styles.calendarWrapper}>
                  <TimeBoxCalendar
                    timeBlocks={dailyPlan.timeBlocks}
                    tasks={tasks.filter(t => dailyPlan.taskIds.includes(t.id))}
                    breakDuration={dailyPlan.breakDuration}
                  />
                </View>
              )}
              <View style={styles.divider} />
              <Text style={[styles.allTasksLabel, { color: colors.secondaryText, ...typography.headline }]}>
                All Tasks
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onPress={() => router.push(`/task/${item.id}`)}
            onToggleComplete={() => toggleTaskComplete(item.id)}
            onToggleFlag={() => toggleTaskFlag(item.id)}
            onDelete={() => deleteTask(item.id)}
            onChangeStatus={(status) => updateTask(item.id, { status })}
            onChangePriority={(priority) => updateTask(item.id, { priority })}
            density={viewDensity}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          searchQuery ? (
            <EmptyState
              emoji="🔍"
              title="No Results"
              message={`No tasks found matching "${searchQuery}"`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          ) : filterStatus === 'all' ? (
            <EmptyState
              emoji="✨"
              title="Ready to Start?"
              message="No tasks yet. Create your first task to get organized and boost your productivity!"
              actionLabel="Create Task"
              onAction={() => setIsAddModalVisible(true)}
            />
          ) : (
            <EmptyState
              emoji={
                filterStatus === 'completed' ? '🎉' :
                filterStatus === 'in-progress' ? '⚡' : '📝'
              }
              title={`No ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Tasks`}
              message={
                filterStatus === 'completed'
                  ? 'Complete some tasks to see them here!'
                  : filterStatus === 'in-progress'
                  ? 'Start working on a task to see it here!'
                  : 'Create a task to get started!'
              }
            />
          )
        }
      />

      <View style={[styles.fab, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.medium();
            setIsAddModalVisible(true);
          }}
          style={styles.fabButton}
          accessible={true}
          accessibilityLabel="Create new task"
          accessibilityHint="Opens a form to create a new task"
          accessibilityRole="button"
        >
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

      <CelebrationConfetti
        trigger={showCelebration}
        onAnimationEnd={() => setShowCelebration(false)}
      />

      <DailyFocusModal
        visible={showDailyFocusModal}
        onClose={() => setShowDailyFocusModal(false)}
      />
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
    paddingHorizontal: 12,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0.5,
    marginRight: 6,
  },
  filterChipText: {
    fontWeight: '500',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButton: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  sortButtonText: {
    fontWeight: '500',
    fontSize: 13,
  },
  sortMenu: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sortOptionText: {
    fontSize: 16,
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
    bottom: 20,
    right: 20,
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
  dayViewContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  dayViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dayViewTitle: {
    fontWeight: '700',
  },
  collapseButton: {
    padding: 8,
  },
  collapseIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  calendarWrapper: {
    height: 400,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  allTasksLabel: {
    fontWeight: '700',
    marginBottom: 8,
  },
});
