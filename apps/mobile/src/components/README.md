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

| Компонент | Путь | Назначение |
| --- | --- | --- |
| **FigmaButton** | `figma/FigmaButton.tsx` | Каноническая кнопка Figma: `solid` / `outline` / `ghost`, размеры, иконки, `loading`, навигация через **`href`** или **`onPress`**. |
| **PrimaryButton** | `ui/Button.tsx` | Семантическая обёртка: `variant="solid"`. |
| **SecondaryButton** | `ui/Button.tsx` | `variant="outline"`. |
| **DestructiveButton** | `ui/Button.tsx` | Деструктивное действие (тот же solid; стиль задаётся контекстом экрана). |
| **TextButton** | `ui/Button.tsx` | `variant="ghost"`. |
| **FigmaIconButton** | `figma/FigmaIconButton.tsx` | Иконка без текста. |
| **MotionPressable** | `ui/MotionPressable.tsx` | Низкоуровневое нажатие с пресетами анимации; для кастомных ячеек, не для типовых CTA. |

`width`: у обёрток допустимо `block` (= `full` у `FigmaButton`).

## Поля

| Компонент | Путь | Назначение |
| --- | --- | --- |
| **FigmaTextField** | `figma/FigmaTextField.tsx` | Визуал поля, floating label, состояния focus/error. |
| **TextField** | `ui/TextField.tsx` | Форма: hint, `required`, обёртка над `FigmaTextField`. |
| **FigmaSelectField** | `figma/FigmaSelectField.tsx` | Выбор из списка с тем же визуалом поля. |
| **AuthPasswordField** | `features/auth/auth-password-field.tsx` | Пароль в auth-потоках (метрики, показ/скрытие). |

В формах предпочитайте **TextField**, а не прямой `FigmaTextField`, если нужны hint/required.

## Диалоги и листы

| Компонент | Путь | Назначение |
| --- | --- | --- |
| **AppDialog** | `ui/AppDialog.tsx` | Модальные подтверждения и формы в диалоге. |
| **ExitConfirmDialog** | `ui/ExitConfirmDialog.tsx` | Выход с несохранёнными изменениями. |
| **FilterSheet** | `figma/FilterSheet.tsx` | Нижний лист фильтров/сортировки. |

Не дублировать разметку диалога на экранах — расширять props существующих диалогов только по отдельной задаче.

## Layout

| Компонент | Путь | Назначение |
| --- | --- | --- |
| **AppShell** | `layout/AppShell.tsx` | Safe area, ширина телефона, `FloatingDock`, слот `bottomAction`. |
| **FormPageShell** | `layout/FormPageShell.tsx` | Прокручиваемая форма с отступами и опциональным `bottomAction`. |
| **OverlayHost** | `layout/OverlayHost.tsx` | Порталы оверлеев поверх shell. |

## Текст, состояния, медиа

| Компонент | Путь | Назначение |
| --- | --- | --- |
| **AppText** | `ui/AppText.tsx` | Типографика по ролям (`role`, `tone`). |
| **PageState** / **PageHeader** | `ui/` | Пустые/ошибочные состояния и заголовки страниц. |
| **ResilientRemoteImage** | `ui/ResilientRemoteImage.tsx` | Удалённые изображения с retry. |
| **ImagePlaceholder** | `ui/ImagePlaceholder.tsx` | Заглушка в product/layout UI. |
| **FigmaImagePlaceholder** | `figma/FigmaImagePlaceholder.tsx` | Заглушка в Figma-карточках и поиске. |

## Figma-специфичное

Папка `figma/` — визуальные блоки handoff (чипы, табы, dock, карточки авторов/работ, glass). Используйте их на публичных экранах портфолио; не копируйте те же стили в `features/`.

## Параллельные реализации (не дубликаты)

- **PrimaryButton / SecondaryButton** — тонкие обёртки над **FigmaButton**, не отдельный дизайн.
- **TextField** — добавляет подпись/hint к **FigmaTextField**.
- **ImagePlaceholder** vs **FigmaImagePlaceholder** — разные контексты (общий UI vs Figma-компоненты).

## Импорты

Публичные re-export: `components/ui/index.ts`. Figma-компоненты импортируйте по прямому пути из `components/figma/…`, если их нет в barrel.
