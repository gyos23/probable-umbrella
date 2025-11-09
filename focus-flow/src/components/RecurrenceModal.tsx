import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { Recurrence, RecurrenceType } from '../types';
import { haptics } from '../utils/haptics';
import { DatePicker } from './DatePicker';

interface RecurrenceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (recurrence: Recurrence | null) => void;
  initialRecurrence?: Recurrence | null;
}

type EndType = 'never' | 'on_date' | 'after_occurrences';

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  visible,
  onClose,
  onSave,
  initialRecurrence,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [type, setType] = useState<RecurrenceType>(
    initialRecurrence?.type || 'daily'
  );
  const [interval, setInterval] = useState<string>(
    String(initialRecurrence?.interval || 1)
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialRecurrence?.daysOfWeek || []
  );
  const [dayOfMonth, setDayOfMonth] = useState<string>(
    String(initialRecurrence?.dayOfMonth || 1)
  );
  const [monthOfYear, setMonthOfYear] = useState<number>(
    initialRecurrence?.monthOfYear || 1
  );
  const [endType, setEndType] = useState<EndType>(
    initialRecurrence?.endDate
      ? 'on_date'
      : initialRecurrence?.endAfterOccurrences
      ? 'after_occurrences'
      : 'never'
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialRecurrence?.endDate
  );
  const [endAfterOccurrences, setEndAfterOccurrences] = useState<string>(
    String(initialRecurrence?.endAfterOccurrences || 10)
  );

  const handleSave = () => {
    const intervalNum = parseInt(interval) || 1;

    const recurrence: Recurrence = {
      type,
      interval: intervalNum,
      ...(type === 'weekly' && daysOfWeek.length > 0 && { daysOfWeek }),
      ...(type === 'monthly' && { dayOfMonth: parseInt(dayOfMonth) || 1 }),
      ...(type === 'yearly' && {
        dayOfMonth: parseInt(dayOfMonth) || 1,
        monthOfYear,
      }),
      ...(endType === 'on_date' && endDate && { endDate }),
      ...(endType === 'after_occurrences' && {
        endAfterOccurrences: parseInt(endAfterOccurrences) || 10,
      }),
    };

    haptics.success();
    onSave(recurrence);
    onClose();
  };

  const handleRemove = () => {
    haptics.light();
    onSave(null);
    onClose();
  };

  const toggleDayOfWeek = (day: number) => {
    haptics.selection();
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getRecurrenceSummary = () => {
    const intervalNum = parseInt(interval) || 1;
    let summary = 'Repeats ';

    if (type === 'daily') {
      summary += intervalNum === 1 ? 'daily' : `every ${intervalNum} days`;
    } else if (type === 'weekly') {
      if (intervalNum === 1) {
        summary += 'weekly';
      } else {
        summary += `every ${intervalNum} weeks`;
      }
      if (daysOfWeek.length > 0) {
        const days = daysOfWeek.map((d) => dayNames[d]).join(', ');
        summary += ` on ${days}`;
      }
    } else if (type === 'monthly') {
      const day = parseInt(dayOfMonth) || 1;
      summary +=
        intervalNum === 1
          ? `monthly on day ${day}`
          : `every ${intervalNum} months on day ${day}`;
    } else if (type === 'yearly') {
      const day = parseInt(dayOfMonth) || 1;
      summary += `yearly on ${monthNames[monthOfYear - 1]} ${day}`;
    } else if (type === 'custom') {
      summary += `every ${intervalNum} days`;
    }

    if (endType === 'on_date' && endDate) {
      summary += ` until ${endDate.toLocaleDateString()}`;
    } else if (endType === 'after_occurrences') {
      const occurrences = parseInt(endAfterOccurrences) || 10;
      summary += ` for ${occurrences} times`;
    }

    return summary;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text
              style={[
                styles.headerButton,
                { color: colors.primary, ...typography.body },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, ...typography.headline },
            ]}
          >
            Repeat
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text
              style={[
                styles.headerButton,
                {
                  color: colors.primary,
                  ...typography.body,
                  fontWeight: '600',
                },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, ...typography.headline },
              ]}
            >
              Frequency
            </Text>
            <View style={styles.typeGrid}>
              {[
                { value: 'daily', label: 'Daily', emoji: '📅' },
                { value: 'weekly', label: 'Weekly', emoji: '📆' },
                { value: 'monthly', label: 'Monthly', emoji: '🗓️' },
                { value: 'yearly', label: 'Yearly', emoji: '📅' },
                { value: 'custom', label: 'Custom', emoji: '⚙️' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor:
                        type === option.value
                          ? colors.primary
                          : colors.secondaryBackground,
                      borderColor:
                        type === option.value
                          ? colors.primary
                          : colors.separator,
                    },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setType(option.value as RecurrenceType);
                  }}
                >
                  <Text style={styles.typeEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      {
                        color:
                          type === option.value ? '#FFFFFF' : colors.text,
                        ...typography.subheadline,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, ...typography.headline },
              ]}
            >
              Interval
            </Text>
            <View
              style={[
                styles.intervalRow,
                { backgroundColor: colors.secondaryBackground },
              ]}
            >
              <Text
                style={[
                  styles.intervalLabel,
                  { color: colors.text, ...typography.body },
                ]}
              >
                Every
              </Text>
              <TextInput
                style={[
                  styles.intervalInput,
                  {
                    color: colors.text,
                    borderColor: colors.separator,
                    ...typography.headline,
                  },
                ]}
                keyboardType="number-pad"
                value={interval}
                onChangeText={setInterval}
                maxLength={3}
              />
              <Text
                style={[
                  styles.intervalLabel,
                  { color: colors.text, ...typography.body },
                ]}
              >
                {type === 'daily'
                  ? 'day(s)'
                  : type === 'weekly'
                  ? 'week(s)'
                  : type === 'monthly'
                  ? 'month(s)'
                  : type === 'yearly'
                  ? 'year(s)'
                  : 'day(s)'}
              </Text>
            </View>
          </View>

          {type === 'weekly' && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, ...typography.headline },
                ]}
              >
                Repeat on
              </Text>
              <View style={styles.daysGrid}>
                {dayNames.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: daysOfWeek.includes(index)
                          ? colors.primary
                          : colors.secondaryBackground,
                        borderColor: colors.separator,
                      },
                    ]}
                    onPress={() => toggleDayOfWeek(index)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: daysOfWeek.includes(index)
                            ? '#FFFFFF'
                            : colors.text,
                          ...typography.subheadline,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {type === 'monthly' && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, ...typography.headline },
                ]}
              >
                Day of Month
              </Text>
              <View
                style={[
                  styles.intervalRow,
                  { backgroundColor: colors.secondaryBackground },
                ]}
              >
                <Text
                  style={[
                    styles.intervalLabel,
                    { color: colors.text, ...typography.body },
                  ]}
                >
                  Day
                </Text>
                <TextInput
                  style={[
                    styles.intervalInput,
                    {
                      color: colors.text,
                      borderColor: colors.separator,
                      ...typography.headline,
                    },
                  ]}
                  keyboardType="number-pad"
                  value={dayOfMonth}
                  onChangeText={setDayOfMonth}
                  maxLength={2}
                  placeholder="1-31"
                  placeholderTextColor={colors.tertiaryText}
                />
              </View>
            </View>
          )}

          {type === 'yearly' && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, ...typography.headline },
                ]}
              >
                Date
              </Text>
              <View style={styles.yearlyRow}>
                <View
                  style={[
                    styles.monthPicker,
                    { backgroundColor: colors.secondaryBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.yearlyLabel,
                      { color: colors.secondaryText, ...typography.caption1 },
                    ]}
                  >
                    Month
                  </Text>
                  <ScrollView
                    style={styles.monthScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {monthNames.map((month, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.monthOption,
                          {
                            backgroundColor:
                              monthOfYear === index + 1
                                ? colors.primary
                                : 'transparent',
                          },
                        ]}
                        onPress={() => {
                          haptics.selection();
                          setMonthOfYear(index + 1);
                        }}
                      >
                        <Text
                          style={[
                            styles.monthText,
                            {
                              color:
                                monthOfYear === index + 1
                                  ? '#FFFFFF'
                                  : colors.text,
                              ...typography.body,
                            },
                          ]}
                        >
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View
                  style={[
                    styles.dayInput,
                    { backgroundColor: colors.secondaryBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.yearlyLabel,
                      { color: colors.secondaryText, ...typography.caption1 },
                    ]}
                  >
                    Day
                  </Text>
                  <TextInput
                    style={[
                      styles.yearlyDayInput,
                      {
                        color: colors.text,
                        borderColor: colors.separator,
                        ...typography.title1,
                      },
                    ]}
                    keyboardType="number-pad"
                    value={dayOfMonth}
                    onChangeText={setDayOfMonth}
                    maxLength={2}
                    placeholder="1-31"
                    placeholderTextColor={colors.tertiaryText}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, ...typography.headline },
              ]}
            >
              Ends
            </Text>
            <View style={styles.endOptions}>
              <TouchableOpacity
                style={[
                  styles.endOption,
                  {
                    backgroundColor:
                      endType === 'never'
                        ? colors.primary
                        : colors.secondaryBackground,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setEndType('never');
                }}
              >
                <Text
                  style={[
                    styles.endOptionText,
                    {
                      color: endType === 'never' ? '#FFFFFF' : colors.text,
                      ...typography.body,
                    },
                  ]}
                >
                  Never
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.endOption,
                  {
                    backgroundColor:
                      endType === 'on_date'
                        ? colors.primary
                        : colors.secondaryBackground,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setEndType('on_date');
                }}
              >
                <Text
                  style={[
                    styles.endOptionText,
                    {
                      color: endType === 'on_date' ? '#FFFFFF' : colors.text,
                      ...typography.body,
                    },
                  ]}
                >
                  On Date
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.endOption,
                  {
                    backgroundColor:
                      endType === 'after_occurrences'
                        ? colors.primary
                        : colors.secondaryBackground,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setEndType('after_occurrences');
                }}
              >
                <Text
                  style={[
                    styles.endOptionText,
                    {
                      color:
                        endType === 'after_occurrences'
                          ? '#FFFFFF'
                          : colors.text,
                      ...typography.body,
                    },
                  ]}
                >
                  After
                </Text>
              </TouchableOpacity>
            </View>

            {endType === 'on_date' && (
              <View style={styles.endDetail}>
                <DatePicker
                  label=""
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date"
                />
              </View>
            )}

            {endType === 'after_occurrences' && (
              <View
                style={[
                  styles.intervalRow,
                  { backgroundColor: colors.secondaryBackground },
                ]}
              >
                <TextInput
                  style={[
                    styles.intervalInput,
                    {
                      color: colors.text,
                      borderColor: colors.separator,
                      ...typography.headline,
                    },
                  ]}
                  keyboardType="number-pad"
                  value={endAfterOccurrences}
                  onChangeText={setEndAfterOccurrences}
                  maxLength={3}
                />
                <Text
                  style={[
                    styles.intervalLabel,
                    { color: colors.text, ...typography.body },
                  ]}
                >
                  occurrence(s)
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.summarySection,
              { backgroundColor: colors.tertiaryBackground },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: colors.secondaryText, ...typography.caption1 },
              ]}
            >
              Summary
            </Text>
            <Text
              style={[
                styles.summaryText,
                { color: colors.text, ...typography.body },
              ]}
            >
              {getRecurrenceSummary()}
            </Text>
          </View>

          {initialRecurrence && (
            <View style={styles.dangerSection}>
              <TouchableOpacity
                style={[
                  styles.removeButton,
                  { borderColor: colors.red },
                ]}
                onPress={handleRemove}
              >
                <Text
                  style={[
                    styles.removeButtonText,
                    { color: colors.red, ...typography.body },
                  ]}
                >
                  Remove Recurrence
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontWeight: '600',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  intervalLabel: {
    fontWeight: '500',
  },
  intervalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'center',
    minWidth: 60,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayText: {
    fontWeight: '600',
  },
  yearlyRow: {
    flexDirection: 'row',
    gap: 12,
    height: 200,
  },
  monthPicker: {
    flex: 2,
    borderRadius: 12,
    padding: 12,
  },
  yearlyLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  monthScroll: {
    flex: 1,
  },
  monthOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  monthText: {
    fontWeight: '500',
  },
  dayInput: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  yearlyDayInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  endOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  endOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  endOptionText: {
    fontWeight: '600',
  },
  endDetail: {
    marginTop: 8,
  },
  summarySection: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  summaryText: {
    lineHeight: 22,
  },
  dangerSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  removeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  removeButtonText: {
    fontWeight: '600',
  },
});
