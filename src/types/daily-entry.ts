/**
 * 每日记录相关的数据类型。
 * 第二阶段使用内存态；阶段三接入 SQLite 后字段与数据库表对齐。
 */

/** 一条任务 */
export type Task = {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
};

/** 某一天的每日记录（笔记 + 任务） */
export type DailyEntry = {
  note: string;
  tasks: Task[];
};
