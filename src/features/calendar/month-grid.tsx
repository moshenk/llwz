import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { WEEKDAY_LABELS, formatDate, getDaysInMonth, getFirstDayOfWeek } from '@/utils/date';

type MonthGridProps = {
  year: number;
  month: number; // 0-indexed
  today: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
};

// 100% / 7，精确到小数点避免 7 列换行
const CELL_WIDTH_PERCENT = '14.285714285714286%';

export function MonthGrid({ year, month, today, onSelectDate }: MonthGridProps) {
  const theme = useTheme();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // 单元格：前导空位（null）+ 当月日期
  const cells: (number | null)[] = [
    ...Array<number | null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.cell}>
            <Text style={[styles.weekdayLabel, { color: theme.textSecondary }]}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }
          const date = formatDate(new Date(year, month, day));
          const isTodayCell = date === today;
          return (
            <Pressable key={date} style={styles.cell} onPress={() => onSelectDate(date)}>
              <View style={[styles.dayCircle, isTodayCell && { backgroundColor: theme.accent }]}>
                <Text
                  style={[styles.dayText, { color: isTodayCell ? theme.accentText : theme.text }]}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_WIDTH_PERCENT,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
