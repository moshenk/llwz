import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/db/database';
import type { DailyEntry, Task } from '@/types/daily-entry';

/** tasks 表行的数据库形态（布尔以 0/1 存储） */
type TaskRow = {
  id: string;
  content: string;
  is_completed: number;
  created_at: number;
  updated_at: number;
};

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    content: row.content,
    isCompleted: row.is_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 生成 UUID v4 风格的任务唯一 id（无需额外依赖） */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** 确保某日期存在 daily_entries 行（供任务外键引用），不覆盖已有笔记 */
async function ensureEntry(db: SQLiteDatabase, date: string): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO daily_entries (date, note, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(date) DO NOTHING',
    [date, '', now, now],
  );
}

/** 按日期读取笔记与任务（任务按创建时间稳定排序） */
export async function getDailyEntry(date: string): Promise<DailyEntry> {
  const db = await getDatabase();
  const noteRow = await db.getFirstAsync<{ note: string }>(
    'SELECT note FROM daily_entries WHERE date = ?',
    [date],
  );
  const taskRows = await db.getAllAsync<TaskRow>(
    'SELECT id, content, is_completed, created_at, updated_at FROM tasks WHERE date = ? ORDER BY created_at ASC, id ASC',
    [date],
  );
  return {
    note: noteRow?.note ?? '',
    tasks: taskRows.map(rowToTask),
  };
}

/** 保存（新增或更新）某日期的笔记 */
export async function saveNote(date: string, note: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO daily_entries (date, note, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`,
    [date, note, now, now],
  );
}

/** 新增任务（先确保父记录存在再插入，保证外键与原子性） */
export async function addTask(date: string, content: string): Promise<Task> {
  const db = await getDatabase();
  const now = Date.now();
  const id = generateId();
  await db.withTransactionAsync(async () => {
    await ensureEntry(db, date);
    await db.runAsync(
      'INSERT INTO tasks (id, date, content, is_completed, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)',
      [id, date, content, now, now],
    );
  });
  return { id, content, isCompleted: false, createdAt: now, updatedAt: now };
}

/** 切换任务完成状态（原子翻转，并限定属于该日期） */
export async function toggleTask(date: string, taskId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE tasks SET is_completed = 1 - is_completed, updated_at = ? WHERE id = ? AND date = ?',
    [Date.now(), taskId, date],
  );
}

/** 删除任务（按唯一 id 并限定属于该日期） */
export async function deleteTask(date: string, taskId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tasks WHERE id = ? AND date = ?', [taskId, date]);
}
