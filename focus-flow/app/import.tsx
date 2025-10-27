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
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<{
    tasks: number;
    projects: number;
  } | null>(null);

  const handleFileSelect = async (event: any) => {
    console.log('handleFileSelect called', event);
    try {
      const file = event.target.files?.[0];
      console.log('Selected file:', file);

      if (!file) {
        console.log('No file selected');
        return;
      }

      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      if (!file.name.endsWith('.ofocus')) {
        console.log('Invalid file type');
        Alert.alert('Error', 'Please select a valid .ofocus file');
        return;
      }

      // Warn about large files
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        const proceed = await new Promise((resolve) => {
          Alert.alert(
            'Large File Detected',
            `This file is ${fileSizeMB.toFixed(1)}MB. Large imports may take several minutes. Continue?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) },
            ]
          );
        });
        if (!proceed) return;
      }

      setImporting(true);
      setImportStats(null);
      setImportProgress(10);

      // Parse the .ofocus file
      console.log('Starting OmniFocus file parse...');
      const { tasks, projects } = await parseOFocusFile(file);
      console.log(`Parsed ${projects.length} projects and ${tasks.length} tasks`);

      setImportProgress(40);

      // Import into store using bulk operations
      const store = useTaskStore.getState();
      const projectNameToId = new Map<string, string>();

      console.log('Importing projects in bulk...');
      // Bulk import all projects at once (much faster!)
      const newProjectIds = store.bulkAddProjects(projects);

      // Map project names to their new IDs
      projects.forEach((project, index) => {
        projectNameToId.set(project.name, newProjectIds[index]);
      });

      setImportProgress(60);
      console.log(`Imported ${projects.length} projects`);

      console.log('Mapping and importing tasks in bulk...');
      // Map project IDs for all tasks
      const mappedTasks = tasks.map((task) => {
        const mappedTask = { ...task };
        if (mappedTask.projectId) {
          const actualProjectId = projectNameToId.get(mappedTask.projectId);
          mappedTask.projectId = actualProjectId;
        }
        return mappedTask;
      });

      setImportProgress(80);

      // Bulk import all tasks at once
      store.bulkAddTasks(mappedTasks);

      setImportProgress(95);
      console.log(`Imported ${tasks.length} tasks`);

      // Save everything to storage once at the end
      console.log('Saving to storage...');
      await store.saveData();

      setImportProgress(100);
      setImportStats({
        tasks: tasks.length,
        projects: projects.length,
      });

      console.log('Import completed successfully');
      Alert.alert(
        'Import Successful',
        `Imported ${tasks.length} tasks and ${projects.length} projects from OmniFocus!`,
        [
          {
            text: 'View Tasks',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Import Failed',
        `Error: ${errorMessage}\n\nTry with a smaller export or contact support if the issue persists.`
      );
    } finally {
      setImporting(false);
      setImportProgress(0);
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
            onChange={(e) => {
              console.log('File input onChange triggered', e);
              handleFileSelect(e);
            }}
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
            onPress={() => {
              console.log('Upload button clicked');
              const input = document.getElementById('ofocus-upload') as HTMLInputElement;
              console.log('Input element:', input);
              if (input) {
                console.log('Triggering click on input');
                input.click();
              } else {
                console.error('Could not find file input element!');
              }
            }}
            disabled={importing}
          >
            {importing ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={[styles.progressText, { ...typography.caption1 }]}>
                  {importProgress}%
                </Text>
              </>
            ) : (
              <Text style={[styles.uploadButtonText, { ...typography.body }]}>
                Choose .ofocus File
              </Text>
            )}
          </TouchableOpacity>

          {importing && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.separator }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${importProgress}%`,
                      backgroundColor: colors.primary
                    }
                  ]}
                />
              </View>
              <Text style={[styles.importingText, { color: colors.secondaryText, ...typography.caption1 }]}>
                {importProgress < 40 ? 'Parsing file...' :
                 importProgress < 60 ? 'Importing projects...' :
                 importProgress < 80 ? 'Mapping tasks...' :
                 importProgress < 95 ? 'Importing tasks...' :
                 importProgress < 100 ? 'Saving to storage...' : 'Complete!'}
              </Text>
            </View>
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
  progressText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  importingText: {
    marginTop: 8,
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
