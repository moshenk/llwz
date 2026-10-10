import * as SQLite from 'expo-sqlite';

import { migrate } from '@/db/migrations';

const DB_NAME = 'personal-calendar.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * 获取（惰性初始化并复用）数据库连接。
 * 所有读写都经过此入口，保证在首次读写前已完成建表与迁移。
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  // WAL 提升读写性能；外键约束需在每个连接上开启
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}
