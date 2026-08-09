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
| WP1 — foundation                    | Готово                 | Tokens, Onest/Inter, motion, primitives            | текущий этап |
| WP2 — GlobalHeader/AppShell         | Готово                 | Горизонтальный адаптивный shell и role states      | текущий этап |
| WP3 — AuctionCard/Browse Works      | В работе               | Shared card и каталог по `H5vf2`                   | —            |
| WP4 — CreatorCard/Browse Authors    | Заблокировано частично | UI возможен; route/list API требуют решения        | —            |
| WP5 — Product                       | Ожидает                | About/Creation/Bids и AuctionPlayer                | —            |
| WP6 — Creator Profile               | Ожидает                | Публичный профиль автора                           | —            |
| WP7 — Auth/create/supporting routes | Ожидает                | Единый язык для экранов без полного Pen target     | —            |
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
active navigation сохраняют геометрию и семантику.

## Текущая работа

### WP3 — AuctionCard и Browse Works

- привести shared `AuctionCard` к anatomy `k5vYGf`;
- реализовать media-only hover scale и точные content/metric styles;
- перестроить текущий `/` по composition `H5vf2`, сохранив API pagination и
  существующие состояния.

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

Завершить WP3, выполнить responsive/runtime QA, проверить отсутствие diff у
canonical Pen и зафиксировать отдельным commit.
