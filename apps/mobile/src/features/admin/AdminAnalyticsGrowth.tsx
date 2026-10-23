import { useState } from 'react';
import { View } from 'react-native';
import { Svg, Circle, Line, Polyline } from 'react-native-svg';
import type { AnalyticsFoundationResponse } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
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
  const palette = useAppTheme();
  const available =
    rows.length > 0 && rows.every((row) => row[metric] !== undefined);
  const max = Math.max(1, ...rows.map((row) => row[metric] ?? 0));
  const selected = rows.find((row) => row.date === selectedDate) ?? rows.at(-1);
  const label = metrics.find((item) => item.value === metric)!.label;
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
            <FigmaTabs
              tabs={rows.map((row) => ({
                value: row.date,
                label: row.date.slice(5),
              }))}
              value={selected?.date ?? ''}
              onChange={setSelectedDate}
              label="День динамики"
              panelId="analytics-day"
            />
            <View
              nativeID="analytics-day"
              role="tabpanel"
              aria-labelledby={`analytics-day-${selected?.date ?? ''}`}
            >
              <AppText role="bodySmall" accessibilityLiveRegion="polite">
                {selected?.date}: {label} — {selected?.[metric] ?? '—'}
              </AppText>
            </View>
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
