export const DAYS_OF_WEEK = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const TURKISH_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

export const TURKISH_DAYS_FULL = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

/**
 * Standard reference date for simulation (or current real date)
 */
export const DEFAULT_SIMULATION_DATE = '2026-09-03';
export const DEFAULT_SIMULATION_WEEK_START = '2026-08-31';

/**
 * Shifts a YYYY-MM-DD date by given number of days.
 */
export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const formatDateRange = (startStr: string, _endStr?: string): string => {
  return formatWeekRange(startStr);
};

export const formatDateTR = (dateStr: string): string => {
  return formatFullTurkishDate(dateStr);
};

/**
 * Returns Monday of the week containing the given date string (YYYY-MM-DD).
 */
export function getMondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayIndex = date.getDay(); // 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  date.setDate(date.getDate() + diffToMonday);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts weeks from a Monday date string (YYYY-MM-DD).
 */
export function offsetWeekMonday(mondayStr: string, weekOffset: number): string {
  const [y, m, d] = mondayStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weekOffset * 7);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DayDateInfo {
  dayOfWeek: DayOfWeek;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  monthName: string;
  formattedShort: string; // "31 Ağustos"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

/**
 * Generates all 7 days for the week starting on mondayStr.
 */
export function getWeekDates(mondayStr: string, todayStr: string = DEFAULT_SIMULATION_DATE): DayDateInfo[] {
  const [y, m, d] = mondayStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  return DAYS_OF_WEEK.map((dayOfWeek, idx) => {
    const dObj = new Date(baseDate);
    dObj.setDate(baseDate.getDate() + idx);

    const year = dObj.getFullYear();
    const month = String(dObj.getMonth() + 1).padStart(2, '0');
    const day = String(dObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const monthName = TURKISH_MONTHS[dObj.getMonth()];
    const dayNumber = dObj.getDate();

    return {
      dayOfWeek,
      dateStr,
      dayNumber,
      monthName,
      formattedShort: `${dayNumber} ${monthName}`,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr,
    };
  });
}

/**
 * Formats a range like "31 Ağustos - 6 Eylül 2026" or "25 - 31 Ağustos 2026"
 */
export function formatWeekRange(mondayStr: string): string {
  const [y, m, d] = mondayStr.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startDay = start.getDate();
  const startMonth = TURKISH_MONTHS[start.getMonth()];
  const endDay = end.getDate();
  const endMonth = TURKISH_MONTHS[end.getMonth()];
  const endYear = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
}

/**
 * Formats full Turkish date: "3 Eylül 2026 Perşembe"
 */
export function formatFullTurkishDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = TURKISH_DAYS_FULL[date.getDay()];
  const monthName = TURKISH_MONTHS[date.getMonth()];
  return `${date.getDate()} ${monthName} ${date.getFullYear()} ${dayName}`;
}
