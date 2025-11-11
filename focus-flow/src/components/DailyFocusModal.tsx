import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptics } from '../utils/haptics';
import { useTheme } from '../theme/useTheme';
import { useTaskStore } from '../store/taskStore';
import { Task, TaskPriority, TimeBlock } from '../types';
import { formatDate } from '../utils/dateUtils';
import { TimeBoxCalendar } from './TimeBoxCalendar';
import { addMinutes, setHours, setMinutes } from 'date-fns';

interface DailyFocusModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'welcome' | 'select' | 'priority' | 'duration' | 'breaks' | 'calendar';

interface TaskPlan {
  taskId: string;
  priority: TaskPriority;
  estimatedMinutes: number;
}

export const DailyFocusModal: React.FC<DailyFocusModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [taskPlans, setTaskPlans] = useState<Map<string, TaskPlan>>(new Map());
  const [breakDuration, setBreakDuration] = useState(15); // minutes
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const tasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const setDailyPlan = useTaskStore((state) => state.setDailyPlan);
  const markPromptShown = useTaskStore((state) => state.markPromptShown);

  // Only show incomplete tasks
  const availableTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed' && t.status !== 'deferred');
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.includes(t.id));
  }, [tasks, selectedTaskIds]);

  const handleClose = () => {
    // Mark as shown even if dismissed
    markPromptShown();
    resetModal();
    onClose();
  };

  const resetModal = () => {
    setStep('welcome');
    setSelectedTaskIds([]);
    setTaskPlans(new Map());
    setBreakDuration(15);
    setCurrentTaskIndex(0);
  };

  const handleSkip = () => {
    haptics.light();
    handleClose();
  };

  const handleContinue = () => {
    haptics.light();
    if (step === 'welcome') {
      setStep('select');
    } else if (step === 'select') {
      setCurrentTaskIndex(0);
      setStep('priority');
    } else if (step === 'priority') {
      // Move to next task or duration step
      if (currentTaskIndex < selectedTaskIds.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      } else {
        setCurrentTaskIndex(0);
        setStep('duration');
      }
    } else if (step === 'duration') {
      // Move to next task or breaks step
      if (currentTaskIndex < selectedTaskIds.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      } else {
        setStep('breaks');
      }
    } else if (step === 'breaks') {
      setStep('calendar');
    }
  };

  const handleBack = () => {
    haptics.light();
    if (step === 'select') {
      setStep('welcome');
    } else if (step === 'priority') {
      if (currentTaskIndex > 0) {
        setCurrentTaskIndex(currentTaskIndex - 1);
      } else {
        setStep('select');
      }
    } else if (step === 'duration') {
      if (currentTaskIndex > 0) {
        setCurrentTaskIndex(currentTaskIndex - 1);
      } else {
        setCurrentTaskIndex(selectedTaskIds.length - 1);
        setStep('priority');
      }
    } else if (step === 'breaks') {
      setCurrentTaskIndex(selectedTaskIds.length - 1);
      setStep('duration');
    } else if (step === 'calendar') {
      setStep('breaks');
    }
  };

  const handleTaskToggle = (taskId: string) => {
    haptics.selection();
    setSelectedTaskIds((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleSetPriority = (taskId: string, priority: TaskPriority) => {
    haptics.selection();
    setTaskPlans((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(taskId) || { taskId, priority: 'medium', estimatedMinutes: 30 };
      newMap.set(taskId, { ...existing, priority });
      return newMap;
    });
  };

  const handleSetDuration = (taskId: string, minutes: number) => {
    setTaskPlans((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(taskId) || { taskId, priority: 'medium', estimatedMinutes: 30 };
      newMap.set(taskId, { ...existing, estimatedMinutes: minutes });
      return newMap;
    });
  };

  const generateTimeBlocks = (): TimeBlock[] => {
    // Start at 9 AM by default
    const startDate = new Date();
    let currentTime = setMinutes(setHours(startDate, 9), 0);
    const blocks: TimeBlock[] = [];

    // Sort tasks by priority
    const sortedTaskIds = [...selectedTaskIds].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const planA = taskPlans.get(a);
      const planB = taskPlans.get(b);
      return priorityOrder[planA?.priority || 'medium'] - priorityOrder[planB?.priority || 'medium'];
    });

    sortedTaskIds.forEach((taskId, index) => {
      const plan = taskPlans.get(taskId);
      if (!plan) return;

      const duration = plan.estimatedMinutes;
      const endTime = addMinutes(currentTime, duration);

      blocks.push({
        taskId,
        startTime: new Date(currentTime),
        endTime,
        duration,
      });

      // Add break time for next task
      if (index < sortedTaskIds.length - 1) {
        currentTime = addMinutes(endTime, breakDuration);
      }
    });

    return blocks;
  };

  const handleConfirm = () => {
    haptics.success();

    const timeBlocks = generateTimeBlocks();

    // Update tasks with priority and estimated duration
    selectedTaskIds.forEach((taskId) => {
      const plan = taskPlans.get(taskId);
      if (plan) {
        updateTask(taskId, {
          priority: plan.priority,
          estimatedDuration: plan.estimatedMinutes / 60, // convert to hours for storage
        });
      }
    });

    // Save the daily plan
    setDailyPlan({
      date: new Date().toISOString().split('T')[0],
      timeBlocks,
      breakDuration,
      totalWorkTime: timeBlocks.reduce((sum, block) => sum + block.duration, 0),
      taskIds: timeBlocks.map((block) => block.taskId),
      createdAt: new Date(),
    });

    handleClose();
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>🌅</Text>
      <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
        Good Morning!
      </Text>
      <Text
        style={[
          styles.description,
          { color: colors.secondaryText, ...typography.body },
        ]}
      >
        Let's create a realistic plan for your day. I'll help you schedule tasks based on priority and time estimates.
      </Text>

      <View style={styles.benefitsContainer}>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitEmoji}>⚡</Text>
          <Text style={[styles.benefitText, { color: colors.text, ...typography.body }]}>
            Prioritize what matters most
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitEmoji}>⏰</Text>
          <Text style={[styles.benefitText, { color: colors.text, ...typography.body }]}>
            Set realistic time estimates
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitEmoji}>📅</Text>
          <Text style={[styles.benefitText, { color: colors.text, ...typography.body }]}>
            See your day time-boxed on a calendar
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary, borderRadius: borderRadius.md },
          ]}
          onPress={handleContinue}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Get started planning your day"
        >
          <Text style={[styles.primaryButtonText, typography.headline]}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={handleSkip}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Skip daily planning"
        >
          <Text style={[styles.textButtonText, { color: colors.secondaryText, ...typography.body }]}>
            Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSelect = () => (
    <View style={[styles.stepContainer, { paddingHorizontal: 0 }]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
          Select Today's Tasks
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.secondaryText, ...typography.body },
          ]}
        >
          Choose the tasks you want to work on today. {selectedTaskIds.length} selected
        </Text>
      </View>

      <ScrollView style={styles.taskList}>
        {availableTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.tertiaryText, ...typography.body }]}>
              No tasks available. Create some tasks first!
            </Text>
          </View>
        ) : (
          availableTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskItem,
                {
                  backgroundColor: selectedTaskIds.includes(task.id)
                    ? colors.secondaryBackground
                    : colors.background,
                  borderColor: selectedTaskIds.includes(task.id)
                    ? colors.primary
                    : colors.separator,
                },
              ]}
              onPress={() => handleTaskToggle(task.id)}
              accessible={true}
              accessibilityRole="checkbox"
              accessibilityLabel={task.title}
              accessibilityState={{ checked: selectedTaskIds.includes(task.id) }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: selectedTaskIds.includes(task.id)
                      ? colors.primary
                      : colors.separator,
                    backgroundColor: selectedTaskIds.includes(task.id)
                      ? colors.primary
                      : 'transparent',
                  },
                ]}
              >
                {selectedTaskIds.includes(task.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>

              <View style={styles.taskInfo}>
                <Text
                  style={[styles.taskTitle, { color: colors.text, ...typography.body }]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
                {task.dueDate && (
                  <Text
                    style={[
                      styles.taskMeta,
                      { color: colors.tertiaryText, ...typography.caption1 },
                    ]}
                  >
                    Due: {formatDate(task.dueDate, 'MMM d')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={[styles.buttonContainer, { paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                selectedTaskIds.length > 0 ? colors.primary : colors.quaternaryText,
              borderRadius: borderRadius.md,
            },
          ]}
          onPress={handleContinue}
          disabled={selectedTaskIds.length === 0}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue to set priorities"
        >
          <Text style={[styles.primaryButtonText, typography.headline]}>
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={handleBack}
          accessible={true}
          accessibilityRole="button"
        >
          <Text style={[styles.textButtonText, { color: colors.secondaryText, ...typography.body }]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPriority = () => {
    const taskId = selectedTaskIds[currentTaskIndex];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const currentPlan = taskPlans.get(taskId);
    const selectedPriority = currentPlan?.priority || task.priority || 'medium';

    const priorities: Array<{ value: TaskPriority; label: string; color: string; emoji: string }> = [
      { value: 'critical', label: 'Critical', color: colors.red, emoji: '🔴' },
      { value: 'high', label: 'High', color: colors.orange, emoji: '🟠' },
      { value: 'medium', label: 'Medium', color: colors.yellow, emoji: '🟡' },
      { value: 'low', label: 'Low', color: colors.blue, emoji: '🔵' },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
          Set Priority
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.secondaryText, ...typography.body },
          ]}
        >
          Task {currentTaskIndex + 1} of {selectedTaskIds.length}
        </Text>

        <View style={[styles.taskCard, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.taskCardTitle, { color: colors.text, ...typography.headline }]}>
            {task.title}
          </Text>
        </View>

        <View style={styles.priorityGrid}>
          {priorities.map((priority) => (
            <TouchableOpacity
              key={priority.value}
              style={[
                styles.priorityCard,
                {
                  backgroundColor:
                    selectedPriority === priority.value
                      ? priority.color
                      : colors.secondaryBackground,
                  borderColor:
                    selectedPriority === priority.value
                      ? priority.color
                      : colors.separator,
                },
              ]}
              onPress={() => handleSetPriority(taskId, priority.value)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${priority.label} priority`}
              accessibilityState={{ selected: selectedPriority === priority.value }}
            >
              <Text style={styles.priorityEmoji}>{priority.emoji}</Text>
              <Text
                style={[
                  styles.priorityLabel,
                  {
                    color:
                      selectedPriority === priority.value ? '#FFFFFF' : colors.text,
                    ...typography.subheadline,
                  },
                ]}
              >
                {priority.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.md },
            ]}
            onPress={handleContinue}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, typography.headline]}>
              {currentTaskIndex < selectedTaskIds.length - 1 ? 'Next Task' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.textButtonText, { color: colors.secondaryText, ...typography.body }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDuration = () => {
    const taskId = selectedTaskIds[currentTaskIndex];
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const currentPlan = taskPlans.get(taskId);
    const estimatedMinutes =
      currentPlan?.estimatedMinutes ||
      (task.estimatedDuration ? task.estimatedDuration * 60 : 30);

    const durations = [15, 30, 45, 60, 90, 120, 180, 240];

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
          Estimate Time
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.secondaryText, ...typography.body },
          ]}
        >
          Task {currentTaskIndex + 1} of {selectedTaskIds.length}
        </Text>

        <View style={[styles.taskCard, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.taskCardTitle, { color: colors.text, ...typography.headline }]}>
            {task.title}
          </Text>
        </View>

        <View style={styles.durationGrid}>
          {durations.map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.durationButton,
                {
                  backgroundColor:
                    estimatedMinutes === minutes
                      ? colors.primary
                      : colors.secondaryBackground,
                  borderColor:
                    estimatedMinutes === minutes ? colors.primary : colors.separator,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={() => {
                haptics.selection();
                handleSetDuration(taskId, minutes);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${minutes} minutes`}
              accessibilityState={{ selected: estimatedMinutes === minutes }}
            >
              <Text
                style={[
                  styles.durationText,
                  {
                    color: estimatedMinutes === minutes ? '#FFFFFF' : colors.text,
                    ...typography.headline,
                  },
                ]}
              >
                {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.customInput, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.customLabel, { color: colors.secondaryText, ...typography.body }]}>
            Custom (minutes):
          </Text>
          <TextInput
            style={[styles.customTextInput, { color: colors.text, ...typography.headline }]}
            keyboardType="number-pad"
            value={String(estimatedMinutes)}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              if (num > 0 && num <= 480) {
                handleSetDuration(taskId, num);
              }
            }}
            maxLength={3}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.md },
            ]}
            onPress={handleContinue}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, typography.headline]}>
              {currentTaskIndex < selectedTaskIds.length - 1 ? 'Next Task' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.textButtonText, { color: colors.secondaryText, ...typography.body }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBreaks = () => {
    const breakOptions = [0, 5, 10, 15, 20, 30];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.emoji}>☕</Text>
        <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
          Break Time
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.secondaryText, ...typography.body },
          ]}
        >
          How long do you want to rest between tasks? Regular breaks help maintain focus and energy.
        </Text>

        <View style={styles.breakGrid}>
          {breakOptions.map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.breakButton,
                {
                  backgroundColor:
                    breakDuration === minutes
                      ? colors.primary
                      : colors.secondaryBackground,
                  borderColor:
                    breakDuration === minutes ? colors.primary : colors.separator,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={() => {
                haptics.selection();
                setBreakDuration(minutes);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={minutes === 0 ? 'No breaks' : `${minutes} minutes`}
              accessibilityState={{ selected: breakDuration === minutes }}
            >
              <Text
                style={[
                  styles.breakText,
                  {
                    color: breakDuration === minutes ? '#FFFFFF' : colors.text,
                    ...typography.headline,
                  },
                ]}
              >
                {minutes === 0 ? 'None' : `${minutes}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.md },
            ]}
            onPress={handleContinue}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, typography.headline]}>
              See My Schedule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.textButtonText, { color: colors.secondaryText, ...typography.body }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCalendar = () => {
    const timeBlocks = generateTimeBlocks();

    return (
      <View style={[styles.stepContainer, { paddingHorizontal: 0 }]}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
            Your Schedule
          </Text>
          <Text
            style={[
              styles.description,
              { color: colors.secondaryText, ...typography.body },
            ]}
          >
            Here's your time-boxed plan for today. Tasks are ordered by priority.
          </Text>
        </View>

        <View style={styles.calendarContainer}>
          <TimeBoxCalendar
            timeBlocks={timeBlocks}
            tasks={selectedTasks}
            breakDuration={breakDuration}
          />
        </View>

        <View style={[styles.buttonContainer, { paddingHorizontal: spacing.lg }]}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.md },
            ]}
            onPress={handleConfirm}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, typography.headline]}>
              Start My Day! 🚀
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[styles.textButtonText, { color: colors.secondaryText, ...typography.body }]}>
              Adjust Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const steps: Step[] = ['welcome', 'select', 'priority', 'duration', 'breaks', 'calendar'];
  const currentStepIndex = steps.indexOf(step);
  const totalSteps = steps.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.stepIndicator}>
            {steps.map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      i <= currentStepIndex ? colors.primary : colors.tertiaryBackground,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {step === 'welcome' && renderWelcome()}
        {step === 'select' && renderSelect()}
        {step === 'priority' && renderPriority()}
        {step === 'duration' && renderDuration()}
        {step === 'breaks' && renderBreaks()}
        {step === 'calendar' && renderCalendar()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
  },
  taskList: {
    flex: 1,
    marginVertical: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    marginBottom: 4,
  },
  taskMeta: {
    fontSize: 11,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  taskCardTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'center',
  },
  priorityCard: {
    width: '45%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  priorityLabel: {
    fontWeight: '600',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  durationButton: {
    width: '22%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  durationText: {
    fontWeight: '600',
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  customLabel: {
    fontWeight: '500',
  },
  customTextInput: {
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 60,
  },
  breakGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'center',
  },
  breakButton: {
    width: '30%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  breakText: {
    fontWeight: '600',
  },
  calendarContainer: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    gap: 12,
    paddingVertical: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    fontWeight: '500',
  },
});
