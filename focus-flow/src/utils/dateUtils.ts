// Native date utilities to replace date-fns

export const formatDate = (date: Date | string, formatStr: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (formatStr === 'EEE') return days[d.getDay()];
  if (formatStr === 'd') return String(d.getDate());
  if (formatStr === 'MMM d') return `${months[d.getMonth()]} ${d.getDate()}`;
  if (formatStr === 'MMM d, yyyy') return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (formatStr === 'MMMM yyyy') return `${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
  return d.toLocaleDateString();
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth();
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

export const endOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() + (6 - day);
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

export const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export const addMonths = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + amount);
  return newDate;
};

export const subMonths = (date: Date, amount: number): Date => {
  return addMonths(date, -amount);
};

export const addDays = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + amount);
  return newDate;
};

export const subDays = (date: Date, amount: number): Date => {
  return addDays(date, -amount);
};

export const differenceInDays = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((d1.getTime() - d2.getTime()) / oneDay);
};

export const min = (dates: (Date | string)[]): Date => {
  const dateTimes = dates.map(d => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.getTime();
  });
  return new Date(Math.min(...dateTimes));
};

export const max = (dates: (Date | string)[]): Date => {
  const dateTimes = dates.map(d => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.getTime();
  });
  return new Date(Math.max(...dateTimes));
};
