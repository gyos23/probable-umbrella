import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { useTheme } from '../theme/useTheme';
import { TaskPriority } from '../types';

interface QuickAddTaskProps {
  visible: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultProjectId?: string;
}

export function QuickAddTask({ visible, onClose, defaultDate, defaultProjectId }: QuickAddTaskProps) {
  const { colors, typography } = useTheme();
  const addTask = useTaskStore((state) => state.addTask);
  const projects = useTaskStore((state) => state.projects);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [projectId, setProjectId] = useState<string | undefined>(defaultProjectId);

  const handleAdd = () => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      status: 'todo',
      priority,
      projectId,
      dueDate: defaultDate,
    });

    setTitle('');
    setPriority('medium');
    setProjectId(defaultProjectId);
    onClose();
  };

  const handleCancel = () => {
    setTitle('');
    setPriority('medium');
    setProjectId(defaultProjectId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.secondaryBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text, ...typography.headline }]}>
              Quick Add Task
            </Text>
          </View>

          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.separator, ...typography.body }]}
            placeholder="Task title"
            placeholderTextColor={colors.tertiaryText}
            value={title}
            onChangeText={setTitle}
            autoFocus
            onSubmitEditing={handleAdd}
          />

          <View style={styles.optionsSection}>
            <Text style={[styles.sectionLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
              Priority
            </Text>
            <View style={styles.optionsRow}>
              {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: priority === p ? colors.primary : colors.background,
                      borderColor: colors.separator,
                    },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      {
                        color: priority === p ? '#FFFFFF' : colors.text,
                        ...typography.caption1,
                      },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {projects.length > 0 && (
            <View style={styles.optionsSection}>
              <Text style={[styles.sectionLabel, { color: colors.secondaryText, ...typography.caption1 }]}>
                Project
              </Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: !projectId ? colors.primary : colors.background,
                      borderColor: colors.separator,
                    },
                  ]}
                  onPress={() => setProjectId(undefined)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      {
                        color: !projectId ? '#FFFFFF' : colors.text,
                        ...typography.caption1,
                      },
                    ]}
                  >
                    Inbox
                  </Text>
                </TouchableOpacity>
                {projects.slice(0, 5).map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: projectId === project.id ? colors.primary : colors.background,
                        borderColor: colors.separator,
                      },
                    ]}
                    onPress={() => setProjectId(project.id)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        {
                          color: projectId === project.id ? '#FFFFFF' : colors.text,
                          ...typography.caption1,
                        },
                      ]}
                    >
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, { borderColor: colors.separator }]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text, ...typography.body }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
            >
              <Text style={[styles.addButtonText, { ...typography.body }]}>
                Add Task
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  optionsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionChipText: {
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  addButton: {},
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
