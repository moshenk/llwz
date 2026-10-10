/**
 * 本地日历日期工具。
 * 业务日期统一使用 "YYYY-MM-DD"（本地时区），不使用 UTC 转换，
 * 避免特定时区下发生日期偏移。
 */

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Date -> "YYYY-MM-DD"（本地日期，而非 toISOString 的 UTC 日期） */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** "YYYY-MM-DD" -> 本地时区当天 00:00 的 Date */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** 当月天数（自动处理闰年） */
export function getDaysInMonth(year: number, month: number): number {
  // month 为 0-indexed；下个月的第 0 天即本月最后一天
  return new Date(year, month + 1, 0).getDate();
}

/** 当月第一天是星期几（0=周日 … 6=周六） */
export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** 在 (year, month) 基础上加减月份，自动处理跨年（month 0-indexed） */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** 是否为今天 */
export function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

/** "YYYY-MM-DD" -> "2026年10月12日" */
export function formatDateCN(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

/** "YYYY-MM-DD" -> "星期六" */
export function weekdayCN(dateStr: string): string {
  return `星期${WEEKDAY_LABELS[parseDate(dateStr).getDay()]}`;
}
