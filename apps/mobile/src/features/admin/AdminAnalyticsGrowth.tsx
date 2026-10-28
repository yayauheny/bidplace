import { useRef, useState, type ElementRef } from 'react';
import { Platform, View } from 'react-native';
import { Svg, Circle, Line, Polyline } from 'react-native-svg';
import type { AnalyticsFoundationResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { FigmaSelectField } from '../../components/figma/FigmaSelectField';
import { FilterSheet } from '../../components/figma/FilterSheet';
import { FilterSearchField } from '../../components/figma/FilterSearchField';
import { FilterOptionRow } from '../../components/figma/FilterOptionRow';
import { AppText } from '../../components/ui';
import { useAppTheme } from '../../providers/theme-provider';

const metrics = [
  { value: 'visitors', label: 'Браузеры' },
  { value: 'sessions', label: 'Сессии' },
  { value: 'views', label: 'Просмотры' },
  { value: 'registrations', label: 'Регистрации' },
  { value: 'firstAuthors', label: 'Авторы' },
  { value: 'firstWorks', label: 'Работы' },
] as const;
type Metric = (typeof metrics)[number]['value'];
const HEIGHT = 160;
const PAD = 12;

export function AdminAnalyticsGrowth({
  rows,
}: {
  rows: AnalyticsFoundationResponse['growth'];
}) {
  const [metric, setMetric] = useState<Metric>('visitors');
  const [width, setWidth] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [daySearch, setDaySearch] = useState('');
  const [initialDay, setInitialDay] = useState<string>();
  const dayTrigger = useRef<ElementRef<typeof FigmaSelectField>>(null);
  const palette = useAppTheme();
  const available =
    rows.length > 0 && rows.every((row) => row[metric] !== undefined);
  const max = Math.max(1, ...rows.map((row) => row[metric] ?? 0));
  const selected = rows.find((row) => row.date === selectedDate) ?? rows.at(-1);
  const label = metrics.find((item) => item.value === metric)!.label;
  const days = [...rows].reverse();
  const firstDay = days.find((row) => row.date === initialDay);
  const orderedDays = firstDay
    ? [firstDay, ...days.filter((row) => row.date !== firstDay.date)]
    : days;
  const visibleDays = orderedDays.filter((row) =>
    row.date.includes(daySearch.trim()),
  );
  const points = rows
    .map(
      (row, index) =>
        `${PAD + (rows.length === 1 ? (width - PAD * 2) / 2 : (index * (width - PAD * 2)) / (rows.length - 1))},${HEIGHT - PAD - ((row[metric] ?? 0) / max) * (HEIGHT - PAD * 2)}`,
    )
    .join(' ');
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <FigmaTabs
        tabs={metrics}
        value={metric}
        onChange={(value) => setMetric(value as Metric)}
        label="Метрика динамики"
        panelId="analytics-growth"
      />
      <View
        nativeID="analytics-growth"
        role="tabpanel"
        aria-labelledby={`analytics-growth-${metric}`}
        style={{ gap: designTokens.space.x3 }}
      >
        <AppText role="caption" tone="secondary">
          Одна метрика по дням UTC. Авторы и работы — первые публикации.
        </AppText>
        {available ? (
          <>
            <AppText role="caption" tone="secondary">
              Шкала: 0 — {max}
            </AppText>
            <View
              testID="analytics-chart"
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${label} по дням UTC, максимум ${max}. Точные значения доступны в выборе дня ниже.`}
              onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
              style={{ width: '100%', height: HEIGHT }}
            >
              {width > PAD * 2 ? (
                <Svg width={width} height={HEIGHT}>
                  <Line
                    x1={PAD}
                    y1={HEIGHT - PAD}
                    x2={width - PAD}
                    y2={HEIGHT - PAD}
                    stroke={palette.border}
                  />
                  <Circle
                    cx={
                      rows.length === 1
                        ? width / 2
                        : PAD +
                          (Math.max(
                            0,
                            rows.findIndex(
                              (row) => row.date === selected?.date,
                            ),
                          ) *
                            (width - PAD * 2)) /
                            (rows.length - 1)
                    }
                    cy={
                      HEIGHT -
                      PAD -
                      ((selected?.[metric] ?? 0) / max) * (HEIGHT - PAD * 2)
                    }
                    r={3}
                    fill={palette.ink}
                  />
                  <Polyline
                    points={points}
                    fill="none"
                    stroke={palette.ink}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : null}
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: designTokens.space.x2,
              }}
            >
              <AppText role="caption">{rows[0]!.date}</AppText>
              <AppText role="caption">{rows.at(-1)!.date}</AppText>
            </View>
            <FigmaSelectField
              ref={dayTrigger}
              label="День динамики"
              placeholder="Выбрать день"
              value={selected?.date ?? ''}
              icon="calendar-01"
              onPress={() => {
                setDaySearch('');
                setInitialDay(selected?.date);
                setDayOpen(true);
              }}
            />
            <FilterSheet
              open={dayOpen}
              onClose={() => setDayOpen(false)}
              title="День динамики"
              presentation="compact"
              returnFocusRef={dayTrigger}
            >
              <View
                style={{
                  paddingTop: designTokens.space.x2,
                  marginBottom: designTokens.space.x2,
                }}
              >
                <FilterSearchField
                  value={daySearch}
                  onChangeText={setDaySearch}
                  placeholder="Найти дату (ГГГГ-ММ-ДД)"
                />
              </View>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel="Дни выбранного периода"
              >
                {visibleDays.length ? (
                  visibleDays.map((row, index) => (
                    <FilterOptionRow
                      key={row.date}
                      nativeID={`analytics-day-${row.date}`}
                      label={row.date}
                      mode="radio"
                      selected={row.date === selected?.date}
                      tabIndex={
                        row.date === selected?.date ||
                        (!visibleDays.some((day) => day.date === selected?.date) &&
                          index === 0)
                          ? 0
                          : -1
                      }
                      onNavigate={(direction) => {
                        const nextIndex =
                          direction === 'first'
                            ? 0
                            : direction === 'last'
                              ? visibleDays.length - 1
                              : (index +
                                  (direction === 'next' ? 1 : -1) +
                                  visibleDays.length) %
                                visibleDays.length;
                        const next = visibleDays[nextIndex]!;
                        setSelectedDate(next.date);
                        if (Platform.OS === 'web') {
                          document
                            .getElementById(`analytics-day-${next.date}`)
                            ?.focus();
                        }
                      }}
                      onPress={() => {
                        setSelectedDate(row.date);
                        setDayOpen(false);
                      }}
                    />
                  ))
                ) : (
                  <AppText role="bodySmall">
                    В этом периоде нет такого дня.
                  </AppText>
                )}
              </View>
            </FilterSheet>
            <AppText role="bodySmall" accessibilityLiveRegion="polite">
              {selected?.date}: {label} — {selected?.[metric] ?? '—'}
            </AppText>
            {rows.every((row) => row[metric] === 0) ? (
              <AppText role="bodySmall" tone="secondary">
                В выбранном периоде наблюдений этой метрики нет.
              </AppText>
            ) : null}
          </>
        ) : (
          <AppText role="bodySmall">Дневные значения недоступны.</AppText>
        )}
      </View>
    </View>
  );
}
