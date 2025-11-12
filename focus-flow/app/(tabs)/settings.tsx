import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettingsStore, ViewDensity } from '../../src/store/settingsStore';
import { useTaskStore } from '../../src/store/taskStore';
import { useTheme } from '../../src/theme/useTheme';
import { haptics } from '../../src/utils/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const {
    viewDensity,
    setViewDensity,
    showCompletedTasks,
    setShowCompletedTasks,
    groupTasksByProject,
    setGroupTasksByProject,
    listViewShowAllTasks,
    setListViewShowAllTasks,
  } = useSettingsStore();
  const {
    archiveCompletedTasks,
    wipeAllData,
    tasks,
    archivedTasks,
  } = useTaskStore();

  const handleDensityChange = (density: ViewDensity) => {
    haptics.light();
    setViewDensity(density);
  };

  const handleToggle = (value: boolean, setter: (value: boolean) => void) => {
    haptics.light();
    setter(value);
  };

  const handleArchiveCompleted = () => {
    haptics.light();
    const completedCount = tasks.filter((t) => t.status === 'completed').length;

    if (completedCount === 0) {
      if (Platform.OS === 'web') {
        alert('No completed tasks to archive');
      } else {
        Alert.alert('Archive Completed', 'No completed tasks to archive');
      }
      return;
    }

    if (Platform.OS === 'web') {
      if (confirm(`Archive ${completedCount} completed task${completedCount === 1 ? '' : 's'}?`)) {
        const archived = archiveCompletedTasks();
        alert(`${archived} task${archived === 1 ? '' : 's'} archived successfully`);
      }
    } else {
      Alert.alert(
        'Archive Completed Tasks',
        `Archive ${completedCount} completed task${completedCount === 1 ? '' : 's'}? They will be moved to the archive for review.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            onPress: () => {
              const archived = archiveCompletedTasks();
              Alert.alert('Success', `${archived} task${archived === 1 ? '' : 's'} archived successfully`);
            },
          },
        ]
      );
    }
  };

  const handleWipeData = () => {
    haptics.light();

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to wipe all data? This cannot be undone!')) {
        wipeAllData();
        alert('All data has been wiped');
      }
    } else {
      Alert.alert(
        'Wipe All Data',
        'Are you sure you want to delete everything? This action cannot be undone!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Wipe Everything',
            style: 'destructive',
            onPress: () => {
              wipeAllData();
              Alert.alert('Success', 'All data has been wiped');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Text style={[styles.headerTitle, { color: colors.text, ...typography.largeTitle }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* View Density Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            View Density
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
            Adjust how much information is displayed in your task list
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            {(['compact', 'comfortable', 'cozy'] as ViewDensity[]).map((density, index, arr) => (
              <TouchableOpacity
                key={density}
                style={[
                  styles.optionRow,
                  {
                    borderBottomWidth: index < arr.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.separator,
                  },
                ]}
                onPress={() => handleDensityChange(density)}
                accessibilityRole="radio"
                accessibilityState={{ checked: viewDensity === density }}
                accessibilityLabel={`${density.charAt(0).toUpperCase() + density.slice(1)} density`}
              >
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionTitle, { color: colors.text, ...typography.body }]}>
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                    {density === 'compact' && 'See more tasks, less detail'}
                    {density === 'comfortable' && 'Balanced view (recommended)'}
                    {density === 'cozy' && 'Spacious with full details'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: viewDensity === density ? colors.primary : colors.separator,
                      backgroundColor: viewDensity === density ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {viewDensity === density && (
                    <View style={[styles.radioInner, { backgroundColor: '#FFFFFF' }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Display Options Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            Display Options
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            <View style={[styles.optionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text, ...typography.body }]}>
                  Show Completed Tasks
                </Text>
                <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Display completed tasks in the main list
                </Text>
              </View>
              <Switch
                value={showCompletedTasks}
                onValueChange={(value) => handleToggle(value, setShowCompletedTasks)}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Show completed tasks toggle"
                accessibilityRole="switch"
              />
            </View>

            <View style={[styles.optionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text, ...typography.body }]}>
                  Group Tasks by Project
                </Text>
                <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Organize tasks by their projects
                </Text>
              </View>
              <Switch
                value={groupTasksByProject}
                onValueChange={(value) => handleToggle(value, setGroupTasksByProject)}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Group tasks by project toggle"
                accessibilityRole="switch"
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text, ...typography.body }]}>
                  Show All Tasks in Gantt
                </Text>
                <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Display tasks without dates in gantt view
                </Text>
              </View>
              <Switch
                value={listViewShowAllTasks}
                onValueChange={(value) => handleToggle(value, setListViewShowAllTasks)}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Show all tasks in gantt toggle"
                accessibilityRole="switch"
              />
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            Data Management
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            <TouchableOpacity
              style={[styles.optionRow, { borderBottomWidth: 0.5, borderBottomColor: colors.separator }]}
              onPress={handleArchiveCompleted}
              accessibilityRole="button"
              accessibilityLabel="Archive completed tasks"
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.text, ...typography.body }]}>
                  Archive Completed Tasks
                </Text>
                <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Move all completed tasks to archive ({tasks.filter((t) => t.status === 'completed').length} completed, {archivedTasks.length} archived)
                </Text>
              </View>
              <Text style={[styles.actionIcon, { color: colors.primary }]}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleWipeData}
              accessibilityRole="button"
              accessibilityLabel="Wipe all data"
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.red, ...typography.body }]}>
                  Wipe All Data
                </Text>
                <Text style={[styles.optionDescription, { color: colors.secondaryText, ...typography.caption1 }]}>
                  Delete all tasks, projects, and settings
                </Text>
              </View>
              <Text style={[styles.actionIcon, { color: colors.red }]}>⚠</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            Preview
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, padding: 16 }]}>
            <Text style={[styles.previewText, { color: colors.secondaryText, ...typography.caption1 }]}>
              Current density: <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {viewDensity.charAt(0).toUpperCase() + viewDensity.slice(1)}
              </Text>
            </Text>
            <Text style={[styles.previewText, { color: colors.secondaryText, ...typography.caption1, marginTop: 8 }]}>
              {viewDensity === 'compact' && 'Compact mode hides some metadata to fit more tasks on screen'}
              {viewDensity === 'comfortable' && 'Comfortable mode shows all important task details'}
              {viewDensity === 'cozy' && 'Cozy mode provides extra spacing for easier reading'}
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            About
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.separator, padding: 16 }]}>
            <Text style={[styles.aboutText, { color: colors.text, ...typography.body }]}>
              Focus Flow
            </Text>
            <Text style={[styles.aboutText, { color: colors.secondaryText, ...typography.caption1, marginTop: 4 }]}>
              Version 1.0.0
            </Text>
            <Text style={[styles.aboutText, { color: colors.secondaryText, ...typography.caption1, marginTop: 12 }]}>
              Designed for Apple Design Award excellence
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 34,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    lineHeight: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewText: {
    lineHeight: 18,
  },
  aboutText: {
    lineHeight: 20,
  },
  actionIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
});
