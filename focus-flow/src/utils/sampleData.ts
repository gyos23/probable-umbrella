import { Task, Project, FocusArea, TaskStatus, TaskPriority } from '../types';
import { addDays, subDays } from 'date-fns';

export const sampleFocusAreas: Omit<FocusArea, 'id' | 'createdAt' | 'updatedAt' | 'order'>[] = [
  {
    name: 'Work',
    color: '#007AFF',
    icon: '💼',
  },
  {
    name: 'Personal',
    color: '#34C759',
    icon: '🏠',
  },
  {
    name: 'Health',
    color: '#FF3B30',
    icon: '❤️',
  },
];

export const sampleProjects: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'status'>[] = [
  {
    name: 'Mobile App Redesign',
    description: 'Complete redesign of the mobile application with new features',
    color: '#007AFF',
    startDate: subDays(new Date(), 10),
    targetDate: addDays(new Date(), 20),
  },
  {
    name: 'Marketing Campaign',
    description: 'Q4 marketing campaign planning and execution',
    color: '#FF9500',
    startDate: new Date(),
    targetDate: addDays(new Date(), 30),
  },
  {
    name: 'Home Renovation',
    description: 'Kitchen and living room renovation project',
    color: '#34C759',
    startDate: addDays(new Date(), 5),
    targetDate: addDays(new Date(), 60),
  },
];

export const sampleTasks: (Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'order' | 'dependsOn' | 'blockedBy' | 'tags'> & {
  projectName?: string;
})[] = [
  // Mobile App Redesign tasks
  {
    title: 'Design new UI mockups',
    notes: 'Create mockups for all main screens following the new design system',
    status: 'completed',
    priority: 'high',
    projectName: 'Mobile App Redesign',
    startDate: subDays(new Date(), 10),
    completedDate: subDays(new Date(), 7),
    dueDate: subDays(new Date(), 7),
    plannedDate: subDays(new Date(), 9),
  },
  {
    title: 'Implement new navigation system',
    notes: 'Update navigation to use the new tab-based system',
    status: 'in-progress',
    priority: 'critical',
    projectName: 'Mobile App Redesign',
    startDate: subDays(new Date(), 5),
    dueDate: addDays(new Date(), 2),
    plannedDate: subDays(new Date(), 4),
  },
  {
    title: 'Add dark mode support',
    notes: 'Implement automatic dark mode switching',
    status: 'todo',
    priority: 'high',
    projectName: 'Mobile App Redesign',
    dueDate: addDays(new Date(), 5),
    plannedDate: addDays(new Date(), 3),
  },
  {
    title: 'Performance optimization',
    notes: 'Optimize rendering performance and reduce bundle size',
    status: 'todo',
    priority: 'medium',
    projectName: 'Mobile App Redesign',
    dueDate: addDays(new Date(), 10),
    plannedDate: addDays(new Date(), 7),
  },
  {
    title: 'User testing and feedback',
    notes: 'Conduct user testing sessions and gather feedback',
    status: 'todo',
    priority: 'high',
    projectName: 'Mobile App Redesign',
    dueDate: addDays(new Date(), 15),
    plannedDate: addDays(new Date(), 12),
  },

  // Marketing Campaign tasks
  {
    title: 'Define target audience',
    notes: 'Research and define target audience segments',
    status: 'completed',
    priority: 'critical',
    projectName: 'Marketing Campaign',
    startDate: subDays(new Date(), 3),
    completedDate: subDays(new Date(), 1),
    dueDate: subDays(new Date(), 1),
  },
  {
    title: 'Create campaign materials',
    notes: 'Design graphics, write copy, and create video content',
    status: 'in-progress',
    priority: 'high',
    projectName: 'Marketing Campaign',
    startDate: new Date(),
    dueDate: addDays(new Date(), 7),
    plannedDate: addDays(new Date(), 1),
  },
  {
    title: 'Set up ad campaigns',
    notes: 'Configure campaigns on Google Ads and Facebook',
    status: 'todo',
    priority: 'high',
    projectName: 'Marketing Campaign',
    dueDate: addDays(new Date(), 10),
  },
  {
    title: 'Launch email campaign',
    notes: 'Send out initial email campaign to subscribers',
    status: 'todo',
    priority: 'medium',
    projectName: 'Marketing Campaign',
    dueDate: addDays(new Date(), 12),
  },

  // Home Renovation tasks
  {
    title: 'Get renovation quotes',
    notes: 'Contact contractors and get quotes for the renovation work',
    status: 'in-progress',
    priority: 'high',
    projectName: 'Home Renovation',
    startDate: new Date(),
    dueDate: addDays(new Date(), 3),
  },
  {
    title: 'Choose materials and finishes',
    notes: 'Visit showrooms and select materials for kitchen and living room',
    status: 'todo',
    priority: 'medium',
    projectName: 'Home Renovation',
    dueDate: addDays(new Date(), 7),
  },
  {
    title: 'Schedule contractor',
    notes: 'Book contractor for renovation work',
    status: 'todo',
    priority: 'high',
    projectName: 'Home Renovation',
    dueDate: addDays(new Date(), 10),
  },

  // Personal tasks without project
  {
    title: 'Schedule dentist appointment',
    notes: 'Book 6-month checkup appointment',
    status: 'todo',
    priority: 'medium',
    dueDate: addDays(new Date(), 7),
  },
  {
    title: 'Buy birthday gift',
    notes: 'Get a gift for Sarah\'s birthday party next week',
    status: 'todo',
    priority: 'high',
    dueDate: addDays(new Date(), 4),
    plannedDate: addDays(new Date(), 2),
  },
  {
    title: 'Gym workout routine',
    notes: 'Complete 3 workout sessions this week',
    status: 'in-progress',
    priority: 'medium',
    startDate: subDays(new Date(), 2),
    dueDate: addDays(new Date(), 5),
  },
  {
    title: 'Read "Atomic Habits"',
    notes: 'Finish reading book by end of month',
    status: 'in-progress',
    priority: 'low',
    startDate: subDays(new Date(), 14),
    dueDate: addDays(new Date(), 16),
  },
  {
    title: 'Plan weekend trip',
    notes: 'Research and book accommodation for weekend getaway',
    status: 'todo',
    priority: 'low',
    dueDate: addDays(new Date(), 14),
  },
];
