import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { Task, Project, TaskStatus, TaskPriority } from '../types';

interface OFTask {
  id: string;
  name: string;
  note?: string;
  added?: string;
  modified?: string;
  completed?: string;
  due?: string;
  start?: string;
  flagged?: string;
  context?: string;
  project?: string;
  rank?: string;
  task?: OFTask[];
}

interface OFProject {
  id: string;
  name: string;
  note?: string;
  added?: string;
  modified?: string;
  completed?: string;
  due?: string;
  start?: string;
  status?: string;
  folder?: string;
  task?: OFTask[];
}

// Helper to extract text from fields that might be objects with #text property
function extractText(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value['#text']) return value['#text'];
  return undefined;
}

export async function parseOFocusFile(file: File): Promise<{
  tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'dependsOn' | 'blockedBy' | 'tags'>[];
  projects: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'status'>[];
}> {
  try {
    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Unzip the .ofocus file
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Debug: List all files in the zip
    console.log('Files in zip archive:');
    const fileList: string[] = [];
    zip.forEach((relativePath, file) => {
      console.log(`  - ${relativePath} (dir: ${file.dir})`);
      fileList.push(relativePath);
    });

    // Find the contents.xml file (OmniFocus stores data here)
    // Try different possible locations
    let contentsFile = zip.file('contents.xml');

    // If not found at root, search in subdirectories
    if (!contentsFile) {
      const contentsPath = fileList.find(path => path.endsWith('contents.xml'));
      if (contentsPath) {
        console.log(`Found contents.xml at: ${contentsPath}`);
        contentsFile = zip.file(contentsPath);
      }
    }

    // Also check for OmniFocus.ofocus/contents.xml pattern
    if (!contentsFile) {
      contentsFile = zip.file('OmniFocus.ofocus/contents.xml');
    }

    // If still not found, check if there's an .ofocus file inside this zip
    // (double-nested: .zip containing .ofocus)
    if (!contentsFile) {
      const ofocusFile = fileList.find(path => path.endsWith('.ofocus') && !path.includes('/'));
      if (ofocusFile) {
        console.log(`Found nested .ofocus file: ${ofocusFile}, extracting...`);
        const nestedZipFile = zip.file(ofocusFile);
        if (nestedZipFile) {
          const nestedArrayBuffer = await nestedZipFile.async('arraybuffer');
          const nestedZip = await JSZip.loadAsync(nestedArrayBuffer);

          // List files in nested zip
          console.log('Files in nested .ofocus archive:');
          nestedZip.forEach((relativePath, file) => {
            console.log(`  - ${relativePath} (dir: ${file.dir})`);
          });

          // Try to find contents.xml in the nested zip
          contentsFile = nestedZip.file('contents.xml');
          if (!contentsFile) {
            const nestedContentsPath = Object.keys(nestedZip.files).find(path => path.endsWith('contents.xml'));
            if (nestedContentsPath) {
              contentsFile = nestedZip.file(nestedContentsPath);
            }
          }
        }
      }
    }

    // Check if this is OmniFocus 4 format (has data/*.zip files)
    if (!contentsFile) {
      const dataZipFiles = fileList.filter(path => path.includes('/data/') && path.endsWith('.zip'));
      const mainZipFile = fileList.find(path => path.includes('=') && path.endsWith('.zip') && !path.includes('/data/'));

      if (dataZipFiles.length > 0 || mainZipFile) {
        console.log('Detected OmniFocus 4 format with data files');
        console.log(`Found ${dataZipFiles.length} data files and ${mainZipFile ? '1 main file' : 'no main file'}`);

        // Try the main file first (e.g., 00000000000000=cn41lR1lc06+enVmjbsHUN7.zip)
        if (mainZipFile) {
          console.log(`Extracting main file: ${mainZipFile}`);
          const mainFile = zip.file(mainZipFile);
          if (mainFile) {
            try {
              const mainArrayBuffer = await mainFile.async('arraybuffer');
              const mainZip = await JSZip.loadAsync(mainArrayBuffer);

              console.log('Files in main data archive:');
              mainZip.forEach((relativePath, file) => {
                console.log(`  - ${relativePath}`);
              });

              // Look for XML or plist files
              const xmlFile = Object.keys(mainZip.files).find(path => path.endsWith('.xml') || path.endsWith('.plist'));
              if (xmlFile) {
                console.log(`Found data file: ${xmlFile}`);
                contentsFile = mainZip.file(xmlFile);
              }
            } catch (err) {
              console.log(`Failed to extract main file: ${err.message}`);
            }
          }
        }

        // If still not found, try the first data file
        if (!contentsFile && dataZipFiles.length > 0) {
          console.log(`Trying first data file: ${dataZipFiles[0]}`);
          const dataFile = zip.file(dataZipFiles[0]);
          if (dataFile) {
            try {
              const dataArrayBuffer = await dataFile.async('arraybuffer');
              const dataZip = await JSZip.loadAsync(dataArrayBuffer);

              console.log('Files in data archive:');
              dataZip.forEach((relativePath, file) => {
                console.log(`  - ${relativePath}`);
              });

              // Look for XML or plist files
              const xmlFile = Object.keys(dataZip.files).find(path => path.endsWith('.xml') || path.endsWith('.plist'));
              if (xmlFile) {
                console.log(`Found data file: ${xmlFile}`);
                contentsFile = dataZip.file(xmlFile);
              }
            } catch (err) {
              console.log(`Failed to extract data file: ${err.message}`);
            }
          }
        }
      }
    }

    if (!contentsFile) {
      throw new Error(`Invalid .ofocus file: contents.xml not found. Available files: ${fileList.join(', ')}`);
    }

    // Read the XML content
    const xmlContent = await contentsFile.async('text');

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
    });

    const parsed = parser.parse(xmlContent);

    // Debug: Log parsed structure
    console.log('Parsed XML structure:', JSON.stringify(parsed, null, 2).substring(0, 2000));
    console.log('Top-level keys:', Object.keys(parsed));

    // Extract data from parsed XML
    const omnifocus = parsed.omnifocus || parsed;
    const ofKeys = Object.keys(omnifocus);
    console.log('OmniFocus object keys:', ofKeys);
    console.log('OmniFocus keys detail:', ofKeys.map(k => `${k}: ${Array.isArray(omnifocus[k]) ? `Array(${omnifocus[k].length})` : typeof omnifocus[k]}`).join(', '));

    const tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'dependsOn' | 'blockedBy' | 'tags'>[] = [];
    const projects: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'status'>[] = [];
    const projectMap = new Map<string, string>(); // OmniFocus ID -> our project ID

    // Helper to parse OmniFocus date format
    const parseOFDate = (dateStr?: string): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        return new Date(dateStr);
      } catch {
        return undefined;
      }
    };

    // Helper to map OmniFocus status to our status
    const mapStatus = (completed?: string, dropped?: string): TaskStatus => {
      if (completed) return 'completed';
      if (dropped === 'true') return 'deferred';
      return 'todo';
    };

    // Helper to determine priority from flagged status
    const mapPriority = (flagged?: string): TaskPriority => {
      return flagged === 'true' ? 'high' : 'medium';
    };

    // Process projects
    // In OmniFocus 4, check both 'project' and 'folder' fields
    const ofProjects = Array.isArray(omnifocus.project)
      ? omnifocus.project
      : omnifocus.project
      ? [omnifocus.project]
      : [];

    // Also check folders (which might contain projects)
    const ofFolders = Array.isArray(omnifocus.folder)
      ? omnifocus.folder
      : omnifocus.folder
      ? [omnifocus.folder]
      : [];

    console.log(`Found ${ofProjects.length} projects in XML`);
    console.log(`Found ${ofFolders.length} folders in XML`);

    if (ofProjects.length > 0) {
      console.log('First project sample:', JSON.stringify(ofProjects[0], null, 2).substring(0, 500));
    }
    if (ofFolders.length > 0) {
      console.log('First folder sample:', JSON.stringify(ofFolders[0], null, 2).substring(0, 500));
    }

    // Process projects and tasks
    // In OmniFocus 4, projects and tasks are unified - tasks with a 'project' field are projects
    const allTasks = Array.isArray(omnifocus.task)
      ? omnifocus.task
      : omnifocus.task
      ? [omnifocus.task]
      : [];

    console.log(`Processing ${allTasks.length} total items (projects + tasks)`);

    // First pass: identify and create projects, and extract their child tasks
    allTasks.forEach((item: any) => {
      // If item has a 'project' field, it's a project
      if (item.project && typeof item.project === 'object') {
        const projectName = extractText(item.name) || 'Untitled Project';
        const project = {
          name: projectName,
          description: extractText(item.note) || '',
          color: getRandomColor(),
          startDate: parseOFDate(item.start),
          targetDate: parseOFDate(item.due),
        };

        projects.push(project);

        // Store mapping for task assignment later
        if (item['@_id']) {
          projectMap.set(item['@_id'], projectName);
        }

        // Debug: Check what the task field looks like
        console.log(`Project "${projectName}" task field:`, typeof item.task, item.task ? (Array.isArray(item.task) ? `Array(${item.task.length})` : JSON.stringify(item.task).substring(0, 100)) : 'undefined');

        // Process child tasks within this project
        if (item.task && item.task !== '') {
          const projectTasks = Array.isArray(item.task) ? item.task : [item.task];
          console.log(`  Processing ${projectTasks.length} child tasks for project "${projectName}"`);
          projectTasks.forEach((childTask: any) => {
            // Recursively process child tasks (they might have their own children)
            const processTask = (task: any, parentProjectName: string) => {
              tasks.push(convertOFTask(task, parentProjectName));

              // If this task has children, process them too
              if (task.task && task.task !== '') {
                const childTasks = Array.isArray(task.task) ? task.task : [task.task];
                childTasks.forEach((child: any) => processTask(child, parentProjectName));
              }
            };

            processTask(childTask, projectName);
          });
        }
      }
    });

    const tasksInProjects = tasks.length;
    console.log(`Identified ${projects.length} projects with ${tasksInProjects} tasks`);

    // Second pass: process regular tasks (inbox items, orphaned tasks)
    let debuggedTask = false;
    allTasks.forEach((item: any) => {
      // Skip items that are projects
      if (item.project && typeof item.project === 'object') {
        return;
      }

      // Debug first non-project task to see its structure
      if (!debuggedTask) {
        console.log('Sample non-project task fields:', Object.keys(item).join(', '));
        console.log('Sample task detail:', JSON.stringify(item, null, 2).substring(0, 800));
        debuggedTask = true;
      }

      // This is a regular task (inbox item or standalone task)
      const task = convertOFTask(item);
      tasks.push(task);
    });

    const inboxTasks = tasks.length - tasksInProjects;
    console.log(`Processed ${inboxTasks} inbox/standalone tasks`);

    // Also process tasks from folders if any
    const tasksBeforeFolders = tasks.length;
    ofFolders.forEach((folder: any) => {
      if (folder.task) {
        const folderTasks = Array.isArray(folder.task) ? folder.task : [folder.task];
        folderTasks.forEach((ofTask: OFTask) => {
          tasks.push(convertOFTask(ofTask));
        });
      }
    });

    const folderTasks = tasks.length - tasksBeforeFolders;
    if (folderTasks > 0) {
      console.log(`Processed ${folderTasks} tasks from folders`);
    }

    console.log(`Import complete: ${projects.length} projects, ${tasks.length} total tasks (${tasksInProjects} in projects, ${inboxTasks} inbox items, ${folderTasks} from folders)`);

    return { tasks, projects };
  } catch (error) {
    console.error('Error parsing .ofocus file:', error);
    throw new Error(`Failed to parse .ofocus file: ${error.message}`);
  }
}

function convertOFTask(
  ofTask: OFTask,
  projectName?: string
): Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'dependsOn' | 'blockedBy' | 'tags'> {
  const parseOFDate = (dateValue?: any): Date | undefined => {
    const dateStr = extractText(dateValue);
    if (!dateStr) return undefined;
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  };

  const mapStatus = (completed?: any): TaskStatus => {
    return completed ? 'completed' : 'todo';
  };

  const mapPriority = (flagged?: any): TaskPriority => {
    const flaggedStr = extractText(flagged);
    return flaggedStr === 'true' ? 'high' : 'medium';
  };

  return {
    title: extractText(ofTask.name) || 'Untitled Task',
    notes: extractText(ofTask.note) || '',
    status: mapStatus(ofTask.completed),
    priority: mapPriority(ofTask.flagged),
    projectId: projectName, // Will be matched to actual project ID during import
    dueDate: parseOFDate(ofTask.due),
    plannedDate: parseOFDate(ofTask.start),
    startDate: parseOFDate(ofTask.start),
    completedDate: parseOFDate(ofTask.completed),
  };
}

// Generate random color for imported projects
function getRandomColor(): string {
  const colors = [
    '#FF3B30',
    '#FF9500',
    '#FFCC00',
    '#34C759',
    '#5AC8FA',
    '#007AFF',
    '#5856D6',
    '#AF52DE',
    '#FF2D55',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
