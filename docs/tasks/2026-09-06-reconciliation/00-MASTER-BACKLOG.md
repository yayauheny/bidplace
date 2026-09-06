# bidplace — master backlog к public MVP

Дата: 2026-09-06  
Owner: founder  
Источник: implementation review, baseline audit, `DEC-075`, legal gap audit

## 1. Правила исполнения

- Одна задача — одна ветка и один логический commit, если prompt не требует
  migration split.
- Исполнитель сначала пишет success criteria, candidate fixes и trade-offs.
- App code не меняется в research/legal/design-audit задачах.
- Original Figma только читается; никогда не редактируется.
- Каждый implementation result проходит отдельный review в новом чате по
  приложенному review prompt.
- Tests PostgreSQL запускать вне sandbox; не повторять известный sandbox failure.
- Любое изменение поведения обновляет `11-PROJECT-STATUS.md`; decision log только
  для явного решения основателя.

## 2. Model routing

| Исполнитель | Давать |
|---|---|
| Grok Composer 2.5 | Docs hygiene, inventory, mechanical mappings, small static checks |
| GPT Luna | Маленькие локальные code/test tasks с готовым контрактом |
| GPT Terra | Bounded Nest/UI fixes по существующим patterns, без новой product architecture |
| Grok 4.6 High | Основная реализация, migrations, multi-module feature work, research synthesis |
| GPT-5.6 Sol | Независимый review, security/concurrency, contract reconciliation, проверка чужого результата |
| Самая мощная доступная модель | Финальный fixed/offer architecture, сложные races, legal/product synthesis и полный redesign review |

Сейчас окно GPT-5.6 Sol выгоднее сохранить для reviews T03, T12–T15, T19–T21 и
финального release gate. Механическую реализацию отдавать Terra/Luna/Composer.

## 3. READY NOW

Эти задачи не зависят от market/legal ответа и не меняют спорную product механику.

| ID | Priority | Задача | Исполнитель | Review | Зависимости | Готово когда |
|---|---|---|---|---|---|---|
| T03 | P0 | [Product write atomicity](03-PRODUCT-WRITE-ATOMICITY.md): закрыть race update/media/creation story vs submit/moderation/listing lock | Grok 4.6 High | GPT-5.6 Sol + security | нет | Guards и mutation в одной transaction; race integration proof; no `.pen` |
| T04 | P1 | [Seller sales history](04-SELLER-SALES-HISTORY.md): вернуть cancelled/failed rows read-only, capability gate, HTTP seller 200 | Terra | GPT-5.6 Sol | не добавлять next-bidder action | `Продажи` имеет active/history/problem truth и privacy tests |
| T05 | P1 | [Activity projection](05-ACTIVITY-PROJECTION.md): auction cancelled status и deterministic Order selection | Terra | Sol | текущая auction model | Нет случайного `.find`; replacement cases и cancelled Listing truthful |
| T06 | P1 | [HTTPS legacy-data preflight](06-HTTPS-LEGACY-PREFLIGHT.md) и безопасная migration policy | Luna/Terra | Sol security | доступ к disposable DB | До strict response deploy найдено/обработано legacy `http:`; no silent unsafe coercion |
| T07 | P2 | [Убрать admin profile-photo blob hydration](07-ADMIN-PHOTO-METADATA.md) | Luna | Terra review | object store остаётся текущим | Approval использует metadata/length, blob не select; behavior unchanged |
| T08 | P2 | [Docs hygiene](08-DOCS-HYGIENE.md): trailing whitespace, stale dates/links, superseded banners | Composer 2.5 | Luna | текущий audit | `diff --check` clean; claims не переписаны; один owner per claim |
| T09 | P2 | [Lifecycle bounded-progress proof](09-LIFECYCLE-BOUNDED-PROGRESS.md) | Terra | Sol | не выбирать новую queue topology | Test `51 → 50 + 1`; измерение tick; poison starvation задокументирован |
| T10 | P1 | [Read-only Figma inventory and gap map](10-FIGMA-READONLY-INVENTORY.md) | Grok 4.6 High | Sol/UI reviewer | доступ к Figma | Все screens/states/components/icons mapped; original unchanged; no implementation |

Порядок: **T03 → T04/T05/T06/T07 параллельно → T08/T09/T10**.

## 4. RESEARCH / LAWYER NOW

| ID | Priority | Задача | Исполнитель | Выход |
|---|---|---|---|---|
| T01 | P0 | Marketplace mechanics research | Grok 4.6 High | [`01-MARKETPLACE-MECHANICS-RESEARCH.md`](01-MARKETPLACE-MECHANICS-RESEARCH.md) |
| T02 | P0 | Written Belarus legal validation | Профильный юрист; Sol проверяет полноту | [`../../legal/bidplace-voprosy-yuristu-by-final.txt`](../../legal/bidplace-voprosy-yuristu-by-final.txt) |
| T11 | P1 | [Abuse research](11-AUCTION-ABUSE-RESEARCH.md): shill bidding, friend bids, duplicate/resale works, evidence and sanctions | Grok 4.6 High | Primary-source matrix; no code |
| T12R | P0 | [BY legal primary-source research](12-BY-LEGAL-PRIMARY-SOURCE-RESEARCH.md) | Grok 4.6 High | Returned partial; privacy evidence useful, commerce/ОКЭД incomplete |
| T13R | P0 | [Research correction pass](13-RESEARCH-CORRECTION-PROMPT.md) | Grok 4.6 High | Stable citations, three outputs and corrected № 457/ОКЭД mapping |

Первый research pass сохранён как raw и оценён в
[`2026-09-06-RESEARCH-PACK-REVIEW.md`](../../audits/2026-09-06-RESEARCH-PACK-REVIEW.md):
T01/T11/T12R остаются partial до T13R. Финальный legal answer T02 должен получить
corrected evidence и фактическую infrastructure/data map до публикации документов.

## 5. WAITING DECISION

После T01/T02 основатель выбирает варианты; исполнитель не должен выбирать сам.

| ID | Решение | Почему блокирует |
|---|---|---|
| D01 | Offer expiry, revoke, counteroffer, competing fixed buy | Определяет states, unique constraints, copy and notifications |
| D02 | Non-payment/second chance/rank/contact release | Определяет privacy, Order history и cabinet actions |
| D03 | Contact/payment window and reminders | Текущие 48h временные |
| D04 | BYN only vs another listing currency vs conversion hint | Определяет money contract and display copy |
| D05 | Legal contract moment and required nearby terms per action | Блокирует public fixed/offer UX |
| D06 | Cookie/analytics basis and controls | Блокирует consent implementation |
| D07 | Legacy Order snapshot backfill | Нужен до появления real mutable history |
| D08 | Report diagnostics exact fields/retention/user preview | Privacy/security boundary |

Каждое выбранное решение получает новую append-only `DEC-*` запись и только затем
может переходить в implementation.

## 6. CORE IMPLEMENTATION BEFORE REDESIGN

| ID | Priority | Задача | Model | Depends on |
|---|---|---|---|---|
| T12 | P0 | Work-first domain contract: Product/Work lifecycle, portfolio visibility, Listing attach/relist, immutable history | strongest/Grok High | `DEC-075`, review T03 |
| T13 | P0 | Implement portfolio-only Work and sale attachment APIs | Grok High | T12 |
| T14 | P0 | Fixed sale server contract and atomic single-buyer Order | strongest/Grok High | D04/D05, T12 |
| T15 | P0 | Buyer offer lifecycle and concurrency | strongest/Grok High | D01/D04/D05, T14 |
| T16 | P0 | Non-payment/second-chance workflow | Grok High | D02/D03 |
| T17 | P0 | Data inventory, versioned acceptance, cookie choices and contact disclosure audit | Grok High | T02, D05/D06 |
| T18 | P1 | `Покупки / Продажи` information architecture and complete history | Terra/Grok High | T04, T13–T16 |
| T19 | P1 | In-app notification center and event matrix | Grok High | D01–D03, T14–T16 |
| T20 | P0 | Complaints for Work/author/Order with private screenshot and status | Grok High | T02, T17 |
| T21 | P0 | Privacy-safe «Сообщить об ошибке» diagnostics | Grok High + security | D08, T17 |
| T22 | P1 | S3-compatible object storage migration, thumbnails/renditions and backup changes | Grok High | hosting decision/data map |
| T23 | P1 | Auth role freshness/session invalidation invariant | Terra + security | none |
| T24 | P1 | Lifecycle progress/alerts and one-replica enforcement | Grok High | T09, launch topology |
| T25 | P1 | Stable business error codes outside bids | Terra | flows T13–T21 known |
| T26 | P1 | Transactional email vs in-app delivery implementation | Terra | T02, T19 |

Все P0 implementation tasks требуют independent Sol/security review. T14/T15/T16
нельзя объединять в один огромный commit.

## 7. DOCUMENT NORMALIZATION

| ID | Задача | Когда |
|---|---|---|
| T27 | Owner map: один claim → один owner; audits/baseline/old handoff historical | После T01/T02 decisions |
| T28 | Переписать public legal drafts по письменному mapping; удалить future fiction | После T02/T17 |
| T29 | Сохранить raw transcript/founder notes как отдельные immutable sources, если доступны | В любое время, без изменения conclusions |
| T30 | Сократить `11-PROJECT-STATUS.md` до current status + dated evidence appendix | После core implementation |
| T31 | Отдельно пересмотреть canonical Pen references и cleanup policy по явному founder instruction | После полного Figma inventory; никогда не трогать original Figma |

Удаление документов выполняется только после migration map `old claim → owner or
historical archive`. Git history не является заменой такого mapping.

## 8. FINAL DESIGN LAYER

| ID | Задача | Gate |
|---|---|---|
| T32 | Утвердить Figma handoff: create Work, sale-format step, footer/legal, `Покупки / Продажи`, complaint/notifications | T10, T12, T17–T21 |
| T33 | Hugeicons inventory, licenses, semantic icon map and one icon primitive | T10/T32 |
| T34 | Mobile-first production redesign at 390 px | Core API/contracts stable |
| T35 | Responsive 1024/1440 adaptation | T34 |
| T36 | Loading/empty/error/long-content/keyboard/zoom/screen-reader/reduced-motion acceptance | T34/T35 |
| T37 | Founder visual acceptance against read-only Figma | T36 |

Redesign не должен переносить текущие route-local patches или подменять отсутствующий
server contract fake controls/data.

## 9. RELEASE GATE

| ID | Задача | DoD |
|---|---|---|
| T38 | Dependency/advisory triage | Production deps classified; upgrades isolated; no blind majors |
| T39 | Staging email/notification smoke | Real provider evidence, no secrets in logs |
| T40 | Auction/fixed/offer 10-session race rehearsal | No double winner/sale, lost accepted action or contact leak |
| T41 | Backup-change-restore-integrity drill | Timestamped restore proof on separate DB |
| T42 | Consent/cookie/legal page rehearsal | Current versions, choices and audit evidence verified |
| T43 | Rollback/one-scheduler/public config check | Deployed SHA, migrations, rollback and replica count known |
| T44 | Final repo-wide implementation/security/design review | No unresolved P0; accepted P1 named by owner |

## 10. AFTER MVP

Chat, reviews/rating, wishlist/likes, subscription and payment provider, paid
promotion, AI-assisted card/profile, QR share frames/physical stickers, drops and
presale, services, multiple languages/currencies beyond selected MVP, native
store auth, advanced fraud scoring, collections and expanded creator biography.

These remain documented ideas. They do not enter current schemas or redesign
controls unless the founder explicitly promotes one through a new decision.

## 11. Текущие blockers

Closed local testing is possible now. A public audience is blocked by:

1. T03 Product write race;
2. T01/T02 and decisions D01–D06;
3. T12–T21 core product/legal flows;
4. operator/hosting/processors and final public documents;
5. T22 media/backup plan selected for expected pilot volume;
6. T32–T37 Figma adaptation and acceptance;
7. T39–T44 release proof.
