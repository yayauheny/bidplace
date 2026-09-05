# bidplace — проверка стека реализации 5–6 сентября

Дата: 2026-09-06  
Ветка проверки: `fix/mvp-reconciliation-review`  
Диапазон: `e417c58..2d6ed7e`  
Режим: review-only; код приложения, Figma и `.pen` не изменялись

## 1. Цель и критерии

Цель проверки — не принять отчёт исполнителя на веру, а сверить каждый коммит с
кодом, контрактами, миграциями, тестами и актуальными решениями основателя.

Статусы:

- **VERIFIED** — заявленное поведение подтверждено и существенных дыр в scope нет;
- **PARTIAL** — основное поведение работает, но DoD или пользовательский сценарий
  закрыт не полностью;
- **FAILED** — решение не выполняет заявленный контракт либо создаёт блокирующий
  риск;
- **STALE DECISION** — реализация может быть технически корректной, но основана на
  решении, которое основатель вернул на исследование или уточнение.

## 2. Проверка заявленных работ

| Блок | Коммит(ы) | Вердикт | Что подтверждено | Что осталось |
|---|---|---|---|---|
| QW-01 HTTPS links | `848b340` | PARTIAL | Один shared HTTPS schema применяется к четырём публичным ссылкам; unsafe schemes отклоняются; private handles сохранены. | Нет preflight/миграции для уже сохранённых `http:` значений. После обновления response schema такая legacy-строка способна сломать чтение всего профиля. До публичного запуска нужен data audit и явная политика исправления. |
| QW-02 Activity | `6756e4a` | PARTIAL | `CONTACTED` и `HANDOFF_FAILED` больше не маскируются как `WON`; cancelled Order не ведёт на гарантированный 403; typed labels добавлены. | `Listing.CANCELLED` без Order отображается как `OUTBID`/«Ставка перебита». При нескольких Orders одного buyer на одном Listing выбирается неупорядоченный первый Order. Query остаётся без pagination. |
| QW-03 env fail-closed | `d96008c` | VERIFIED | `APP_ENV=production` требует `NODE_ENV=production`; production secrets/SMTP/rules/reset URL и bypass guards централизованы; local/test paths покрыты matrix tests. | Staging намеренно сохранён по прежним правилам и требует отдельного launch review конфигурации. |
| QW-04 rejected recovery | `1f4ba56`, merge `198a921` | PARTIAL | Тот же Product редактируется и возвращается `REJECTED → PENDING_REVIEW`; причина доступна owner; public visibility и audit history покрыты. | Общий write path имеет TOCTOU: проверка editability делается до `product.update`; remove/reorder media и creation story также не везде повторяют статусный guard внутри транзакции. Concurrent submit/moderation может пропустить запись в уже locked Product. |
| QW-05 48h deadline | `fb03ec4`, `9b3fd76`, merge `3666a05` | VERIFIED / PRODUCT OPEN | Lifecycle close, recovery и replacement используют одну 48h policy; idempotent read не двигает deadline. | Само окно и replacement flow теперь открыты для рыночного и юридического исследования. Код корректно реализует текущий временный контракт. |
| QW-06 image cache | `6133381` | VERIFIED | Immutable cache оставлен только у address-by-id Product image; mutable profile/creation images требуют revalidation; private media — `no-store`. | ETag/Last-Modified отсутствуют, поэтому revalidation пока означает повторную передачу bytes. Это performance improvement, не correctness blocker. |
| A product contract | `1b2bac9` | STALE DECISION | В одном месте собраны fixed sale, offer и связанные варианты. | `DEC-072` ошибочно записал часть быстрых defaults как Confirmed. Portfolio перенесён в wave 2 вопреки текущему решению; BYN/RUB и replacement преждевременно закрыты; offer expiry отсутствует. Нужна append-only ревизия до реализации fixed/offers. |
| B lawyer pack | `d199bed` | PARTIAL / STALE INPUT | Создан отдельный BY+RF пакет и launch gate human review. | Пакет наследует `DEC-072`, не даёт полного legal UX placement и не разделяет «ответ юриста», «актуально подтверждено» и «открытый вопрос». Требуется новый gap pack. |
| C expired SCHEDULED | `88ef55e` | PARTIAL | Просроченный `SCHEDULED` атомарно становится `CANCELLED`, пишет system audit, не создаёт Order и исчезает из повторной выборки. | Нет уведомления автору и простого relist path, которые подтвердил основатель. Батч может голодать на устойчиво падающих строках. |
| D Order snapshot | `8e61a3d` | VERIFIED WITH RESIDUAL | Новые Orders внутри create transaction фиксируют title, currency и Product public ID; все три create path используют helper. | Legacy rows читают live fields; snapshot ещё не включает будущий sale format. До публичных данных нужен осознанный backfill/no-backfill gate. |
| E seller inbox | `4c784a2` | PARTIAL | Появился paginated seller endpoint, кабинетный route и ссылки на Order; projection не раскрывает seller contact. | `CANCELLED` полностью скрыты, поэтому это не история продаж и не даёт контекста для жалобы/relist. Нет разделения «Покупки / Продажи», фильтров и seller HTTP 200 proof. Обычный user без seller capability получает пустой список вместо capability gate. |
| F Order GET blob select | `ac9179e` | VERIFIED | Order projection не читает profile photo bytes. | Отдельный admin moderation path всё ещё читает blob ради наличия фото. |
| G remaining blob selects | `fae11b7` | PARTIAL | Bid, listing, lifecycle и public Product reads используют metadata selects. | Admin seller approval всё ещё использует `profilePhotoData.byteLength`; object storage/thumbnail work остаётся отдельным P1. |
| H lifecycle batch | `ca8c681` | PARTIAL | Каждая выборка bounded `take: 50` со стабильной сортировкой; ошибка одной строки не останавливает цикл. | Нет proof `51 → 50 + 1`; три последовательных цикла могут обработать до 150 строк; poison-prefix starvation и длительный tick не решены; multi-instance coordination отсутствует. |
| I inbox HTTP auth | `1a65a10` | PARTIAL | Guest 401 и admin 403 проверены через HTTP. | Нет HTTP happy path 200 для seller. Guard доверяет роли из JWT и не перечитывает текущую DB role. |
| J follow-up residuals | `2d6ed7e` | PARTIAL | R1–R10 в старом аудите в основном доказуемы и полезны. | Формулировка «блокирующих дефектов нет» слишком сильная: в stack не отмечены write TOCTOU, потеря cancelled seller history, legacy HTTP URL compatibility и provisional характер `DEC-072`. |

## 3. Новые findings

### [P1] Product write lock можно обойти гонкой

`ProductsService.update` проверяет status/listings до записи, а затем делает
обычный `update({ where: { id } })`. `ImagesService.remove/reorder` и часть
creation-story операций также опираются на состояние, прочитанное до транзакции.
Если submit или admin moderation блокирует Product между read и write, поздняя
запись всё равно проходит. Это нарушает инвариант «PENDING_REVIEW/APPROVED и
SCHEDULED/LIVE не редактируются».

Durable fix: status/capability recheck и guarded mutation в одной serializable
transaction, с conditional update/count либо эквивалентным database guard. Нужен
настоящий race integration test, а не только последовательные unit tests.

### [P1] Seller inbox теряет отменённые сделки

`OrdersService.listForSeller` использует `status: { not: 'CANCELLED' }`.
Продавец не видит отмену, причину, прежнего победителя и запись, от которой должен
идти relist/complaint/replacement workflow. Это противоречит заявленной истории
продаж и текущему намерению основателя сделать кабинет «Покупки / Продажи».

До исследования replacement mechanics безопасно вернуть cancelled rows как
read-only history. Действия выбора следующего покупателя нельзя проектировать по
текущему admin-only default.

### [P1] `DEC-072` нельзя использовать как вход реализации

Основатель явно вернул offer expiry, currency display, next-bidder/contact
mechanics и legal contract moment на исследование. Portfolio-only, наоборот,
подтверждён для public MVP: создаётся Work, а Listing/формат продажи подключается
опционально позже. Реализация fixed/offers по текущему RFC закрепит неверные
границы и создаст дорогую переделку.

### [P2] Activity неоднозначна после cancellation/replacement

Все Orders Listing загружаются без `orderBy`, затем берётся первый с
`buyerId=userId`. После cancellation/replacement один пользователь теоретически
может иметь несколько Orders по разным собственным Bid, и UI получит случайный
status/link. Отдельно cancelled Listing без Order называется «Ставка перебита».
Нужен явный projection priority и отдельный auction-cancelled status.

### [P2] HTTPS contract не учитывает legacy data

Write validation закрыта правильно, но response validation стала строже без
миграции. Перед deploy надо запросом проверить четыре URL columns. Политику
нельзя делать silent coercion: валидные HTTPS остаются, `http:` либо вручную
исправляется/обнуляется с audit, либо профиль временно возвращается owner на
исправление.

### [P2] JWT role может устареть

`BearerAuthGuard` перечитывает только `status` и `sessionVersion`, а downstream
authorization использует `auth.role` из JWT. Любой административный change role
должен атомарно увеличивать `sessionVersion`, либо guard должен брать role из DB.
Сейчас общего инварианта на это нет.

### [P2] Lifecycle bounded, но не гарантирует прогресс

Stable `take: 50` ограничивает память, однако 50 повторно падающих ранних строк
будут скрывать весь хвост. Для пилота достаточно retry metadata + alert/quarantine
policy либо выборки с `skip locked`; точное решение зависит от one-replica launch
topology. Отдельно нужен test двух последовательных runs.

### [P3] Документационная гигиена

`git diff --check e417c58..2d6ed7e` находит trailing whitespace в четырёх docs,
а дата `10-CODE-ARCHITECTURE.md` отстаёт от последней правки. Это не блокирует
продукт, но должно уйти в механическую cleanup задачу.

## 4. Перепроверка R1–R10

| ID | Статус после проверки | Решение |
|---|---|---|
| R1 long serial tick | CONFIRMED | P1 operations до публичного запуска; не увеличивать batch как лечение. |
| R2 one captured `now` | CONFIRMED, LOW | Допустима задержка до следующего tick, если tick bounded по времени. |
| R3 poison starvation | CONFIRMED | P1 вместе с lifecycle progress/alert policy. |
| R4 no 51-row proof | CONFIRMED | READY NOW, маленькая тестовая задача после выбора progress fix. |
| R5 no seller HTTP 200 | CONFIRMED | READY NOW и объединить с capability/history correction. |
| R6 admin blob hydration | CONFIRMED | READY NOW, маленькая безопасная perf-задача. |
| R7 stale JWT role | CONFIRMED | P1 security; сначала определить единый role-change invariant. |
| R8 no distributed lock | CONFIRMED | Не blocker one-replica pilot; обязательный gate перед scale-out. |
| R9 legacy Order fallback | CONFIRMED | Data migration decision до real historical data. |
| R10 stale doc date | CONFIRMED | Docs cleanup. |

## 5. Проверки

Вне sandbox, против доступного PostgreSQL, выполнен `corepack pnpm verify`:

- Prisma generate: pass;
- typecheck: 7/7 packages;
- lint: 2/2 apps;
- API unit: 52 files, 302 tests;
- contracts: 2 files, 27 tests;
- integration: 21 files, 73 tests;
- build: 7/7 packages, включая Expo export web/Android/iOS.

Итог команды: exit 0. Ожидаемые error logs принадлежат негативным тестам SMTP и
lifecycle failure recovery; test files завершились успешно.

Passing suite доказывает текущие предусмотренные сценарии, но не закрывает
найденные concurrency, legacy-data и product-contract gaps.

## 6. Что реально закрыто из аудита 20 августа

Подтверждено закрытыми либо приемлемыми для controlled pilot:

- password reset/account recovery;
- emergency admin cancel/hide и user ban/revoke;
- upload authorization, normalization и resource budgets;
- release/backup/restore runbook и one-replica pilot boundary;
- Order snapshot для новых строк;
- seller Order discovery как базовый active inbox;
- основные binary overfetch reads;
- HTTPS-only новые публичные ссылки;
- truthful active Order statuses;
- fail-closed production profile;
- recovery отклонённого Product;
- expired scheduled cancellation на server side.

Закрыто частично:

- seller sales history и cabinet information architecture;
- lifecycle progress/monitoring;
- media storage and renditions;
- immutable history для legacy Orders;
- Activity pagination/projection;
- legal/public document readiness;
- fixed sale and price offers;
- complaint/report-service workflow;
- in-app notifications.

Остаётся блокером публичного MVP:

1. исправить Product write concurrency invariant;
2. заменить `DEC-072` актуальным контрактом после research + legal questions;
3. закрыть legal UX/data/operator pack письменной проверкой BY+RF;
4. реализовать и нагрузочно проверить выбранные fixed/offer mechanics;
5. довести «Покупки / Продажи», cancelled history и complaint/relist path;
6. выполнить staging launch rehearsal и backup/restore proof;
7. после этого адаптировать production UI к неизменяемому Figma handoff.

## 7. Следующий порядок

1. Исправить и отдельно проверить Product write race.
2. Подготовить competitor research по offer expiry, next bidder, contact release,
   currency and disputes; код этих механик пока не писать.
3. Подготовить полный lawyer gap pack с legal UX placement.
4. Append-only пересмотреть `DEC-072` и нормализовать owner docs.
5. Исправить seller cancelled history/capability и Activity ambiguity.
6. Спроектировать Work-first portfolio model и затем fixed/offers contract.
7. Сделать in-app notifications, complaint diagnostics и S3/object-storage plan.
8. Провести implementation + security reviews, staging rehearsal.
9. Начать Figma-to-production redesign последним слоем.

