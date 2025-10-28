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

    // Check if tasks have project references (for debugging)
    if (omnifocus.task) {
      const debugTasks = Array.isArray(omnifocus.task) ? omnifocus.task : [omnifocus.task];
      if (debugTasks.length > 0) {
        console.log('First task sample:', JSON.stringify(debugTasks[0], null, 2).substring(0, 500));
      }
    }

    ofProjects.forEach((ofProject: OFProject) => {
      if (!ofProject.name) return;

      const project = {
        name: ofProject.name,
        description: ofProject.note || '',
        color: getRandomColor(),
        startDate: parseOFDate(ofProject.start),
        targetDate: parseOFDate(ofProject.due),
      };

      projects.push(project);

      // Store mapping for task assignment later
      if (ofProject.id) {
        projectMap.set(ofProject.id, ofProject.name);
      }

      // Process tasks within the project
      if (ofProject.task) {
        const projectTasks = Array.isArray(ofProject.task)
          ? ofProject.task
          : [ofProject.task];

        projectTasks.forEach((ofTask: OFTask) => {
          tasks.push(convertOFTask(ofTask, ofProject.name));
        });
      }
    });

    // Process standalone tasks (inbox items)
    const ofTasks = Array.isArray(omnifocus.task)
      ? omnifocus.task
      : omnifocus.task
      ? [omnifocus.task]
      : [];

    ofTasks.forEach((ofTask: OFTask) => {
      const projectName = ofTask.project ? projectMap.get(ofTask.project) : undefined;
      tasks.push(convertOFTask(ofTask, projectName));
    });

    // Process contexts (OmniFocus version may store tasks here)
    const ofContexts = Array.isArray(omnifocus.context)
      ? omnifocus.context
      : omnifocus.context
      ? [omnifocus.context]
      : [];

    ofContexts.forEach((context: any) => {
      if (context.task) {
        const contextTasks = Array.isArray(context.task) ? context.task : [context.task];
        contextTasks.forEach((ofTask: OFTask) => {
          tasks.push(convertOFTask(ofTask));
        });
      }
    });

    console.log(`Import complete: ${projects.length} projects, ${tasks.length} tasks`);

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
  const parseOFDate = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  };

  const mapStatus = (completed?: string): TaskStatus => {
    return completed ? 'completed' : 'todo';
  };

  const mapPriority = (flagged?: string): TaskPriority => {
    return flagged === 'true' ? 'high' : 'medium';
  };

  return {
    title: ofTask.name || 'Untitled Task',
    notes: ofTask.note || '',
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
