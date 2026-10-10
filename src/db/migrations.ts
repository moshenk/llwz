import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * 版本化迁移：用 PRAGMA user_version 记录当前 schema 版本。
 * 只能追加新迁移，不能修改已发布的迁移；重复初始化幂等，不会丢数据。
 */
const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS daily_entries (
        date TEXT PRIMARY KEY NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        content TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (date) REFERENCES daily_entries(date) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
    `,
  },
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.sql);
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
      currentVersion = migration.version;
    }
  }
}
