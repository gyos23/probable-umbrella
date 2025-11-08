import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Project, FocusArea, TaskStatus, TaskPriority } from '../types';

interface TaskStore {
  tasks: Task[];
  projects: Project[];
  focusAreas: FocusArea[];

  // Daily focus
  dailyGoal: number;
  focusedTaskIds: string[];
  lastPromptDate: Date | null;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'dependsOn' | 'blockedBy' | 'tags'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleTaskFlag: (id: string) => void;
  bulkAddTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'dependsOn' | 'blockedBy' | 'tags'>[]) => void;

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'status'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  bulkAddProjects: (projects: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'status'>[]) => string[];

  // Focus Area actions
  addFocusArea: (area: Omit<FocusArea, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateFocusArea: (id: string, updates: Partial<FocusArea>) => void;
  deleteFocusArea: (id: string) => void;

  // Dependency actions
  addDependency: (taskId: string, dependsOnId: string) => void;
  removeDependency: (taskId: string, dependsOnId: string) => void;

  // Daily focus actions
  setDailyFocus: (goal: number, taskIds: string[]) => void;
  clearDailyFocus: () => void;
  shouldShowDailyPrompt: () => boolean;
  markPromptShown: () => void;

  // Persistence
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;

  // Sample data
  populateSampleData: () => void;
}

const STORAGE_KEY = '@focus-flow-data';

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  projects: [],
  focusAreas: [],
  dailyGoal: 0,
  focusedTaskIds: [],
  lastPromptDate: null,

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      progress: 0,
      order: get().tasks.length,
      dependsOn: [],
      blockedBy: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    get().saveData();
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      ),
    }));
    get().saveData();
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
    get().saveData();
  },

  toggleTaskComplete: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === 'completed' ? 'todo' : 'completed',
              completedDate: task.status === 'completed' ? undefined : new Date(),
              progress: task.status === 'completed' ? 0 : 100,
              updatedAt: new Date(),
            }
          : task
      ),
    }));
    get().saveData();
  },

  toggleTaskFlag: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              isFlagged: !task.isFlagged,
              updatedAt: new Date(),
            }
          : task
      ),
    }));
    get().saveData();
  },

  addProject: (projectData) => {
    const newProject: Project = {
      ...projectData,
      id: generateId(),
      status: 'todo',
      progress: 0,
      order: get().projects.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ projects: [...state.projects, newProject] }));
    get().saveData();
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      ),
    }));
    get().saveData();
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      tasks: state.tasks.filter((task) => task.projectId !== id),
    }));
    get().saveData();
  },

  addFocusArea: (areaData) => {
    const newArea: FocusArea = {
      ...areaData,
      id: generateId(),
      order: get().focusAreas.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ focusAreas: [...state.focusAreas, newArea] }));
    get().saveData();
  },

  updateFocusArea: (id, updates) => {
    set((state) => ({
      focusAreas: state.focusAreas.map((area) =>
        area.id === id
          ? { ...area, ...updates, updatedAt: new Date() }
          : area
      ),
    }));
    get().saveData();
  },

  deleteFocusArea: (id) => {
    set((state) => ({
      focusAreas: state.focusAreas.filter((area) => area.id !== id),
    }));
    get().saveData();
  },

  addDependency: (taskId, dependsOnId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            dependsOn: [...task.dependsOn, dependsOnId],
            updatedAt: new Date(),
          };
        }
        if (task.id === dependsOnId) {
          return {
            ...task,
            blockedBy: [...task.blockedBy, taskId],
            updatedAt: new Date(),
          };
        }
        return task;
      }),
    }));
    get().saveData();
  },

  removeDependency: (taskId, dependsOnId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            dependsOn: task.dependsOn.filter((id) => id !== dependsOnId),
            updatedAt: new Date(),
          };
        }
        if (task.id === dependsOnId) {
          return {
            ...task,
            blockedBy: task.blockedBy.filter((id) => id !== taskId),
            updatedAt: new Date(),
          };
        }
        return task;
      }),
    }));
    get().saveData();
  },

  // Daily focus actions
  setDailyFocus: (goal, taskIds) => {
    set({
      dailyGoal: goal,
      focusedTaskIds: taskIds,
      lastPromptDate: new Date(),
    });
    get().saveData();
  },

  clearDailyFocus: () => {
    set({
      dailyGoal: 0,
      focusedTaskIds: [],
    });
    get().saveData();
  },

  shouldShowDailyPrompt: () => {
    const { lastPromptDate, tasks } = get();

    // Don't show if no tasks exist
    if (tasks.length === 0) {
      return false;
    }

    // If never shown before, show it
    if (!lastPromptDate) {
      return true;
    }

    // Check if last prompt was today
    const today = new Date();
    const lastPrompt = new Date(lastPromptDate);

    // Same day if year, month, and date all match
    const isToday =
      today.getFullYear() === lastPrompt.getFullYear() &&
      today.getMonth() === lastPrompt.getMonth() &&
      today.getDate() === lastPrompt.getDate();

    // Show prompt if last one wasn't today
    return !isToday;
  },

  markPromptShown: () => {
    set({ lastPromptDate: new Date() });
    get().saveData();
  },

  // Bulk operations for import (no save per item)
  bulkAddProjects: (projectsData) => {
    const newProjects: Project[] = projectsData.map((projectData, index) => ({
      ...projectData,
      id: generateId(),
      status: 'todo',
      progress: 0,
      order: get().projects.length + index,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    set((state) => ({ projects: [...state.projects, ...newProjects] }));
    // Return IDs for mapping
    return newProjects.map(p => p.id);
  },

  bulkAddTasks: (tasksData) => {
    const newTasks: Task[] = tasksData.map((taskData, index) => ({
      ...taskData,
      id: generateId(),
      progress: 0,
      order: get().tasks.length + index,
      dependsOn: [],
      blockedBy: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    set((state) => ({ tasks: [...state.tasks, ...newTasks] }));
  },

  loadData: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        const tasks = parsed.tasks?.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          plannedDate: task.plannedDate ? new Date(task.plannedDate) : undefined,
          startDate: task.startDate ? new Date(task.startDate) : undefined,
          completedDate: task.completedDate ? new Date(task.completedDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        })) || [];

        const projects = parsed.projects?.map((project: any) => ({
          ...project,
          startDate: project.startDate ? new Date(project.startDate) : undefined,
          targetDate: project.targetDate ? new Date(project.targetDate) : undefined,
          completedDate: project.completedDate ? new Date(project.completedDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        })) || [];

        const focusAreas = parsed.focusAreas?.map((area: any) => ({
          ...area,
          createdAt: new Date(area.createdAt),
          updatedAt: new Date(area.updatedAt),
        })) || [];

        const dailyGoal = parsed.dailyGoal || 0;
        const focusedTaskIds = parsed.focusedTaskIds || [];
        const lastPromptDate = parsed.lastPromptDate ? new Date(parsed.lastPromptDate) : null;

        set({ tasks, projects, focusAreas, dailyGoal, focusedTaskIds, lastPromptDate });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  },

  saveData: async () => {
    try {
      const { tasks, projects, focusAreas, dailyGoal, focusedTaskIds, lastPromptDate } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tasks, projects, focusAreas, dailyGoal, focusedTaskIds, lastPromptDate })
      );
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },

  populateSampleData: () => {
    const { sampleFocusAreas, sampleProjects, sampleTasks } = require('../utils/sampleData');

    // Add focus areas
    const focusAreasMap = new Map<string, string>();
    sampleFocusAreas.forEach((area: any) => {
      const id = generateId();
      focusAreasMap.set(area.name, id);
      get().addFocusArea(area);
    });

    // Add projects
    const projectsMap = new Map<string, string>();
    sampleProjects.forEach((project: any) => {
      const id = generateId();
      projectsMap.set(project.name, id);
      get().addProject(project);
    });

    // Add tasks
    sampleTasks.forEach((taskData: any) => {
      const { projectName, ...task } = taskData;
      const projectId = projectName ? projectsMap.get(projectName) : undefined;
      get().addTask({
        ...task,
        projectId,
      });
    });
  },
}));

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
