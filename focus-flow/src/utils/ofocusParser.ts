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

    // Find the contents.xml file (OmniFocus stores data here)
    const contentsFile = zip.file('contents.xml');
    if (!contentsFile) {
      throw new Error('Invalid .ofocus file: contents.xml not found');
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

    // Extract data from parsed XML
    const omnifocus = parsed.omnifocus || parsed;

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
    const ofProjects = Array.isArray(omnifocus.project)
      ? omnifocus.project
      : omnifocus.project
      ? [omnifocus.project]
      : [];

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
