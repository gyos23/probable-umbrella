import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { useTaskStore } from '../src/store/taskStore';
import { parseOFocusFile } from '../src/utils/ofocusParser';

export default function ImportScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{
    tasks: number;
    projects: number;
  } | null>(null);

  const handleFileSelect = async (event: any) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.ofocus')) {
        Alert.alert('Error', 'Please select a valid .ofocus file');
        return;
      }

      setImporting(true);
      setImportStats(null);

      // Parse the .ofocus file
      const { tasks, projects } = await parseOFocusFile(file);

      // Import into store
      const store = useTaskStore.getState();

      let importedTasks = 0;
      let importedProjects = 0;
      const projectNameToId = new Map<string, string>();

      // Import projects first and map names to IDs
      projects.forEach((project) => {
        store.addProject(project);
        // Get the newly created project ID
        const newProjectId = store.projects[store.projects.length - 1]?.id;
        if (newProjectId) {
          projectNameToId.set(project.name, newProjectId);
        }
        importedProjects++;
      });

      // Then import tasks with proper project ID mapping
      tasks.forEach((task) => {
        const mappedTask = { ...task };
        // Map project name to actual project ID
        if (mappedTask.projectId) {
          const actualProjectId = projectNameToId.get(mappedTask.projectId);
          mappedTask.projectId = actualProjectId;
        }
        store.addTask(mappedTask);
        importedTasks++;
      });

      setImportStats({
        tasks: importedTasks,
        projects: importedProjects,
      });

      Alert.alert(
        'Import Successful',
        `Imported ${importedTasks} tasks and ${importedProjects} projects from OmniFocus!`,
        [
          {
            text: 'View Tasks',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', `Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.headerButton, { color: colors.primary, ...typography.body }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, ...typography.headline }]}>
          Import from OmniFocus
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, ...typography.title3 }]}>
            Import Your Data
          </Text>
          <Text style={[styles.description, { color: colors.secondaryText, ...typography.body }]}>
            Upload your OmniFocus export file (.ofocus) to import your tasks and projects into Focus Flow.
          </Text>

          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumberText, { ...typography.body }]}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text, ...typography.body }]}>
                In OmniFocus, go to File → Export
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumberText, { ...typography.body }]}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text, ...typography.body }]}>
                Save the .ofocus file to your device
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={[styles.stepNumberText, { ...typography.body }]}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text, ...typography.body }]}>
                Click "Choose File" below and select your .ofocus file
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.uploadSection, { borderColor: colors.separator }]}>
          <input
            type="file"
            accept=".ofocus"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="ofocus-upload"
            disabled={importing}
          />

          <TouchableOpacity
            style={[
              styles.uploadButton,
              {
                backgroundColor: colors.primary,
                opacity: importing ? 0.6 : 1,
              },
            ]}
            onPress={() => document.getElementById('ofocus-upload')?.click()}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.uploadButtonText, { ...typography.body }]}>
                Choose .ofocus File
              </Text>
            )}
          </TouchableOpacity>

          {importing && (
            <Text style={[styles.importingText, { color: colors.secondaryText, ...typography.body }]}>
              Importing your data...
            </Text>
          )}

          {importStats && (
            <View style={[styles.statsBox, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[styles.statsTitle, { color: colors.text, ...typography.headline }]}>
                Import Complete!
              </Text>
              <Text style={[styles.statsText, { color: colors.secondaryText, ...typography.body }]}>
                ✓ {importStats.projects} projects imported
              </Text>
              <Text style={[styles.statsText, { color: colors.secondaryText, ...typography.body }]}>
                ✓ {importStats.tasks} tasks imported
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.noteSection, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.noteTitle, { color: colors.text, ...typography.headline }]}>
            📝 Note
          </Text>
          <Text style={[styles.noteText, { color: colors.secondaryText, ...typography.body }]}>
            • Your imported data will be merged with any existing tasks and projects{'\n'}
            • Duplicate items will be created as new entries{'\n'}
            • You can always delete unwanted items later
          </Text>
        </View>
      </ScrollView>
    </View>
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
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    marginBottom: 24,
    lineHeight: 22,
  },
  steps: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
  },
  uploadSection: {
    margin: 20,
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  importingText: {
    marginTop: 16,
  },
  statsBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  statsTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  statsText: {
    marginVertical: 4,
  },
  noteSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  noteTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  noteText: {
    lineHeight: 22,
  },
});
