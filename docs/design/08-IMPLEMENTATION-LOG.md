# bidplace — журнал реализации Pen v2 UI

Последнее обновление: 2026-08-10

Ветка: `feature/pen-v2-ui`

## Правила журнала

- `design/pen/bidplace-web-v2.pen` неизменяем; контрольный SHA-256:
  `bdb29835e0fc9c431deaf632992362a291fd6b6922a8e858553aea3822bd9b76`.
- Каждый завершённый этап имеет отдельный commit и пройденные проверки.
- В журнал попадают только проверенные результаты, открытые риски и следующие
  действия. Временные догадки не становятся дизайн-решениями.
- Новый UI сохраняет существующие routes, permissions, auth и auction behavior.
  Элементы без подтверждённого контракта не имитируются client-only логикой.

## Статус этапов

| Этап                                | Статус                 | Результат                                          | Commit       |
| ----------------------------------- | ---------------------- | -------------------------------------------------- | ------------ |
| WP0 — canonical baseline            | Готово                 | Pen v2, аудит и новая структура docs зафиксированы | `ef5b7c2`    |
| WP1 — foundation                    | Готово                 | Tokens, Onest/Inter, motion, primitives            | `cdfc784`    |
| WP2 — GlobalHeader/AppShell         | Готово                 | Горизонтальный адаптивный shell и role states      | `cdfc784`    |
| WP3 — AuctionCard/Browse Works      | Готово                 | Shared card и каталог по `H5vf2`                   | `861b7aa`    |
| WP4 — CreatorCard/Browse Authors    | Заблокировано частично | UI возможен; route/list API требуют решения        | —            |
| WP5 — Product                       | Готово                 | About/Creation/Bids и AuctionPlayer                | `eaa0dd8`    |
| WP6 — Creator Profile               | Готово                 | Creator-first профиль и shared work grid           | текущий этап |
| WP7 — Auth/create/supporting routes | В работе               | Auth готов; seller forms — следующий подэтап       | текущий этап |
| WP8 — cleanup and full QA           | Ожидает                | Удаление legacy visual layer и regression QA       | —            |

## Выполнено

### 2026-08-10 — WP0

- Восстановлен и защищён canonical Pen v2.
- Старая Modern UI документация удалена; создан новый design-модуль `00`–`07`.
- Зафиксированы canonical nodes, reference registry, motion guidance и phased
  implementation plan.
- Создана ветка `feature/pen-v2-ui`.

Проверки: Prettier, staged diff check, SHA-256 canonical Pen.

### 2026-08-10 — WP1 + WP2

- `modernTokens` заменён единым `designTokens`; legacy token-файл удалён.
- Подключён Onest 400/500/600/700 для content UI, Inter сохранён для
  navigation; PT Mono удалён.
- Добавлены semantic surfaces, action states, Pen typography, layout и motion
  tokens, включая media 300 ms и единый easing.
- `MotionPressable` получил общие hover/press/focus/reduced-motion states.
- Desktop left rail заменён горизонтальным responsive header; role/capability
  navigation и существующие routes сохранены.
- Подключён утверждённый логотип из founder asset pack.

Проверено на 1440×900 и 390×844: горизонтального overflow нет, guest header и
active navigation сохраняют геометрию и семантику. Commit: `cdfc784`.

### 2026-08-10 — WP3

- Shared `AuctionCard` приведён к квадратной media anatomy `k5vYGf` и
  134-pixel information area.
- На hover/focus масштабируется только изображение: `1 → 1.05`, 300 ms,
  canonical easing; reduced motion отключает scale.
- Карточка показывает только подтверждённые contract values: автор, цена,
  status и deadline.
- `/` перестроен в Browse Works composition с Pen typography, max-width и
  responsive сеткой 4/3/2/1.
- Loading/error/empty/refetch states сохранены; неподдержанные search, sort и
  filters не имитируются.

Проверки: typecheck, lint, 29 unit-тестов, production Expo export, runtime
1440×900/390×844 без horizontal overflow. Commit: `861b7aa`.

### 2026-08-10 — WP5

- Product hero перестроен в Pen composition: story/author, центральная gallery
  и единый `AuctionPlayer`.
- Добавлен artwork-derived atmosphere из того же изображения с neutral veil;
  sharp artwork остаётся основным доступным media.
- Добавлены shared semantic `ProductTabs`: «О работе», «Создание», «Ставки»,
  включая arrow/Home/End keyboard navigation и tabpanel linkage.
- Bids представлены таблицей participant/bid/time без раскрытия PII.
- Creation использует только подтверждённые Product fields и не создаёт новую
  data model.
- Bid mutation, idempotency key, server minimum, first-participation confirm,
  `EmailRulesGate`, admin restriction и canonical refetch не менялись.

Проверки: typecheck, lint, 27 unit-тестов, реальный two-buyer bidding E2E и
отдельный Product composition E2E на 1440×900/390×844.

Commit: `eaa0dd8`.

### 2026-08-10 — WP6

- `/seller/[slug]` приведён к creator-first composition `MqUMz`: центрированный
  портрет, имя, публичные метаданные, описание и ссылка автора.
- Работы автора используют тот же shared `AuctionCard`, что и основной каталог,
  без параллельной реализации карточки.
- Сетка адаптируется 4/3/2/1, использует общие breakpoints и не создаёт
  горизонтального overflow на mobile.
- Публичный контракт не расширялся: handoff contact, buyer email и внутренние
  данные не выводятся.

Проверки: typecheck, lint, 16 focused unit-тестов и реальный public profile E2E
на 1440×900/390×844 с privacy assertions.

Commit: `0304ce7`.

### 2026-08-10 — WP7.1 Auth

- Login и registration получили единый responsive auth-shell: editorial intro
  и form surface рядом на desktop, последовательная композиция на mobile.
- Routes больше не дублируют контейнеры и размеры формы.
- `TextField` унифицирован для focus, disabled и multiline states; validation,
  redirect и auth mutations не менялись.

Проверки: typecheck, lint, 14 focused unit-тестов, существующий mobile/200% zoom
auth E2E и отдельная проверка split/stacked composition.

## Текущая работа

### WP7 — Auth/create/supporting routes

- привести seller onboarding и создание предмета к единому Pen v2 языку;
- сохранить текущие validation, permissions и server-driven states;
- переиспользовать foundation и form primitives без локальных token-систем.

## Заблокировано решениями продукта

- отдельный Home route и конечный route для Works;
- Authors directory и list API;
- серверные search/sort/filter contracts;
- источник данных для Home Top/New;
- отдельная Creation model;
- несколько публичных social links автора.

Эти пункты не блокируют общую foundation, shared components, текущий каталог,
product detail и существующий public seller route.

## Следующая контрольная точка

Зафиксировать auth-shell отдельным commit, затем переиспользовать общий form
language в seller profile, product draft и listing draft.
