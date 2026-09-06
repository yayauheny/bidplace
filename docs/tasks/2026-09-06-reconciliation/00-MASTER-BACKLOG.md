# bidplace — master backlog к public MVP

Дата: 2026-09-06  
Owner: founder  
Источник: implementation review, baseline audit, `DEC-075`–`DEC-078`, legal gap audit

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
| T04 | P1 | [Seller sales history](04-SELLER-SALES-HISTORY.md): вернуть cancelled/failed rows read-only, capability gate, HTTP seller 200 | Terra | GPT-5.6 Sol | не добавлять next-bidder action | `Продажи` имеет active/history/problem truth и privacy tests |
| T06 | P1 | [HTTPS legacy-data preflight](06-HTTPS-LEGACY-PREFLIGHT.md) и безопасная migration policy | Luna/Terra | Sol security | доступ к disposable DB | До strict response deploy найдено/обработано legacy `http:`; no silent unsafe coercion |
| T08 | P2 | [Docs hygiene](08-DOCS-HYGIENE.md): trailing whitespace, stale dates/links, superseded banners | Composer 2.5 | Luna | текущий audit | `diff --check` clean; claims не переписаны; один owner per claim |
| T09 | P2 | [Lifecycle bounded-progress proof](09-LIFECYCLE-BOUNDED-PROGRESS.md) | Terra | Sol | не выбирать новую queue topology | Test `51 → 50 + 1`; измерение tick; poison starvation задокументирован |

Уже выполнены и отражены в `11-PROJECT-STATUS.md`: T03 atomicity, T05 Activity,
T07 photo metadata и T10 read-only Figma inventory. T09 пока закрывает только
ограничение batch; доказательство `51 → 50 + 1` и poison-prefix residual остаются.

Порядок: **T04/T06 параллельно → T08/T09**.

## 4. RESEARCH / LAWYER NOW

| ID | Priority | Status | Задача | Исполнитель | Выход |
|---|---|---|---|---|---|
| T01 | P0 | Partial | Marketplace mechanics research | Grok 4.6 High | [`01-MARKETPLACE-MECHANICS-RESEARCH.md`](01-MARKETPLACE-MECHANICS-RESEARCH.md) |
| T02 | — | Closed | Broad Belarus legal questionnaire | Historical; superseded by `DEC-078` | [`02-LAWYER-BY-RF-VALIDATION.md`](02-LAWYER-BY-RF-VALIDATION.md) |
| T11 | P1 | Partial | [Abuse research](11-AUCTION-ABUSE-RESEARCH.md): shill bidding, friend bids, duplicate/resale works, evidence and sanctions | Grok 4.6 High | Primary-source matrix; no code |
| T12R | P0 | Partial | [BY legal primary-source research](12-BY-LEGAL-PRIMARY-SOURCE-RESEARCH.md) | Grok 4.6 High | Privacy evidence useful; commerce/ОКЭД evidence superseded or incomplete |
| T13R | P0 | Ready | [Research correction pass](13-RESEARCH-CORRECTION-PROMPT.md) | Grok 4.6 High | Stable citations and corrected research outputs; do not reopen selected ОКЭД |
| T14R | P0 | Ready | [Belarus legal UX market research](14-BELARUS-LEGAL-UX-MARKET-RESEARCH.md) | Grok 4.6 High; Sol reviews | Registration, cookie, action-confirmation, footer and support matrix with LAW/PATTERN evidence |

Первый research pass сохранён как raw и оценён в
[`2026-09-06-RESEARCH-PACK-REVIEW.md`](../../audits/2026-09-06-RESEARCH-PACK-REVIEW.md):
T01/T11/T12R остаются partial до T13R. Широкий опросник T02 закрыт решением
`DEC-078` и сохранён как история. T14R уточняет только legal UX и короткие тексты.
После фактической infrastructure/data map финальные адаптированные документы всё равно
проходят проверку профильного юриста в T28.

## 5. WAITING DECISION

После T01 и оставшихся исследований основатель выбирает варианты; исполнитель не должен выбирать сам.

| ID | Решение | Почему блокирует |
|---|---|---|
| D01 | Offer expiry, revoke, counteroffer, competing fixed buy | Определяет states, unique constraints, copy and notifications |
| D02 | Non-payment/second chance/rank/contact release | Определяет privacy, Order history и cabinet actions |
| D03 | Contact/payment window and reminders | Текущие 48h временные |
| D07 | Legacy Order snapshot backfill | Нужен до появления real mutable history |

Закрыто `DEC-078`: валюта MVP — `BYN`; fixed buy создаёт сделку после отдельного
подтверждения покупателя; принятие offer продавцом сразу создаёт сделку; cookie-баннер
обязателен; V1 сообщения об ошибке передаёт только текст. T14R выбирает точное место,
controls и microcopy, но не открывает эти решения заново. Каждое новое выбранное
решение получает append-only `DEC-*` запись до implementation.

## 6. CORE IMPLEMENTATION BEFORE REDESIGN

| ID | Priority | Задача | Model | Depends on |
|---|---|---|---|---|
| T12 | P0 | Work-first domain contract: Product/Work lifecycle, portfolio visibility, Listing attach/relist, immutable history | strongest/Grok High | `DEC-075`, review T03 |
| T13 | P0 | Implement portfolio-only Work and sale attachment APIs | Grok High | T12 |
| T14 | P0 | Fixed sale server contract and atomic single-buyer Order | strongest/Grok High | `DEC-078`, T12 |
| T15 | P0 | Buyer offer lifecycle and concurrency | strongest/Grok High | D01, `DEC-078`, T14 |
| T16 | P0 | Non-payment/second-chance workflow | Grok High | D02/D03 |
| T17 | P0 | Data inventory, versioned acceptance, cookie choices and contact disclosure audit | Grok High | T14R, actual infrastructure/data map |
| T18 | P1 | `Покупки / Продажи` information architecture and complete history | Terra/Grok High | T04, T13–T16 |
| T19 | P1 | In-app notification center and event matrix | Grok High | D01–D03, T14–T16 |
| T20 | P0 | Complaints for Work/author/Order with attachments policy and status | Grok High | T14R, T17 |
| T21 | P1 | Text-only V1 «Сообщить об ошибке» | Terra | `DEC-078`, T14R |
| T22 | P1 | S3-compatible object storage migration, thumbnails/renditions and backup changes | Grok High | hosting decision/data map |
| T23 | P1 | Auth role freshness/session invalidation invariant | Terra + security | none |
| T24 | P1 | Lifecycle progress/alerts and one-replica enforcement | Grok High | T09, launch topology |
| T25 | P1 | Stable business error codes outside bids | Terra | flows T13–T21 known |
| T26 | P1 | Transactional email vs in-app delivery implementation | Terra | T14R, T19 |

Все P0 implementation tasks требуют independent Sol/security review. T14/T15/T16
нельзя объединять в один огромный commit.

## 7. DOCUMENT NORMALIZATION

| ID | Задача | Когда |
|---|---|---|
| T27 | Owner map: один claim → один owner; audits/baseline/old handoff historical | После T01/T14R и оставшихся decisions |
| T28 | Адаптировать public legal drafts под Беларусь и фактические flows; затем отдать весь комплект профильному юристу на финальную проверку | После T14R/T17 |
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
store auth, advanced fraud scoring, collections and expanded creator biography,
automatic diagnostic context preview and optional screenshot in error reports.

These remain documented ideas. They do not enter current schemas or redesign
controls unless the founder explicitly promotes one through a new decision.

## 11. Текущие blockers

Closed local testing is possible now. A public audience is blocked by:

1. T13R/T14R and decisions D01–D03;
2. T12–T21 core product/legal flows;
3. operator/hosting/processors and final public documents;
4. T22 media/backup plan selected for expected pilot volume;
5. T32–T37 Figma adaptation and acceptance;
6. T39–T44 release proof.
