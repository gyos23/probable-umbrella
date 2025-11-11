export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'blocked' | 'deferred';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Recurrence {
  type: RecurrenceType;
  interval: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // 0-6 (Sun-Sat) for weekly recurrence
  dayOfMonth?: number; // 1-31 for monthly recurrence
  monthOfYear?: number; // 1-12 for yearly recurrence
  endDate?: Date; // optional end date
  endAfterOccurrences?: number; // optional number of times to repeat
}

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
  isFlagged?: boolean; // Star/flag important tasks

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

  // Recurrence
  isRecurring?: boolean;
  recurrence?: Recurrence;
  parentRecurringTaskId?: string; // Links generated instances to the template
  recurringInstanceDate?: Date; // The specific date for this instance

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
  parentProjectId?: string; // For nested project hierarchy

  // SMART Framework (optional)
  smartFramework?: {
    specific: string;      // What exactly will you accomplish?
    measurable: string;    // How will you measure success?
    achievable: string;    // What resources/steps do you need?
    relevant: string;      // Why is this important?
    timeBound: string;     // When will you complete this?
  };

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

export interface TimeBlock {
  taskId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

export interface DailyPlan {
  date: string; // ISO date string
  timeBlocks: TimeBlock[];
  breakDuration: number; // in minutes
  totalWorkTime: number; // in minutes
  taskIds: string[]; // ordered list of task IDs
  createdAt: Date;
}
