# Очередь экранной миграции на семантическую палитру

Дата: 18 октября 2026. Ветка `fix/draft-restore`. Продолжение F-03 плана
`docs/audits/2026-10-17-FRONTEND-CLOSURE-PLAN.md`: auth/legal/consent/story
toolbar и app-shell уже на `useAppTheme()` (коммит `bfaec4cb`, splash в
`_layout` — волна 2026-10-18). Этот документ — **точный список** оставшихся
theme-dependent static reads. По плану мигрируется вместе с каждым экраном,
глобальная замена не запускается. Утверждённая black-палитра и переключатель
темы — отдельный продуктовый этап.

Метод поиска: `grep -rn "designTokens.color" apps/mobile/src` без spec-файлов;
geometry (`designTokens.auth.*Size/Radius/Width/Height`, `space`, `radius`,
`size`, `typography`) в список не входит — она остаётся статической по
плану. `figma-text-field-style.ts` проверен: только геометрия.

## Очередь по экранам (порядок — по пользовательскому приоритету)

### 1. Профиль автора / кабинет — выполнен (SHA `b5288183`, волна 2026-10-18)

Все 12 файлов пакета переведены на `useAppTheme()`: чтения
`designTokens.color` заменены на роли палитры (`muted`, `inkStrong`,
`border`, `mutedFill`, `photoGuide`, `white`, `danger`, `surfaceMuted`,
`divider`, `canvas`, `placeholder`, `tabInactive`); helper'ы получают
palette аргументом (`authorAchievementRailSpec(palette)`,
`actionStyle(palette)`); добавлен mounted-тест в `theme.spec.ts`
(seller work-card actions перекрашиваются light→black без remount).
В `seller-profile-fields.spec.ts` добавлен мок `expo-router` —
theme-provider вошёл в граф импорта, а реальный expo-router не
парсится в jsdom-окружении (pre-existing ограничение, не регрессия
волны). Проверки: tsc, eslint затронутых файлов, vitest 891/891.
Light-скриншоты не менялись (роли дублируют прежние hex).

Gate на экран: mounted-проверка видимых цветов/SVG при тестовой смене
palette без remount (паттерн `theme.spec.ts`), light-скриншоты не меняются,
адресные owner specs зелёные.

### 2. Поиск (overlay и панели) — выполнен (SHA `b5259d51`, волна 2026-10-18)

Skeleton-заливки трёх панелей (`WorksSearchPane`, `CategoriesSearchPane`,
`AuthorsSearchPane`) читают `surfaceMuted` из `useAppTheme()`; геометрия
осталась статической по плану. Мок `expo-router` добавлен в
`search-panes.spec.ts` (та же причина, что в волне 2). Проверки: tsc,
eslint, search specs 28/28.

### 3. Каталог / карточки работ — выполнен (SHA `b272e71f`, волна 2026-10-18)

`WorkIdentity` (стрелка автора, роль `textSubdued`) и
`CatalogCardSkeleton` (заливка `surfaceMuted`) на `useAppTheme()`.
Проверки: tsc, eslint, full vitest 891/891.

### 4. Admin (внутренний экран) — выполнен (SHA `4f643f45`, волна 2026-10-18)

`admin-analytics-screen` (MetricCard `border`/`surface`, GrowthBars
`border`/`ink`, RecentList `border`) и `ModerationCard` (`border`) на
`useAppTheme()`. Проверки: tsc, eslint, full vitest 891/891.

**Очередь исчерпана.** По `grep -rn "designTokens.color" apps/mobile/src`
(без spec-файлов) чтений не осталось: все видимые цвета приложения
резолвятся через `useAppTheme()` / SemanticColorMap. Остаются по плану:
geometry-токены статичны, black-палитра provisional (NEEDS-FIGMA,
пользователям не включена), геометрия экранов и live-Figma сверка —
отдельные продуктовые этапы.

## Правила миграции (из плана, без изменений)

- Единственный источник — `useAppTheme()` / SemanticColorMap; light-значения
  ролей не меняются (роль дублирует прежний hex).
- Не склеивать роли по равенству hex; нужной роли нет — добавить в
  `theme.ts` (light + provisional black, NEEDS-FIGMA).
- Чистым helper palette передаётся аргументом (паттерн
  `legal-document-content.tsx`); module-level color styles запрещены.
- Брендовые/монохромные глифы не инвертировать автоматически — только после
  решения дизайнера (прецедент: auth provider icons, Figma 521:10381).
- Не превращать уникальную геометрию в токены; централизуются повторяемые
  роли.

Проверено на `5fb3f1d9` (ветка `fix/draft-restore`): список выше — полный
по `designTokens.color` на момент составления; 23 файла-читателя, из них 12 —
пакет «профиль автора». Итоги хвостов плана (Select All/Delete, спека
media-lifecycle, search-overlay 18/18) — в `docs/product/11-PROJECT-STATUS.md`,
запись 2026-10-18.
