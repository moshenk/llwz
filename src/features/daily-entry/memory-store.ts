import type { DailyEntry, Task } from '@/types/daily-entry';

/**
 * 第二阶段临时内存数据源（以 "YYYY-MM-DD" 为 key）。
 * 仅用于验证界面交互，App 关闭即丢失；阶段三起将替换为 SQLite。
 * 以日期为 key，保证不同日期数据相互独立。
 */
const store = new Map<string, DailyEntry>();

function getOrCreate(date: string): DailyEntry {
  let entry = store.get(date);
  if (!entry) {
    entry = { note: '', tasks: [] };
    store.set(date, entry);
  }
  return entry;
}

/** 读取某天的记录（返回副本，避免外部直接改内部状态） */
export function getDailyEntry(date: string): DailyEntry {
  const entry = getOrCreate(date);
  return { note: entry.note, tasks: [...entry.tasks] };
}

/** 保存某天的笔记文本 */
export function setNote(date: string, note: string): void {
  getOrCreate(date).note = note;
}

/** 在某天新增一条任务 */
export function addTask(date: string, content: string): Task {
  const now = Date.now();
  const task: Task = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  getOrCreate(date).tasks.push(task);
  return task;
}

/** 切换某天某条任务的完成状态 */
export function toggleTask(date: string, taskId: string): void {
  const task = getOrCreate(date).tasks.find((t) => t.id === taskId);
  if (task) {
    task.isCompleted = !task.isCompleted;
    task.updatedAt = Date.now();
  }
}
