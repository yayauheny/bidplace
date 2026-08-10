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

| Этап                                | Статус                 | Результат                                          | Commit    |
| ----------------------------------- | ---------------------- | -------------------------------------------------- | --------- |
| WP0 — canonical baseline            | Готово                 | Pen v2, аудит и новая структура docs зафиксированы | `ef5b7c2` |
| WP1 — foundation                    | Готово                 | Tokens, Onest/Inter, motion, primitives            | `cdfc784` |
| WP2 — GlobalHeader/AppShell         | Готово                 | Горизонтальный адаптивный shell и role states      | `cdfc784` |
| WP3 — AuctionCard/Browse Works      | Готово                 | Shared card и каталог по `H5vf2`                   | `861b7aa` |
| WP4 — CreatorCard/Browse Authors    | Заблокировано частично | UI возможен; route/list API требуют решения        | —         |
| WP5 — Product                       | Готово                 | About/Creation/Bids, URL tabs, related works       | `a5af90f` |
| WP6 — Creator Profile               | Готово                 | Creator-first профиль и shared work grid           | `0304ce7` |
| WP7 — Auth/create/supporting routes | Готово                 | Auth, editors, purchases, order и moderation       | `2f6b042` |
| WP8 — cleanup and full QA           | Готово                 | Единый UI layer и полный regression QA             | `a1beb72` |
| WP9 — backend/security audit        | Готово                 | Public boundaries, uploads and private bid aliases | `84336e9` |

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

### 2026-08-10 — Product completion audit

- ProductTabs переведены с route-local state на URL как единый источник:
  `?tab=creation` и `?tab=bids` поддерживают deep link и browser back; invalid
  значения безопасно возвращают About.
- Явный `aria-selected` дополняет tab/tablist/tabpanel contract.
- About получил блок реальных публичных работ того же автора. Текущий предмет
  исключается, используется существующий public seller contract и один shared
  `AuctionCardGrid`; recommendation ranking не выдумывается.

Проверки: ProductTabs unit 11/11, Product/Creator focused unit 18/18,
Product/Creator Playwright 2/2, typecheck и lint.

Commits: `113f857`, `a5af90f`.

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

Commit: `af351b3`.

### 2026-08-10 — WP7.2 Seller editors

- Добавлен единый responsive `FormPageShell` и двухколоночный
  `FormPageColumns`; локальные shell-дубли удалены из seller profile, product
  draft и listing draft.
- `FormSection` получил единый warm surface, заголовок и optional description.
- Профиль продавца разделён на публичные данные, фото и приватные параметры
  передачи; privacy boundary и mutations сохранены.
- Создание предмета разделено на основную информацию, характеристики и
  логистику. Существующее поле состояния снова доступно для редактирования.
- Создание размещения разделено на выбор предмета и расписание; для пустого
  списка добавлен честный следующий шаг без client-only данных.

Проверки: typecheck, lint, 23 focused unit-теста и полная route-matrix на
1440×900/1024×900/390×844, включая horizontal overflow и empty state.

Commit: `b4f51b4`.

### 2026-08-10 — WP7.3 Supporting routes

- Purchases используют компактные warm cards, единые status chips и
  полноширинное действие заказа.
- Order panels переведены на общий `FormSection`; role-specific buyer, seller и
  admin projections, PII boundaries и status transitions не менялись.
- Moderation переведена на общий responsive shell; approve/suspend,
  request-changes, cancel/replace workflows сохранены.
- Удалены оставшиеся acceptance-ожидания legacy rail tooltip в проверенных
  сценариях горизонтального header.

Проверки: typecheck, lint, order handoff E2E, полный Wave One moderation E2E и
route-matrix на 1440×900/1024×900/390×844.

Commit: `2f6b042`.

### 2026-08-10 — WP8 Cleanup and full QA

- Runtime-компоненты перенесены из временного `components/modern-ui` в
  канонический `components/ui`; все рабочие imports обновлены.
- Подтверждено отсутствие параллельных token/component systems: приложение
  использует один `designTokens` contract и один UI component layer.
- Acceptance-сценарии синхронизированы с Pen v2 terminology, горизонтальным
  header, вкладками Product и актуальными responsive breakpoints.
- `AppDialog` получил детерминированный initial focus, focus containment и
  возврат фокуса на исходное действие; профиль автора — семантический heading.
- Canonical Pen не менялся: SHA-256 совпадает с зафиксированным baseline, diff
  отсутствует.

Проверки: typecheck, lint, 19 unit suites / 107 tests, 35 Playwright E2E,
production Expo export для web/iOS/Android, `git diff --check`, Pen SHA-256 и
Pen diff guard.

### 2026-08-10 — Backend/security and test audit

- Единый public Listing predicate теперь защищает public Bid history и
  realtime joins теми же Product/SellerProfile status gates, что и каталог.
- ProductImage перестаёт быть публичным при непубличном авторе или отсутствии
  public Listing; cache-control вычисляется по фактической публичности.
- Количество и суммарный объём изображений проверяются по всему Product внутри
  serializable-транзакции, а не только на один multipart request.
- Bidder alias стал детерминированным внутри Listing и различным между
  Listings; внутренний `userId` больше не используется как публичный suffix.
- Concurrent duplicate SellerProfile/slug возвращает предсказуемый conflict.
- Протухшая абсолютная дата permission test заменена относительной; E2E seed
  сверяет alias через публичный API, не копируя backend algorithm.

Проверки: contracts 7/7, API unit 145/145, API PostgreSQL integration 39/39,
mobile unit 113/113, полный Chromium Playwright 35/35, monorepo typecheck 7/7,
lint 2/2 и production build 7/7.

Commits: `84336e9`, `d9f0ed4`, `348ac36`.

## Текущая работа

### Release acceptance

- founder visual review по canonical Pen и реальным данным;
- smoke check на физических iOS/Android устройствах;
- отдельные продуктовые решения для заблокированных новых routes/contracts.

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

Провести founder/device acceptance и принимать Home/Authors/search/filter/sort
только после утверждения их contracts.
