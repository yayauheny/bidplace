# bidplace — активный backlog public MVP

Дата: 2026-09-06
Owner: founder
Источник состояния: [`docs/audits/00-CURRENT-MVP-READINESS.md`](../../audits/00-CURRENT-MVP-READINESS.md)

В этом каталоге хранятся только задачи, которые можно выполнять сейчас. Выполненные
промты удалены; их история доступна в Git.

## Как использовать модели

| Модель | Роль |
|---|---|
| GPT-5.6 Sol | Domain contracts, независимый review, security/concurrency review, reconciliation чужих веток |
| Grok 4.6 High | Основная реализация, migrations, multi-module work, code/data inventory |

Каждая code-задача получает отдельную ветку и логический commit. Изменение поведения
обновляет `11-PROJECT-STATUS.md`; новый продуктовый выбор сначала получает append-only
`DEC-*`. PostgreSQL tests запускаются вне sandbox.

## Сейчас: можно выполнять параллельно

| № | Приоритет | Задача | Исполнитель | Зависимость |
|---|---|---|---|---|
| 01 | P1 | [Проверить и интегрировать seller sales history](01-SELLER-SALES-HISTORY-INTEGRATION.md) | GPT-5.6 Sol | Ветка `fix/seller-sales-history`, SHA `c3ef615` |
| 02 | P1 | [Legacy HTTPS preflight](02-HTTPS-LEGACY-PREFLIGHT.md) | Grok 4.6 High; review Sol | Нет |
| 03 | P2 | [Lifecycle bounded progress](03-LIFECYCLE-BOUNDED-PROGRESS.md) | Grok 4.6 High; review Sol | Нет |
| 04 | P0 | [Work-first domain contract](04-WORK-FIRST-DOMAIN-CONTRACT.md) | GPT-5.6 Sol | Открытые варианты сохраняются явно |
| 05 | P0 | [Фактическая data/legal map](05-DATA-AND-LEGAL-INVENTORY.md) | Grok 4.6 High; review Sol | Не читать secrets |
| 06 | P1 | [JWT role freshness](06-AUTH-ROLE-FRESHNESS.md) | Grok 4.6 High; security review Sol | Нет |
| 08 | P1 | [Security и dependency evidence review](08-SECURITY-DEPENDENCY-REVIEW.md) | Grok 4.6 High; security review Sol | Интернет только для первичных advisories |
| 09 | P1 | [Public-pilot operations readiness](09-PUBLIC-PILOT-OPERATIONS-READINESS.md) | Grok 4.6 High; review Sol | Без deploy и чтения secrets |

## Если модели выполняют задачи последовательно

- **GPT-5.6 Sol:** `решение основателя по D01–D04 → 04 → 01 → review результатов Grok`.
- **Grok 4.6 High:** `05 → 08 → 06 → 02 → 09 → 03`.

Stress-test T07 завершён; рекомендация находится в
[`docs/research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md`](../../research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md).
T04 ждёт решения основателя по D01–D04. T05 идёт первым у Grok, потому что его data
map нужна legal drafts, complaints, cookies и operations review.

## Нужно решение основателя

Открыты только D01–D04 из
[`docs/product/14-OPEN-MVP-DECISIONS.md`](../../product/14-OPEN-MVP-DECISIONS.md):

- offer expiry/revoke/counteroffer/competing fixed buy;
- non-payment и second chance;
- кто подтверждает связь и завершение передачи;
- backfill старых Order snapshots.

## После Work-first contract и решений

Выполнять отдельными задачами и отдельными commits:

1. Portfolio Work и attach/relist Listing.
2. Атомарная fixed sale без двойной продажи.
3. Offer lifecycle и конкурентные fixed/offer действия.
4. Non-payment/second chance.
5. Versioned legal acceptance, cookie choices и contact disclosure audit.
6. Жалобы на Work/автора/сделку и text-only `Сообщить об ошибке`.
7. `Покупки / Продажи` и in-app notifications.
8. S3-compatible media, thumbnails и обновлённый backup/restore.
9. Mobile-first redesign, затем 1024/1440 и acceptance states.

Для этих блоков отдельные промты создаются после стабилизации входного контракта. Это
не позволяет исполнителю реализовать спорную механику по догадке и не засоряет проект
заведомо устаревающими заданиями.

После Work-first contract и решения D01–D04 сильной модели отдельно передаётся
contract matrix `Work → Listing → Offer/Bid → Order → handoff` для API, кабинета и
дизайна. До этого такой промт преждевременен: он неизбежно закрепит неподтверждённые
states и actions.

## Перед публичным запуском

- адаптировать семь документов по фактическим flows и data map;
- получить финальную проверку юриста Беларуси;
- провести dependency/security review;
- проверить staging email и уведомления;
- провести конкурентный rehearsal auction/fixed/offer;
- восстановить свежий backup в отдельную БД и проверить целостность;
- проверить consent/cookie/legal pages и audit evidence;
- проверить rollback, migrations и единственный scheduler;
- провести финальный repo-wide implementation/security/design review.

## После MVP

Чат, отзывы и рейтинг, wishlist, подписка, платное продвижение, встроенная оплата,
доставка платформы, drops/presale, дополнительные валюты и языки, AI-помощник,
расширенный QR/social export, коллекции и автоматические session diagnostics.
