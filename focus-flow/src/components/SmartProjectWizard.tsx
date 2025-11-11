import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { haptics } from '../utils/haptics';

type SmartStep = 'specific' | 'measurable' | 'achievable' | 'relevant' | 'timeBound';

interface SmartData {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

interface SmartProjectWizardProps {
  projectName: string;
  projectDescription: string;
  onComplete: (smartData: SmartData) => void;
  onBack: () => void;
}

const SMART_STEPS: Array<{
  key: SmartStep;
  title: string;
  subtitle: string;
  placeholder: string;
  prompt: string;
  example: string;
}> = [
  {
    key: 'specific',
    title: 'Specific',
    subtitle: 'What exactly will you accomplish?',
    placeholder: 'E.g., Launch a mobile app with 5 core features',
    prompt: 'Be clear and detailed about what you want to achieve. Avoid vague goals.',
    example: 'Instead of "improve app", try "add user authentication, dark mode, and notifications"',
  },
  {
    key: 'measurable',
    title: 'Measurable',
    subtitle: 'How will you measure success?',
    placeholder: 'E.g., 1000 active users, 4.5+ star rating',
    prompt: 'Define concrete metrics or milestones to track progress.',
    example: 'Numbers, percentages, quantities, or completion of specific deliverables',
  },
  {
    key: 'achievable',
    title: 'Achievable',
    subtitle: 'What resources and steps do you need?',
    placeholder: 'E.g., Team of 2 developers, 3 months timeline, $5k budget',
    prompt: 'List the resources, skills, and actions required to achieve this goal.',
    example: 'Consider: time, budget, team, tools, skills, and realistic constraints',
  },
  {
    key: 'relevant',
    title: 'Relevant',
    subtitle: 'Why is this important?',
    placeholder: 'E.g., Addresses user feedback, increases engagement by 40%',
    prompt: 'Explain how this aligns with your broader objectives or values.',
    example: 'Connect to business goals, user needs, or personal growth',
  },
  {
    key: 'timeBound',
    title: 'Time-bound',
    subtitle: 'When will you complete this?',
    placeholder: 'E.g., Launch by March 31, 2025',
    prompt: 'Set a specific deadline or timeframe for completion.',
    example: 'Use specific dates, quarters, or duration (e.g., "within 3 months")',
  },
];

export const SmartProjectWizard: React.FC<SmartProjectWizardProps> = ({
  projectName,
  projectDescription,
  onComplete,
  onBack,
}) => {
  const { colors, typography } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [smartData, setSmartData] = useState<SmartData>({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  });

  const currentStepData = SMART_STEPS[currentStep];
  const isLastStep = currentStep === SMART_STEPS.length - 1;
  const canProceed = smartData[currentStepData.key].trim().length > 0;

  const handleNext = () => {
    if (!canProceed) return;

    haptics.light();
    if (isLastStep) {
      onComplete(smartData);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    haptics.light();
    if (currentStep === 0) {
      onBack();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateSmartField = (key: SmartStep, value: string) => {
    setSmartData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={handlePrevious}>
          <Text style={[styles.headerButton, { color: colors.primary, ...typography.body }]}>
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text, ...typography.headline }]}>
            SMART Goal
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText, ...typography.caption1 }]}>
            Step {currentStep + 1} of {SMART_STEPS.length}
          </Text>
        </View>
        <TouchableOpacity onPress={handleNext} disabled={!canProceed}>
          <Text
            style={[
              styles.headerButton,
              {
                color: canProceed ? colors.primary : colors.tertiaryText,
                ...typography.body,
                fontWeight: '600',
              },
            ]}
          >
            {isLastStep ? 'Done' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {SMART_STEPS.map((step, index) => (
          <View
            key={step.key}
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentStep ? colors.primary : colors.separator,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Project Context */}
        <View style={[styles.contextCard, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.contextLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
            Your Project
          </Text>
          <Text style={[styles.contextTitle, { color: colors.text, ...typography.title3 }]}>
            {projectName}
          </Text>
          {projectDescription && (
            <Text style={[styles.contextDescription, { color: colors.secondaryText, ...typography.body }]}>
              {projectDescription}
            </Text>
          )}
        </View>

        {/* SMART Step */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepBadgeText, { ...typography.headline }]}>
                {currentStepData.title[0]}
              </Text>
            </View>
            <View style={styles.stepTitleContainer}>
              <Text style={[styles.stepTitle, { color: colors.text, ...typography.title2 }]}>
                {currentStepData.title}
              </Text>
              <Text style={[styles.stepSubtitle, { color: colors.secondaryText, ...typography.body }]}>
                {currentStepData.subtitle}
              </Text>
            </View>
          </View>

          <View style={[styles.promptCard, { backgroundColor: colors.tertiaryBackground }]}>
            <Text style={[styles.promptText, { color: colors.text, ...typography.body }]}>
              💡 {currentStepData.prompt}
            </Text>
          </View>

          <View style={[styles.inputCard, { backgroundColor: colors.secondaryBackground }]}>
            <TextInput
              style={[styles.input, { color: colors.text, ...typography.body }]}
              placeholder={currentStepData.placeholder}
              placeholderTextColor={colors.tertiaryText}
              value={smartData[currentStepData.key]}
              onChangeText={(value) => updateSmartField(currentStepData.key, value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
          </View>

          <View style={[styles.exampleCard, { backgroundColor: colors.background, borderColor: colors.separator }]}>
            <Text style={[styles.exampleLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
              💭 Example
            </Text>
            <Text style={[styles.exampleText, { color: colors.secondaryText, ...typography.caption1 }]}>
              {currentStepData.example}
            </Text>
          </View>
        </View>

        {/* SMART Summary (visible after first step) */}
        {currentStep > 0 && (
          <View style={styles.summarySection}>
            <Text style={[styles.summaryTitle, { color: colors.text, ...typography.headline }]}>
              Your SMART Goal So Far
            </Text>
            {SMART_STEPS.slice(0, currentStep).map((step) => (
              <View
                key={step.key}
                style={[styles.summaryItem, { backgroundColor: colors.secondaryBackground }]}
              >
                <Text style={[styles.summaryItemTitle, { color: colors.primary, ...typography.subheadline }]}>
                  {step.title}
                </Text>
                <Text style={[styles.summaryItemText, { color: colors.text, ...typography.caption1 }]}>
                  {smartData[step.key]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
  headerButton: {
    minWidth: 60,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contextCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  contextLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  contextDescription: {
    marginTop: 4,
  },
  stepSection: {
    marginBottom: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 24,
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  stepSubtitle: {
    lineHeight: 20,
  },
  promptCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  promptText: {
    lineHeight: 20,
  },
  inputCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    minHeight: 120,
  },
  input: {
    minHeight: 88,
    fontSize: 16,
    lineHeight: 22,
  },
  exampleCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  exampleLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleText: {
    lineHeight: 18,
    fontStyle: 'italic',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryItemTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryItemText: {
    lineHeight: 18,
  },
});
