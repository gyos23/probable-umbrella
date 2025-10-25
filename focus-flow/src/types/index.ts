export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'blocked' | 'deferred';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface FocusArea {
  id: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  focusAreaId?: string;

  // Dependencies
  dependsOn: string[]; // IDs of tasks this task depends on
  blockedBy: string[]; // IDs of tasks that block this task

  // Dates
  dueDate?: Date;
  plannedDate?: Date;
  startDate?: Date;
  completedDate?: Date;

  // Gantt chart related
  estimatedDuration?: number; // in hours
  actualDuration?: number; // in hours
  progress: number; // 0-100

  // Metadata
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  focusAreaId?: string;

  // Dates
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;

  // Status
  status: TaskStatus;
  progress: number; // 0-100, calculated from tasks

  // Metadata
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDependency {
  fromTaskId: string;
  toTaskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

export interface CalendarEvent {
  taskId: string;
  date: Date;
  type: 'due' | 'planned' | 'start';
}
