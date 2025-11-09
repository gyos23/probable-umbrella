import { addDays, addWeeks, addMonths, addYears, setDate, setMonth, isBefore, isAfter } from 'date-fns';
import { Recurrence } from '../types';

/**
 * Calculate the next occurrence date for a recurring task
 */
export function getNextOccurrence(
  currentDate: Date,
  recurrence: Recurrence
): Date | null {
  const { type, interval, daysOfWeek, dayOfMonth, monthOfYear, endDate, endAfterOccurrences } = recurrence;

  let nextDate: Date;

  switch (type) {
    case 'daily':
      nextDate = addDays(currentDate, interval);
      break;

    case 'weekly':
      // If specific days of week are set, find the next occurrence
      if (daysOfWeek && daysOfWeek.length > 0) {
        nextDate = getNextWeeklyOccurrence(currentDate, interval, daysOfWeek);
      } else {
        nextDate = addWeeks(currentDate, interval);
      }
      break;

    case 'monthly':
      nextDate = addMonths(currentDate, interval);
      if (dayOfMonth) {
        nextDate = setDate(nextDate, Math.min(dayOfMonth, getDaysInMonth(nextDate)));
      }
      break;

    case 'yearly':
      nextDate = addYears(currentDate, interval);
      if (monthOfYear && dayOfMonth) {
        nextDate = setMonth(nextDate, monthOfYear - 1);
        nextDate = setDate(nextDate, Math.min(dayOfMonth, getDaysInMonth(nextDate)));
      }
      break;

    case 'custom':
      nextDate = addDays(currentDate, interval);
      break;

    default:
      return null;
  }

  // Check if the next date exceeds the end date
  if (endDate && isAfter(nextDate, endDate)) {
    return null;
  }

  return nextDate;
}

/**
 * Get the next weekly occurrence based on selected days of week
 */
function getNextWeeklyOccurrence(
  currentDate: Date,
  weekInterval: number,
  daysOfWeek: number[]
): Date {
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  const currentDay = currentDate.getDay();

  // Find the next day in the current week
  const nextDayInWeek = sortedDays.find((day) => day > currentDay);

  if (nextDayInWeek !== undefined) {
    // Next occurrence is in the current week
    const daysToAdd = nextDayInWeek - currentDay;
    return addDays(currentDate, daysToAdd);
  } else {
    // Move to the next week (or weeks based on interval)
    const firstDayNextCycle = sortedDays[0];
    const daysUntilNextCycle = 7 - currentDay + firstDayNextCycle;
    const weeksToAdd = weekInterval - 1; // -1 because we're already moving to next week
    return addDays(addWeeks(currentDate, weeksToAdd), daysUntilNextCycle);
  }
}

/**
 * Get the number of days in a month
 */
function getDaysInMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if a recurring task should generate the next instance
 */
export function shouldGenerateNextInstance(
  recurrence: Recurrence,
  completedCount: number
): boolean {
  // If there's an end after occurrences limit, check it
  if (recurrence.endAfterOccurrences && completedCount >= recurrence.endAfterOccurrences) {
    return false;
  }

  return true;
}

/**
 * Format recurrence for display
 */
export function formatRecurrence(recurrence: Recurrence): string {
  const { type, interval } = recurrence;

  if (type === 'daily') {
    return interval === 1 ? 'Daily' : `Every ${interval} days`;
  } else if (type === 'weekly') {
    return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
  } else if (type === 'monthly') {
    return interval === 1 ? 'Monthly' : `Every ${interval} months`;
  } else if (type === 'yearly') {
    return 'Yearly';
  } else if (type === 'custom') {
    return `Every ${interval} days`;
  }

  return 'Custom';
}
