import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonthGrid } from '@/features/calendar/month-grid';
import { useTheme } from '@/hooks/use-theme';
import { addMonths, formatDate } from '@/utils/date';

export default function CalendarHome() {
  const theme = useTheme();
  const router = useRouter();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const today = formatDate(new Date());

  const changeMonth = (delta: number) => {
    const next = addMonths(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const openDate = (date: string) => {
    router.push({ pathname: '/day/[date]', params: { date } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: theme.text }]}>个人日历本</Text>
          <Pressable onPress={goToToday} hitSlop={8}>
            <Text style={[styles.todayText, { color: theme.accent }]}>今天</Text>
          </Pressable>
        </View>

        <View style={styles.monthRow}>
          <Pressable onPress={() => changeMonth(-1)} hitSlop={12} style={styles.monthNavButton}>
            <Text style={[styles.monthNavArrow, { color: theme.text }]}>‹</Text>
          </Pressable>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {year}年{month + 1}月
          </Text>
          <Pressable onPress={() => changeMonth(1)} hitSlop={12} style={styles.monthNavButton}>
            <Text style={[styles.monthNavArrow, { color: theme.text }]}>›</Text>
          </Pressable>
        </View>

        <MonthGrid year={year} month={month} today={today} onSelectDate={openDate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  todayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  monthNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  monthNavArrow: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500',
  },
});
