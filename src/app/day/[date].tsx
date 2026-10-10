import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addTask,
  deleteTask,
  getDailyEntry,
  saveNote,
  toggleTask,
} from '@/db/repositories/daily-entry';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/types/daily-entry';
import { formatDateCN, weekdayCN } from '@/utils/date';

const NOTE_SAVE_DELAY_MS = 500;

export default function DailyDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  const [note, setNoteState] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // 用于笔记防抖保存与离开时兜底落盘
  const noteRef = useRef('');
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDailyEntry(date)
      .then((entry) => {
        if (cancelled) return;
        noteRef.current = entry.note;
        dirtyRef.current = false;
        setNoteState(entry.note);
        setTasks(entry.tasks);
        setNewTask('');
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '数据加载失败');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      // 兜底：离开或切换日期前，把尚未落盘的笔记写入数据库
      if (dirtyRef.current) {
        dirtyRef.current = false;
        const pending = noteRef.current;
        saveNote(date, pending).catch(() => {});
      }
    };
  }, [date, reloadKey]);

  const handleNoteChange = (text: string) => {
    setNoteState(text);
    noteRef.current = text;
    dirtyRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        const pending = noteRef.current;
        saveNote(date, pending).catch(() => {
          dirtyRef.current = true;
        });
      }
    }, NOTE_SAVE_DELAY_MS);
  };

  const handleAddTask = async () => {
    const content = newTask.trim();
    if (!content) return;
    try {
      const task = await addTask(date, content);
      setTasks((prev) => [...prev, task]);
      setNewTask('');
    } catch {
      // 本地写入失败的情况极少，暂不打断交互
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleTask(date, taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)),
      );
    } catch {
      // 同上
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(date, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // 同上
    }
  };

  const retry = () => setReloadKey((k) => k + 1);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.accent }]}>‹ 返回</Text>
          </Pressable>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateText, { color: theme.text }]}>{formatDateCN(date)}</Text>
            <Text style={[styles.weekdayText, { color: theme.textSecondary }]}>
              {weekdayCN(date)}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>加载中…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <Pressable
              onPress={retry}
              style={[styles.retryButton, { backgroundColor: theme.accent }]}>
              <Text style={[styles.retryText, { color: theme.accentText }]}>重试</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <Text style={[styles.sectionTitle, { color: theme.text }]}>笔记</Text>
            <TextInput
              style={[
                styles.noteInput,
                { color: theme.text, backgroundColor: theme.backgroundElement },
              ]}
              value={note}
              onChangeText={handleNoteChange}
              placeholder="记录这一天的计划或想法…"
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.sectionTitle, { color: theme.text }]}>任务</Text>
            {tasks.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                还没有任务，在下方添加一条吧
              </Text>
            ) : (
              tasks.map((task) => (
                <View
                  key={task.id}
                  style={[styles.taskRow, { backgroundColor: theme.backgroundElement }]}>
                  <Pressable style={styles.taskMain} onPress={() => handleToggleTask(task.id)}>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: theme.textSecondary },
                        task.isCompleted && {
                          backgroundColor: theme.accent,
                          borderColor: theme.accent,
                        },
                      ]}>
                      {task.isCompleted && (
                        <Text style={[styles.checkmark, { color: theme.accentText }]}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.taskText,
                        { color: task.isCompleted ? theme.textSecondary : theme.text },
                        task.isCompleted && styles.taskTextDone,
                      ]}>
                      {task.content}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteTask(task.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`删除任务：${task.content}`}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.deleteButtonPressed,
                    ]}>
                    <Text style={styles.deleteIcon}>✕</Text>
                  </Pressable>
                </View>
              ))
            )}

            <View style={styles.addRow}>
              <TextInput
                style={[
                  styles.addInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
                value={newTask}
                onChangeText={setNewTask}
                placeholder="添加任务…"
                placeholderTextColor={theme.textSecondary}
                onSubmitEditing={handleAddTask}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleAddTask}
                style={[styles.addButton, { backgroundColor: theme.accent }]}>
                <Text style={[styles.addButtonText, { color: theme.accentText }]}>添加</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { paddingVertical: 4 },
  backText: { fontSize: 16, fontWeight: '600' },
  dateBlock: { flex: 1 },
  dateText: { fontSize: 20, fontWeight: '700' },
  weekdayText: { fontSize: 14, marginTop: 2 },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  statusText: { fontSize: 15 },
  errorText: { fontSize: 15, textAlign: 'center' },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontSize: 16, fontWeight: '600' },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  noteInput: {
    minHeight: 120,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyText: { fontSize: 15, paddingVertical: 8 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
  },
  taskMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: { opacity: 0.5 },
  deleteIcon: { fontSize: 18, fontWeight: '600', color: '#E5484D' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontSize: 14, fontWeight: '700', lineHeight: 16 },
  taskText: { flex: 1, fontSize: 16, lineHeight: 22 },
  taskTextDone: { textDecorationLine: 'line-through' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: { fontSize: 16, fontWeight: '600' },
});
