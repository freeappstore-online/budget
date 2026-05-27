/**
 * Get the current date as YYYY-MM-DD in local timezone.
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get YYYY-MM for a given date string.
 */
export function getYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * Get the month name and year string. e.g. "May 2026"
 */
export function formatMonthYear(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Get the short date display. e.g. "May 28"
 */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Get the last N months as YYYY-MM strings, ending with the current month.
 */
export function getLastNMonths(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${d.getFullYear()}-${m}`);
  }
  return result;
}

/**
 * Get all days in a given YYYY-MM month as YYYY-MM-DD strings.
 */
export function getDaysInMonth(yearMonth: string): string[] {
  const [year, month] = yearMonth.split("-").map(Number);
  if (year === undefined || month === undefined) return [];
  const daysCount = new Date(year, month, 0).getDate();
  const result: string[] = [];
  for (let d = 1; d <= daysCount; d++) {
    result.push(`${yearMonth}-${String(d).padStart(2, "0")}`);
  }
  return result;
}

/**
 * Get current YYYY-MM.
 */
export function currentYearMonth(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${m}`;
}

/**
 * Get the short month label. e.g. "Jan", "Feb"
 */
export function shortMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}
