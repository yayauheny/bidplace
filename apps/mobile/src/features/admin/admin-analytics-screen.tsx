import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { designTokens } from '@bidplace/design-tokens';
import { FormPageShell } from '../../components/layout';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import {
  PaddedGrid,
  gridColumnsFromWidth,
} from '../../components/figma/PaddedGrid';
import {
  AppText,
  FormSection,
  PageHeader,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { useApiClient } from '../../providers/api-provider';
import { useAppTheme } from '../../providers/theme-provider';
import {
  analyticsRange,
  analyticsRate,
  type AnalyticsPeriod,
} from './admin-analytics-state';
import { AdminAnalyticsGrowth } from './AdminAnalyticsGrowth';

const periods = [
  { value: 'today', label: 'Сегодня' },
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
  { value: 'custom', label: 'Период' },
];
function MetricCard({
  label,
  value,
  definition,
}: {
  label: string;
  value: number | string;
  definition: string;
}) {
  const palette = useAppTheme();
  return (
    <View
      style={{
        gap: designTokens.space.x2,
        padding: designTokens.space.x3,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: designTokens.radius.card,
        flex: 1,
      }}
    >
      <AppText role="bodySmall" tone="secondary">
        {label}
      </AppText>
      <AppText role="numeric">
        {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
      </AppText>
      <AppText role="caption" tone="secondary">
        {definition}
      </AppText>
    </View>
  );
}

export function AdminAnalyticsScreen() {
  const api = useApiClient();
  const [gridWidth, setGridWidth] = useState(0);
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d');
  const [instant, setInstant] = useState(() => new Date());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const range = analyticsRange(period, instant, start, end);
  const query = useQuery({
    queryKey: ['admin', 'analytics', 'foundation', range],
    queryFn: ({ signal }) =>
      api.admin.getAnalyticsFoundation(range!, { signal }),
    enabled: range !== null,
  });
  const data = range ? query.data : undefined;
  const clientEnabled =
    Platform.OS === 'web' &&
    process.env.EXPO_PUBLIC_ANALYTICS_WEB_ENABLED === 'true';
  return (
    <View testID="admin-analytics-detail" style={{ flex: 1, minWidth: 0 }}>
      <FormPageShell>
        <PageHeader
          title="Аналитика"
          description="Публичное портфолио · данные UTC"
        />
        <FigmaTabs
          tabs={periods}
          value={period}
          onChange={(value) => {
            setInstant(new Date());
            setPeriod(value as AnalyticsPeriod);
          }}
          label="Период аналитики"
          panelId="analytics-period"
        />
        {period === 'custom' ? (
          <View style={{ gap: designTokens.space.x3 }}>
            <TextField
              label="Начало (ГГГГ-ММ-ДД)"
              value={start}
              onChangeText={setStart}
            />
            <TextField
              label="Конец включительно (ГГГГ-ММ-ДД)"
              value={end}
              onChangeText={setEnd}
            />
            {!range ? (
              <AppText role="bodySmall" tone="danger" accessibilityRole="alert">
                Укажите существующие даты по порядку: не более 93 дней.
              </AppText>
            ) : null}
          </View>
        ) : null}
        {range ? (
          <AppText role="caption" tone="secondary">
            {range.from.slice(0, 10)} —{' '}
            {new Date(Date.parse(range.to) - 1).toISOString().slice(0, 10)} ·
            UTC
          </AppText>
        ) : null}
        {range && !data ? (
          <InfrastructurePageStatus
            status={query.isError ? 'error' : 'loading'}
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {data ? (
          <>
            {query.isError ? (
              <AppText role="bodySmall" tone="danger">
                Обновление не удалось. Показан последний загруженный ответ.
              </AppText>
            ) : null}
            <FormSection title="Состояние данных">
              <AppText role="bodySmall">
                Серверный сбор:{' '}
                {data.serverCollectionEnabled === undefined
                  ? 'статус недоступен'
                  : data.serverCollectionEnabled
                    ? 'разрешён'
                    : 'выключен'}
                . Среда: {data.environment}.
              </AppText>
              <AppText role="bodySmall">
                Клиентский web-сборщик этой сборки:{' '}
                {clientEnabled ? 'включён' : 'выключен'}.
              </AppText>
              <AppText role="caption" tone="secondary">
                Серверное разрешение не включает клиентский сборщик.
                Административные просмотры не собираются. Сохранённые данные
                доступны и при выключенном сборе.
              </AppText>
              <AppText role="bodySmall">
                {data.coverage.firstVisitAt
                  ? `Наблюдения v2 с ${data.coverage.firstVisitAt.slice(0, 10)}.`
                  : 'Начало наблюдений неизвестно; исторических web-данных нет.'}{' '}
                История до v2 исключена.
              </AppText>
              {data.coverage.firstVisitAt &&
              Date.parse(data.from) < Date.parse(data.coverage.firstVisitAt) ? (
                <AppText role="bodySmall">
                  Покрытие периода неполное: до начала наблюдений данные
                  неизвестны.
                </AppText>
              ) : null}
            </FormSection>
            <FormSection title="За выбранный период">
              <View
                onLayout={(event) =>
                  setGridWidth(event.nativeEvent.layout.width)
                }
                style={{ gap: designTokens.space.x3 }}
              >
                <PaddedGrid
                  columns={
                    gridWidth
                      ? gridColumnsFromWidth(gridWidth, {
                          minCardWidth: 140,
                          gap: designTokens.space.x3,
                          max: 3,
                        })
                      : 2
                  }
                  gap={designTokens.space.x3}
                  keyExtractor={(item) => item.label}
                  items={[
                    {
                      label: 'Браузеры',
                      value: data.product.visitors,
                      definition: 'Уникальные анонимные браузеры, не люди',
                    },
                    {
                      label: 'Сессии',
                      value: data.product.sessions,
                      definition: 'Сессии с публичными просмотрами',
                    },
                    {
                      label: 'Просмотры',
                      value: data.product.views,
                      definition: 'Публичные страницы v2',
                    },
                    {
                      label: 'Регистрации',
                      value: data.operational.registrations,
                      definition: 'Все регистрации, независимо от атрибуции',
                    },
                    {
                      label: 'Первые авторы',
                      value: data.product.firstAuthors,
                      definition: 'Первая публикация автора',
                    },
                    {
                      label: 'Первые работы',
                      value: data.product.firstWorks,
                      definition: 'Первая публикация работы',
                    },
                  ]}
                  renderItem={(item) => <MetricCard {...item} />}
                />
              </View>
            </FormSection>
            <FormSection title="Динамика">
              <AdminAnalyticsGrowth rows={data.growth} />
            </FormSection>
            <FormSection title="Когортная конверсия за 30 дней">
              <AppText role="numeric">
                {analyticsRate(data.acquisition.rate)}
              </AppText>
              <AppText role="bodySmall">
                {data.acquisition.registrations} доказанных регистраций /{' '}
                {data.acquisition.visitors} браузеров, впервые пришедших в
                выбранный период.
              </AppText>
              <AppText role="bodySmall">
                {data.acquisition.mature
                  ? 'Окно наблюдения завершено.'
                  : 'Когорта незрелая: 30-дневное окно ещё открыто.'}
              </AppText>
              <AppText role="caption" tone="secondary">
                Регистрация может произойти после выбранного периода.
                Недоказанная связь не участвует в конверсии. При отсутствии
                когорты конверсия неизвестна.
              </AppText>
              {data.acquisition.bySource.length ? (
                data.acquisition.bySource.map((source) => (
                  <View
                    key={source.source}
                    style={{ gap: designTokens.space.x1 }}
                  >
                    <AppText role="label">
                      {source.source === 'direct'
                        ? 'Прямой переход'
                        : source.source}
                    </AppText>
                    <AppText role="bodySmall">
                      {source.visitors} браузеров · {source.registrations}{' '}
                      регистраций
                    </AppText>
                  </View>
                ))
              ) : (
                <AppText role="bodySmall">
                  Источников в выбранной когорте нет.
                </AppText>
              )}
            </FormSection>
            <FormSection title="Состояние портфолио сейчас">
              <AppText role="body">
                Опубликовано: {data.operational.currentAuthors} авторов ·{' '}
                {data.operational.currentWorks} работ.
              </AppText>
              <AppText role="bodySmall">
                {data.coverage.firstAuthorPublicationAt
                  ? `Наблюдения первой публикации авторов с ${data.coverage.firstAuthorPublicationAt.slice(0, 10)}.`
                  : 'Историческая дата первой публикации авторов неизвестна.'}{' '}
                Без исторической даты:{' '}
                {data.operational.unknownAuthorFirstPublication}.
              </AppText>
            </FormSection>
            <FormSection title="Модерация сейчас">
              <AppText role="body">
                Ожидают: {data.operational.pendingAuthors} авторов ·{' '}
                {data.operational.pendingWorks} работ.
              </AppText>
              <AppText role="bodySmall">
                Более 7 дней: {data.operational.stuckAuthors} авторов ·{' '}
                {data.operational.stuckWorks} работ.
              </AppText>
              <AppText role="bodySmall">
                Время отправки неизвестно:{' '}
                {data.operational.unknownAuthorSubmissionTime} авторов ·{' '}
                {data.operational.unknownWorkSubmissionTime} работ. Они не
                включены в показатель «более 7 дней».
              </AppText>
              <SecondaryButton label="Открыть модерацию" href="/admin" />
            </FormSection>
            <SecondaryButton
              label="Обновить данные"
              loading={query.isFetching}
              onPress={() => {
                if (period === 'custom') void query.refetch();
                else setInstant(new Date());
              }}
            />
          </>
        ) : null}
      </FormPageShell>
    </View>
  );
}
