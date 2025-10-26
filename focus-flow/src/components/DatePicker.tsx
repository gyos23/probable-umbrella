import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { formatDate } from '../utils/dateUtils';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, label, placeholder }: DatePickerProps) {
  const { colors, typography } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(date);
    setShowPicker(false);
  };

  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 86400000) },
    { label: 'In 3 days', date: new Date(Date.now() + 3 * 86400000) },
    { label: 'Next week', date: new Date(Date.now() + 7 * 86400000) },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.secondaryText, ...typography.caption1 }]}>
        {label}
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: colors.secondaryBackground }]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.dateButtonText, { color: value ? colors.text : colors.tertiaryText, ...typography.body }]}>
            {value ? formatDate(value, 'MMM d, yyyy') : placeholder || 'Select date'}
          </Text>
          <Text style={{ fontSize: 18 }}>📅</Text>
        </TouchableOpacity>

        {value && (
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: colors.separator }]}
            onPress={() => {
              setSelectedDate(undefined);
              onChange(undefined);
            }}
          >
            <Text style={{ color: colors.red, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View
            style={[styles.pickerContainer, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text, ...typography.headline }]}>
                Select Date
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={[styles.doneButton, { color: colors.primary, ...typography.body }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickDatesContainer}>
              {quickDates.map((quick) => (
                <TouchableOpacity
                  key={quick.label}
                  style={[styles.quickDateButton, { backgroundColor: colors.secondaryBackground }]}
                  onPress={() => handleDateSelect(quick.date)}
                >
                  <Text style={[styles.quickDateText, { color: colors.text, ...typography.body }]}>
                    {quick.label}
                  </Text>
                  <Text style={[styles.quickDateSubtext, { color: colors.tertiaryText, ...typography.caption1 }]}>
                    {formatDate(quick.date, 'MMM d')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {Platform.OS === 'web' && (
              <View style={styles.webDatePicker}>
                <input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleDateSelect(new Date(e.target.value));
                    }
                  }}
                  style={{
                    padding: 12,
                    fontSize: 16,
                    borderRadius: 8,
                    border: `1px solid ${colors.separator}`,
                    backgroundColor: colors.secondaryBackground,
                    color: colors.text,
                    width: '100%',
                  }}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  dateButtonText: {
    flex: 1,
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontWeight: '600',
  },
  doneButton: {
    fontWeight: '600',
  },
  quickDatesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  quickDateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  quickDateText: {
    fontWeight: '500',
  },
  quickDateSubtext: {},
  webDatePicker: {
    marginTop: 12,
  },
});
