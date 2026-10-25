# Mobile UI components

Краткая карта общих UI-примитивов. Перед новым JSX сначала ищите готовый компонент здесь.

## Порядок выбора

1. Существующий компонент из `ui/`, `figma/` или `layout/`.
2. Варианты и props этого компонента (`variant`, `size`, `width`, `href`, …).
3. Встроенные API Expo / React Native и уже установленных библиотек.
4. Только при повторном использовании или явной общей ответственности — новый общий компонент.
5. Семантические размеры и цвета — из `@bidplace/design-tokens`; уникальная геометрия одного экрана — локальные именованные константы.
6. Не оборачивайте общий компонент в `Link` с пустым `onPress`, если кнопка уже поддерживает `href`.
7. **`href`** — только навигация; **`onPress`** — только действие на месте. Передавать оба свойства одновременно TypeScript не позволяет.

## Кнопки

| Компонент           | Путь                        | Назначение                                                                                                                          |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **FigmaButton**     | `figma/FigmaButton.tsx`     | Каноническая кнопка Figma: `solid` / `outline` / `ghost`, размеры, иконки, `loading`, навигация через **`href`** или **`onPress`**. |
| **PrimaryButton**   | `ui/Button.tsx`             | Семантическая обёртка: `variant="solid"`.                                                                                           |
| **SecondaryButton** | `ui/Button.tsx`             | `variant="outline"`.                                                                                                                |
| **TextButton**      | `ui/Button.tsx`             | `variant="ghost"`.                                                                                                                  |
| **FigmaIconButton** | `figma/FigmaIconButton.tsx` | Иконка без текста: `surface="plain"` по умолчанию, `surface="muted"` для круглых 42px кнопок из Figma.                              |
| **BackButton**      | `figma/BackButton.tsx`      | Единая круглая muted-кнопка «Назад», normal/pressed/disabled, для всех экранов.                               |
| **MotionPressable** | `ui/MotionPressable.tsx`    | Низкоуровневое нажатие с пресетами анимации; для кастомных ячеек, не для типовых CTA.                                               |

`width`: у обёрток допустимо `block` (= `full` у `FigmaButton`).

## Поля

| Компонент             | Путь                                    | Назначение                                             |
| --------------------- | --------------------------------------- | ------------------------------------------------------ |
| **FigmaTextField**    | `figma/FigmaTextField.tsx`              | Визуал поля, floating label, состояния focus/error.    |
| **TextField**         | `ui/TextField.tsx`                      | Форма: hint, `required`, обёртка над `FigmaTextField`. |
| **FigmaSelectField**  | `figma/FigmaSelectField.tsx`            | Выбор из списка с тем же визуалом поля.                |
| **AuthPasswordField** | `features/auth/auth-password-field.tsx` | Пароль в auth-потоках (метрики, показ/скрытие).        |

В формах предпочитайте **TextField**, а не прямой `FigmaTextField`, если нужны hint/required.

## Диалоги и листы

В production web общий визуальный слой обычных sheets принадлежит
`SheetBackdropProvider` в AppProviders; AppDialog/FilterSheet/ShareSheet используют
его автоматически. Не добавляйте provider или второй dimmer в экран.
Контент, callbacks закрытия и guards остаются у существующих владельцев.


| Компонент             | Путь                          | Назначение                                                                                                                                              |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **AppDialog**         | `ui/AppDialog.tsx`            | Диалоги и шторки: общий backdrop, анимация и возврат фокуса; `bare` отдаёт отступы и скролл содержимому, `bottomSpace` задаёт явный отступ с Safe Area. |
| **ExitConfirmDialog** | `ui/ExitConfirmDialog.tsx`    | Выход с несохранёнными изменениями.                                                                                                                     |
| **FilterSheet**       | `figma/FilterSheet.tsx`       | По умолчанию полноэкранный picker; `presentation="compact"` — нижний лист с прокручиваемыми вариантами и закреплённым действием.                        |
| **FilterOptionRow**   | `figma/FilterOptionRow.tsx`   | Строка-опция picker-листов (`mode="radio"                                                                                                               | "checkbox"`). |
| **FilterSearchField** | `figma/FilterSearchField.tsx` | Поисковое поле внутри picker-листов.                                                                                                                    |
| **FigmaChoiceChip**   | `figma/FigmaChoiceChip.tsx`   | Выбранные значения с удалением (направления, фильтры).                                                                                                  |

Не дублировать разметку диалога на экранах — расширять props существующих диалогов только по отдельной задаче.

## Layout

| Компонент         | Путь                       | Назначение                                                                                                                                         |
| ----------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AppShell**      | `layout/AppShell.tsx`      | Safe Area, общая навигация и bottomAction. `contentLayout="bleed"` отдаёт viewport прокрутке; `PageColumn` внутри неё использует тот же fluid-контейнер 1280/12. Нижний резерв — `useDockInset`.                                        |
| **FormPageShell** | `layout/FormPageShell.tsx` | Прокручиваемая форма с отступами и опциональным `bottomAction`.                                                                                    |
| **PaddedGrid**    | `figma/PaddedGrid.tsx`     | Построчная flex-сетка с гаттером; `gridColumnsFromWidth(width, {minCardWidth, gap, max})` — колонки из измеренной ширины, без device-брейкпоинтов. |
| **FigmaTabs**     | `figma/FigmaTabs.tsx`      | Единый таб-бар (RN-реализация на обеих платформах); `fill` — равные колонки.                                                                       |

## Карточки работ

| Компонент             | Путь                          | Назначение                                                                                                                                                                                        |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WorkCoverCard**     | `figma/WorkCoverCard.tsx`     | Обложка работы с навигацией на `/product/:id`.                                                                                                                                                    |
| **WorkCoverCardGrid** | `figma/WorkCoverCardGrid.tsx` | Сетка cover-карточек: `columns` 1 (построчно) или 2 (через `PaddedGrid`). Публичный профиль собирает `CreatorWorkCard` через `PaddedGrid` + `gridColumnsFromWidth` (другая роль: owner-действия). |

`WorkViewToggle` (`figma/WorkViewToggle.tsx`) — controlled compact/large switch,
currently connected only in Explore. `WorkCoverCard variant="compact"` reuses
caption/media with responsive3:4; `WorkCoverCardGrid` owns12px columns/28px rows.
Existing caption and overlay variants retain their defaults.

## Текст, состояния, медиа

| Компонент                      | Путь                              | Назначение                                      |
| ------------------------------ | --------------------------------- | ----------------------------------------------- |
| **AppText**                    | `ui/AppText.tsx`                  | Типографика по ролям (`role`, `tone`).          |
| **PageState** / **PageHeader** | `ui/`                             | Пустые/ошибочные состояния и заголовки страниц. |
| **ResilientRemoteImage**       | `ui/ResilientRemoteImage.tsx`     | Удалённые изображения с retry.                  |
| **ImagePlaceholder**           | `ui/ImagePlaceholder.tsx`         | Заглушка в product/layout UI.                   |
| **FigmaImagePlaceholder**      | `figma/FigmaImagePlaceholder.tsx` | Заглушка в Figma-карточках и поиске.            |

## Figma-специфичное

Папка `figma/` — визуальные блоки handoff (чипы, табы, dock, карточки авторов/работ, glass). Используйте их на публичных экранах портфолио; не копируйте те же стили в `features/`.

## Параллельные реализации (не дубликаты)

- **PrimaryButton / SecondaryButton** — тонкие обёртки над **FigmaButton**, не отдельный дизайн.
- **TextField** — добавляет подпись/hint к **FigmaTextField**.
- **ImagePlaceholder** vs **FigmaImagePlaceholder** — разные контексты (общий UI vs Figma-компоненты).

## Импорты

Публичные re-export: `components/ui/index.ts`. Figma-компоненты импортируйте по прямому пути из `components/figma/…`, если их нет в barrel.

### DateField

`ui/DateField.tsx`: one date-selection owner using FigmaSelectField + AppDialog.
Web uses React Aria; `.native` uses the Expo-compatible system picker. Its string
value preserves month/year or day/month/year; owner forms retain validation and
write guards. Do not replace date-only values with UTC timestamps.


PublicNavigationProvider scopes desktop navigation to public routes. AppShell
selects DesktopHeader from1024 CSS px on web; FloatingDock remains below it and
on native. use-app-navigation owns destinations/search/auth opener for both.
PaddedGrid supports1–4 measured columns. FigmaButton forwards its ref to the
existing MotionPressable for the same dialog focus-return owner as icon triggers.


### Ordinary page chrome (2026-10-21)

`AppShell` owns desktop/dock visibility; `PageScrollView` composes the existing
`PageColumn`, `SiteFooter` and dock clearance in one scrollport. Its branded
variant owns the responsive central mark. `SiteFooter` shares the wide-layout
policy with navigation and uses existing auth/create routes and legal IDs.
`FormPageShell` includes it for account/settings only by default. Full-screen
forms and overlays retain their existing layout. `BidplaceLogo` is the shared
contain-fitted combined SVG for header/footer.
