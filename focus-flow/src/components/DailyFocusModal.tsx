import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptics } from '../utils/haptics';
import { useTheme } from '../theme/useTheme';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types';
import { formatDate } from '../utils/dateUtils';

interface DailyFocusModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'welcome' | 'goal' | 'select' | 'confirm';

export const DailyFocusModal: React.FC<DailyFocusModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [step, setStep] = useState<Step>('welcome');
  const [goalCount, setGoalCount] = useState(3);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const tasks = useTaskStore((state) => state.tasks);
  const setDailyFocus = useTaskStore((state) => state.setDailyFocus);
  const markPromptShown = useTaskStore((state) => state.markPromptShown);

  // Only show incomplete tasks
  const availableTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed' && t.status !== 'deferred');
  }, [tasks]);

  const handleClose = () => {
    // Mark as shown even if dismissed
    markPromptShown();
    setStep('welcome');
    setSelectedTaskIds([]);
    onClose();
  };

  const handleSkip = () => {
    haptics.light();
    handleClose();
  };

  const handleContinue = () => {
    haptics.light();
    if (step === 'welcome') {
      setStep('goal');
    } else if (step === 'goal') {
      setStep('select');
    } else if (step === 'select') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    haptics.light();
    if (step === 'goal') {
      setStep('welcome');
    } else if (step === 'select') {
      setStep('goal');
    } else if (step === 'confirm') {
      setStep('select');
    }
  };

  const handleTaskToggle = (taskId: string) => {
    haptics.selection();
    setSelectedTaskIds((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      } else {
        // Only allow selection up to goal count
        if (prev.length >= goalCount) {
          return prev;
        }
        return [...prev, taskId];
      }
    });
  };

  const handleConfirm = () => {
    haptics.success();
    setDailyFocus(goalCount, selectedTaskIds);
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
        Let's plan your day. Take a moment to choose what you want to accomplish today.
      </Text>

      <View style={styles.benefitsContainer}>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitEmoji}>🎯</Text>
          <Text style={[styles.benefitText, { color: colors.text, ...typography.body }]}>
            Focus on what matters most
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitEmoji}>✨</Text>
          <Text style={[styles.benefitText, { color: colors.text, ...typography.body }]}>
            Feel accomplished at end of day
          </Text>
        </View>
        <View style={styles.benefitRow}>
          <Text style={styles.benefitEmoji}>⚡</Text>
          <Text style={[styles.benefitText, { color: colors.text, ...typography.body }]}>
            Build momentum daily
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

  const renderGoal = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>🎯</Text>
      <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
        How many tasks today?
      </Text>
      <Text
        style={[
          styles.description,
          { color: colors.secondaryText, ...typography.body },
        ]}
      >
        Choose a realistic number. It's better to complete 3 tasks than leave 10 unfinished.
      </Text>

      <View style={styles.numberPicker}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.numberButton,
              {
                backgroundColor:
                  goalCount === num ? colors.primary : colors.secondaryBackground,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => {
              haptics.selection();
              setGoalCount(num);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${num} task${num > 1 ? 's' : ''}`}
            accessibilityState={{ selected: goalCount === num }}
          >
            <Text
              style={[
                styles.numberText,
                {
                  color: goalCount === num ? '#FFFFFF' : colors.text,
                  ...typography.title1,
                },
              ]}
            >
              {num}
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
          accessibilityLabel={`Continue with ${goalCount} task${goalCount > 1 ? 's' : ''}`}
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

  const renderSelect = () => (
    <View style={[styles.stepContainer, { paddingHorizontal: 0 }]}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
          Choose {goalCount} task{goalCount > 1 ? 's' : ''}
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.secondaryText, ...typography.body },
          ]}
        >
          {selectedTaskIds.length} of {goalCount} selected
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
              disabled={!selectedTaskIds.includes(task.id) && selectedTaskIds.length >= goalCount}
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

              {task.priority && (
                <View
                  style={[
                    styles.priorityDot,
                    {
                      backgroundColor:
                        task.priority === 'critical'
                          ? colors.red
                          : task.priority === 'high'
                          ? colors.orange
                          : task.priority === 'medium'
                          ? colors.yellow
                          : colors.blue,
                    },
                  ]}
                />
              )}
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
                selectedTaskIds.length === goalCount ? colors.primary : colors.quaternaryText,
              borderRadius: borderRadius.md,
            },
          ]}
          onPress={handleContinue}
          disabled={selectedTaskIds.length !== goalCount}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Continue to confirmation"
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

  const renderConfirm = () => {
    const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={[styles.title, { color: colors.text, ...typography.largeTitle }]}>
          Your focus for today
        </Text>
        <Text
          style={[
            styles.description,
            { color: colors.secondaryText, ...typography.body },
          ]}
        >
          You've chosen {goalCount} task{goalCount > 1 ? 's' : ''} to complete today. You've got
          this!
        </Text>

        <ScrollView style={styles.confirmList}>
          {selectedTasks.map((task, index) => (
            <View
              key={task.id}
              style={[
                styles.confirmItem,
                { backgroundColor: colors.secondaryBackground, borderRadius: borderRadius.sm },
              ]}
            >
              <View style={[styles.confirmNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.confirmNumberText, typography.headline]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.confirmTaskTitle, { color: colors.text, ...typography.body }]}>
                {task.title}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, borderRadius: borderRadius.md },
            ]}
            onPress={handleConfirm}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Confirm and start your day"
          >
            <Text style={[styles.primaryButtonText, typography.headline]}>
              Let's Do This! 🚀
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
            {['welcome', 'goal', 'select', 'confirm'].map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      s === step
                        ? colors.primary
                        : ['welcome', 'goal', 'select', 'confirm'].indexOf(step) > i
                        ? colors.primary
                        : colors.tertiaryBackground,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {step === 'welcome' && renderWelcome()}
        {step === 'goal' && renderGoal()}
        {step === 'select' && renderSelect()}
        {step === 'confirm' && renderConfirm()}
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
  numberPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  numberButton: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontWeight: '600',
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
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  confirmList: {
    flex: 1,
    marginVertical: 16,
  },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  confirmNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  confirmNumberText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  confirmTaskTitle: {
    flex: 1,
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
