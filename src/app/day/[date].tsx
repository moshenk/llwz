import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

import { addTask, getDailyEntry, setNote, toggleTask } from '@/features/daily-entry/memory-store';
import { useTheme } from '@/hooks/use-theme';
import type { Task } from '@/types/daily-entry';
import { formatDateCN, weekdayCN } from '@/utils/date';

export default function DailyDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  const [note, setNoteState] = useState(() => getDailyEntry(date).note);
  const [tasks, setTasks] = useState<Task[]>(() => getDailyEntry(date).tasks);
  const [newTask, setNewTask] = useState('');

  // 路由参数变化时（切换到另一天）重新加载该日期的数据
  useEffect(() => {
    const entry = getDailyEntry(date);
    setNoteState(entry.note);
    setTasks(entry.tasks);
    setNewTask('');
  }, [date]);

  const handleNoteChange = (text: string) => {
    setNoteState(text);
    setNote(date, text);
  };

  const handleAddTask = () => {
    const content = newTask.trim();
    if (!content) {
      return;
    }
    const task = addTask(date, content);
    setTasks((prev) => [...prev, task]);
    setNewTask('');
  };

  const handleToggleTask = (taskId: string) => {
    toggleTask(date, taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)),
    );
  };

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

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.sectionTitle, { color: theme.text }]}>笔记</Text>
          <TextInput
            style={[styles.noteInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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
              <Pressable
                key={task.id}
                onPress={() => handleToggleTask(task.id)}
                style={[styles.taskRow, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: theme.textSecondary },
                    task.isCompleted && { backgroundColor: theme.accent, borderColor: theme.accent },
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
            ))
          )}

          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateBlock: {
    flex: 1,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
  },
  weekdayText: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  noteInput: {
    minHeight: 120,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 15,
    paddingVertical: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
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
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
