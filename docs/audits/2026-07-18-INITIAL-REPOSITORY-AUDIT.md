# bidplace — initial repository audit

Дата: 2026-07-18

Тип: Historical snapshot; не канонический источник текущего статуса

## 1. Executive summary

Репозиторий содержит рабочее серверное ядро timed auction: транзакционные ставки, server-time validation, scheduled lifecycle, идемпотентное закрытие, reserve logic и детерминированный winner. Unit/contract/integration checks подтверждают эти узкие свойства.

Первый technical rehearsal и реальная сделка пока заблокированы. Главные пробелы: bid idempotency и audit, client realtime/reconnect, 10-user rehearsal, воспроизводимый seed, phone verification, ручная moderation, полная карточка ценности, own participation status, privacy-safe handoff/sale confirmation и pilot analytics. UI имеет полезные primitives, но утверждённые Figma/brand/design QA не найдены; одновременно существуют конкурирующие auction/storefront presentations.

Код не использовался для переписывания продукта. При конфликте ожидание взято из канонических product docs, фактическое поведение — из репозитория.

## 2. Что было изучено

- root/mobile agent instructions, root README и workspace/package configuration;
- все `docs/product/*.md`, research rules и все raw research files;
- `apps/api`: modules, auth/guards, sellers, lots/images, auctions/bids/lifecycle, realtime, admin, core config/errors/security;
- `apps/mobile`: all routes, feature screens/hooks/forms, auction/ui/layout/storefront components, theme;
- `packages/contracts`, `api-client`, `database` schema/migrations/seed, `design-tokens`, config and tooling;
- unit, contract, integration and mobile test inventory;
- Docker/local config and evidence of CI/deployment/observability/backups;
- working tree, включая незакоммиченные UI-файлы; `.env` и secrets не читались.

## 3. Фактическая архитектура

TypeScript monorepo на pnpm 11/Turborepo, Node 22+. `apps/api` — NestJS 10 HTTP API, scheduler and Socket.IO; `apps/mobile` — Expo Router 57/React Native 0.86 для web/iOS/Android. Shared Zod contracts проходят через `packages/contracts` и typed `api-client`. PostgreSQL/Prisma владеют persistent state.

```text
Expo client → typed HTTP API → Nest services → Prisma → PostgreSQL
     ↑                Socket.IO events ← post-commit publisher
seller/admin screens                lifecycle scheduler (inside API process)
```

Persisted entities: `User`, `SellerProfile`, `Category`, `Lot`, `LotImage`, `Auction`, `Bid`. Verification, moderation review, append-only audit, participation, handoff, sale confirmation and analytics entities отсутствуют. Images хранятся бинарно в PostgreSQL. Public API использует `/api`; auth поддерживает HttpOnly cookie or bearer token.

## 4. MVP feature matrix

| Area                  | Expected                                                | Actual / path                                                           | Status               | Evidence                           | Impact / recommended correction               |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------- | ---------------------------------- | --------------------------------------------- |
| Closed onboarding     | invitation + admin-verified seller                      | self-created active profile, `sellers.service.ts`                       | Partial/inconsistent | seller unit                        | Pilot blocker; add manual review state        |
| Value-rich lot        | provenance/content fields, ≥3 images                    | basic lot fields; image subsystem strong                                | Partial              | lot/image unit + integration       | Pilot blocker; completeness gate              |
| Scheduled BYN auction | reviewed preview, server dates, hidden optional reserve | dates work; seller self-publishes, USD default, public required reserve | Partial/inconsistent | auction/lifecycle tests            | Align contracts/UI, add moderation            |
| Manual bid            | verified phone, idempotent atomic bid                   | atomic serializable service; no phone/idempotency/audit                 | Partial/unsafe       | concurrent integration             | Technical blocker                             |
| Bid history           | durable public aliases, no identity                     | durable bids, no public user ID, no alias                               | Partial              | contract/service tests             | Privacy/clarity blocker                       |
| Realtime              | live update plus snapshot recovery                      | backend events only                                                     | Partial              | event tests                        | Technical/UX blocker                          |
| Close/winner          | DB truth, no post-end bids, idempotent close            | implemented with deterministic tie-break                                | Implemented narrow   | race/reserve/duplicate-close tests | Deployment/audit evidence still missing       |
| Participation         | winning/outbid/won/lost and next action                 | absent                                                                  | Not implemented      | —                                  | UX blocker                                    |
| Handoff/refusal/sale  | privacy-safe contacts and recorded outcome              | absent                                                                  | Not implemented      | —                                  | Real-sale blocker                             |
| Admin                 | seller/lot review, publish, investigation, refusal      | list/ban/hide/bids only                                                 | Partial              | admin unit                         | Operations/integrity blocker                  |
| Analytics             | minimal pilot funnel/results                            | absent                                                                  | Not implemented      | —                                  | Validation blocker                            |
| Future formats        | not in MVP                                              | no full fixed/drop/payment flow; premature buy-now field                | Mostly correct       | source audit                       | Remove inconsistency later; do not expand MVP |

## 5. Design readiness matrix

| Flow                     | Current evidence                                  | Status                              | Critical gap                                           |
| ------------------------ | ------------------------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| Public direct-link entry | auction detail plus uncommitted storefront routes | Needs redesign                      | competing routes, reserve leak, incomplete value story |
| Auth                     | forms and feedback states                         | Implemented without approved design | no OTP/return-to-bid/E2E                               |
| Bid                      | panel, timer, history                             | Needs redesign                      | confirmation, alias, own status, reconnect             |
| Seller                   | dashboard/profile/lot/auction forms               | Needs redesign                      | moderation/value fields/BYN/handoff                    |
| Admin                    | dashboard list/ban/hide                           | Needs redesign                      | review queues, confirmations, audit/investigation      |
| Shared system            | tokens, Tamagui themes, UI primitives             | Needs verification                  | no approved brand, component roles or accessibility QA |
| Post-auction             | no route/component                                | Not started                         | entire winner/loser/handoff/sale flow                  |

No approved Figma URL, design assets or completed design-QA record was found.

## 6. Pilot blockers

Technical rehearsal blockers:

1. Idempotency for client retries and append-only bid/close/admin audit.
2. Client Socket.IO subscription, event gap/reconnect snapshot and stale-state UI.
3. Confirmed scheduler deployment invariant.
4. Hidden reserve removed from public contract/UI.
5. Reproducible BYN seed and reset.
6. Target-session E2E and 10-user near-simultaneous rehearsal including refresh/reconnect.
7. Automated PII/public-payload regression tests.

Real-sale blockers additionally include manual verification/moderation, phone OTP, complete lot/photos, participation results, contact handoff/refusal/sale confirmation, analytics, rules/privacy/legal operations, monitoring and recovery.

## 7. Несоответствия кода и MVP RFC

| RFC expectation                   | Fact                                                        | Path                      | Impact                           | Recommended correction (not implemented)                   |
| --------------------------------- | ----------------------------------------------------------- | ------------------------- | -------------------------------- | ---------------------------------------------------------- |
| invited verified seller           | profile becomes active automatically                        | sellers service/model     | uncurated marketplace            | explicit pending/approved review                           |
| pending review before publication | seller publishes directly                                   | auctions service          | unsafe pilot content             | moderation transition and preview                          |
| canonical auction/result states   | `draft/scheduled/active/ended/sold/cancelled/failed/hidden` | Prisma/contracts          | ambiguous flow/handoff           | align state machine with migration plan                    |
| verified phone before first bid   | string only                                                 | User/auth/mobile          | abuse/integrity gap              | OTP state and gate                                         |
| optional hidden reserve           | required public field and UI                                | contracts/API/details     | trust and seller privacy issue   | private persistence/admin view, public derived signal only |
| idempotent bid request            | no idempotency key/index                                    | bid input/service         | duplicate retry risk             | persistent unique request key                              |
| BYN                               | auction form defaults USD                                   | seller form               | wrong pilot currency             | BYN-only validation/UI                                     |
| complete value/provenance fields  | minimal lot schema                                          | lot contracts/Prisma/form | cannot explain value or moderate | add only RFC fields                                        |
| minimum three images              | lot can proceed without them                                | images/lot/publish        | weak/unsafe card                 | publication completeness gate                              |
| bidder aliases                    | public history has no alias                                 | bid mapper/UI             | unclear transparency             | stable auction-scoped alias                                |
| client realtime recovery          | backend emit only                                           | core realtime/mobile      | stale auction state              | snapshot-first reconnect                                   |
| participation/handoff/sale        | missing                                                     | no model/API/UI           | flow cannot conclude             | implement after operations decision                        |
| manual admin operation            | list/ban/hide only                                          | admin module/UI           | no approval/investigation        | pilot-specific queues and audit                            |

## 8. Несоответствия UI и user flows

- `/auctions/[slug]` and `/product/[id]` compete as auction detail owners.
- Home/catalog may fall back to demo inventory and uses generic lifestyle/product language.
- Public auction detail explicitly displays reserve.
- Bid history shows bid status instead of required public alias.
- Login/register do not continue through verification back to the intended bid.
- No own winning/outbid/result state or reconnect indicator.
- Seller flow uses incomplete lot fields, USD default and buy-now terminology.
- Seller/admin screens mix Russian with internal English language.
- Admin destructive actions lack documented confirmation/audit feedback.
- No post-auction screens; loading/empty/error primitives exist, but offline/stale/realtime recovery is missing.

## 9. Security and auction-integrity risks

| Risk                      | Existing control                                  | Gap                                            | Severity         |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------- | ---------------- |
| Concurrent bid corruption | serializable transaction, compare/update, retry   | no idempotency                                 | High             |
| Post-end bid              | server-time checks and close race tests           | deployment rehearsal absent                    | Medium           |
| Wrong winner/double close | DB selection, status predicate, integration tests | no durable close audit                         | High             |
| Shill/abuse investigation | self-bid ban, persistent bids                     | no verified phone, device/IP/audit case trail  | High             |
| Privacy leak              | public bid/event shapes omit direct identity      | reserve leak, no automated broad privacy suite | High             |
| Admin misuse              | admin guard                                       | no reason/confirmation/append-only audit       | High             |
| Distributed abuse         | in-memory rate limit                              | not shared across instances                    | Medium           |
| Stale client              | HTTP source of truth                              | no version/gap/reconnect UX                    | High for pilot   |
| Media abuse               | signature/MIME/decode/size/access controls        | moderation/capacity monitoring absent          | Medium           |
| Recovery failure          | local PostgreSQL works                            | backup/restore/incident evidence absent        | High operational |

## 10. Архитектурные ограничения

- Scheduler runs inside API process; horizontal deployment needs explicit coordination.
- Socket events are unversioned acceleration, not a recoverable stream.
- In-memory rate limiting is instance-local.
- DB image storage is acceptable for a narrow pilot but couples media capacity and database operations.
- Auction statuses and public/shared contract leak current implementation constraints into clients.
- `Auction` remains suitable for timed auction; it should not be generalized to `Sale` before additional formats exist.
- Future payments require separate Order/Payment/Ledger/Payout/Refund/Delivery boundaries; current schema does not block adding them.
- Seller kind/provenance extension points are conceptual only; current enum/model does not yet fully represent verified public people or authorised representatives.

## 11. Технический долг

- stale seed with removed `Lot.images`, legacy statuses and USD;
- no CI/deployment manifests, observability or recovery docs;
- no full browser/native E2E or 10-user harness;
- no audit/analytics persistence;
- duplicate UI primitives and domain presentations;
- hard-coded visual values alongside tokens;
- three existing mobile lint errors in user working-tree UI;
- no visual regression/accessibility test suite;
- README previously described non-existent local/S3 image abstraction (corrected by this task).

## 12. Неизвестные данные

- first seller/item and their eligibility evidence;
- actual pilot start price, reserve and duration;
- legal status, accepted terms and personal-data process in Belarus;
- payment, contact release, pickup/delivery and refusal playbook;
- production topology, hosting, secrets process, monitoring, backup/restore;
- target devices/browsers/network and native cookie persistence;
- approved brand/Figma/assets/photo standard;
- traffic/announcement/ad plan and interview owner;
- whether uncommitted storefront work is intended direction or experiment.

## 13. Рекомендуемый порядок исправлений

1. Freeze canonical product/detail flow and resolve public reserve/privacy contract.
2. Make rehearsal reproducible: BYN seed, auth E2E, scheduler topology.
3. Add bid idempotency, durable audit and privacy regression tests.
4. Implement client snapshot/realtime/reconnect and run controlled 10-user rehearsal.
5. Add manual seller/lot/auction review plus complete value/image gates.
6. Add phone verification and participation states.
7. Implement privacy-safe handoff, refusal and sale confirmation.
8. Add minimal analytics and operational/legal/incident readiness.
9. Run mobile-web/accessibility/design QA on the end-to-end pilot flow.

Это порядок рекомендаций, не выполненная реализация.

## 14. Вопросы основателю

1. Кто первый seller и какой конкретно item идёт в пилот?
2. Какие start price, hidden reserve and duration утверждены?
3. Какая из public presentations является целевой: auction detail или storefront product detail?
4. Должно ли premature `buyNowPrice` исчезнуть из MVP contracts/UI?
5. Как сопоставить технический `influencer` с продуктовым `PUBLIC_PERSON`?
6. Какой privacy/contact handoff, refusal deadline and next-bidder process допустим?
7. Кто владеет payment, delivery, incident and interview manual operations?
8. Какие pilot devices/browsers and accessibility level обязательны?
9. Есть ли назначенный дизайнер, Figma and approved brand/photo assets?
10. Каковы production hosting/topology and backup/restore expectations?

## 15. Документы, обновлённые аудитом

- `AGENTS.md` — added permanent design documentation workflow.
- `README.md` — corrected architecture/docs navigation and current next step.
- `docs/product/00-PROJECT-INDEX.md` — added design/audit navigation and renamed architecture owner.
- `docs/product/10-CODE-ARCHITECTURE.md` — renamed via Git and limited to factual architecture.
- `docs/product/11-PROJECT-STATUS.md` — current canonical function/readiness/blocker snapshot.
- `docs/design/00-DESIGN-INDEX.md` through `05-DESIGN-HANDOFF.md` — new design owner set.

`docs/product/12-DECISION-LOG.md` was not changed: the audit did not make a new founder decision, and existing technical facts are already documented in architecture/status. Protected product docs and `docs/research/raw/*` were not changed.
