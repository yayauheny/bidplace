# bidplace — готовность первого portfolio MVP

Дата среза: 2026-09-09
Product contract: [`docs/product/05-MVP-RFC.md`](../product/05-MVP-RFC.md)
Active work: [`00-FIRST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md)
Deferred work: [`99-POST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md)
Session retrospective (unfinished P0–P2 → visitor reuse → review findings):
[`2026-09-09-profile-revision-media-session.md`](2026-09-09-profile-revision-media-session.md)

## Итог

Scope первого запуска остаётся публичное портфолио без сделок. Backend/API P0–P2
для published-only проекций, hide/unhide, RFC-minimal Work и fail-closed legacy
commerce reads закрыты в коде и покрыты API unit/integration. Пакет 07 (Figma/UI),
юрист Беларуси, production providers и staging **не** закрыты.

## F01–F10 vs текущий код

| ID | Состояние | Доказательство |
|---|---|---|
| F01 | `Implemented` для public commerce **reads** `GET /api/products`, `GET /api/products/:publicId`, `GET /api/discovery/home`, `GET /api/sellers`, `GET /api/sellers/:slug/detail`, `GET /api/me/activity` (`CommerceEnabledGuard`, default `COMMERCE_ENABLED=false`). Commerce mutations already gated. | `products.controller.ts`, `discovery.controller.ts`, `sellers.controller.ts`, `activity.controller.ts`, `commerce-disabled-reads.integration.spec.ts` |
| F02 | `Implemented` для revision/moderation/hide: public = `publishedRevision`; owner gallery forks editing revision; `APPROVED` ↔ `ARCHIVED`. | `product-revision-write.ts`, `admin-moderation.service.ts`, `portfolio-published-revision.integration.spec.ts` |
| F03 | `Partial`: `ImageStore` + local MinIO in Compose; Postgres fail-closed for new revision/achievement keys; restore checksum of existing BYTEA rows is `NoSuchKey` until backfill. Production S3 unselected. | `postgres-image-store.ts`, `docker-compose.yml`, `docs/ops/00-RELEASE-AND-BACKUP.md` |
| F04 | `Partial`: security preflight and legal drafts exist; operator/provider/country/cookie inventory still external. | `11-EXTERNAL-BLOCKERS.md` |
| F05 | `Partial` (prior wave): bearer guards refresh role/status/sessionVersion; not re-audited in this closure. | `apps/api/src/auth` |
| F06 | `Partial`: evidence review docs exist; lawyer/staging not closed. | `13-APPLICATION-SECURITY.md` |
| F07 | `Partial`: URL preflight reports legacy public URL counts; no rewrite. | `scripts/ops/url-preflight.mjs` |
| F08 | `Implemented` for required submit fields, revision photo/achievements, public photo = published pointer, owner photo preview. Mobile application form now includes city. Figma onboarding is package 07. | `sellers.service.ts`, `seller-profile-steps.tsx` |
| F09 | `Partial`: RFC-minimal create/submit/hide API and cabinet list exist; owner mobile wizard is still the older sale-oriented draft screen. | `products.service.ts`, `product-draft-screen.tsx` |
| F10 | `Implemented` for portfolio Home/Works/Authors JSON and visitor Work/Author **detail** on existing `/product/:publicId` and `/seller/:slug` (portfolio APIs, commerce chrome hidden). Redirect aliases exist for RFC `sharePath`. | `packages/contracts/src/portfolio.ts`, `product-screen.tsx`, `public-seller-screen.tsx` |

## Что уже закрыто и используется

| Область | Состояние |
|---|---|
| Product write atomicity | Реализован общий Product row-lock invariant; PostgreSQL race coverage существует (86 integration tests). |
| Auth/security baseline | Email/password, verification/recovery, fail-closed production config, upload authorization/limits и admin emergency paths существуют; остаточные проверки ниже. |
| Author/Work foundations | Seller application, ProductRevision/SellerProfileRevision, public portfolio discovery, hide/unhide, RFC-minimal Work. |
| Public discovery | Portfolio Home/Works/Authors/Search JSON без Listing; legacy commerce Home/products 404 при default config. |
| Design | Creator-first Figma остаётся read-only. Пакет 07 не начат. `.pen` не менялся. |
| Research | Marketplace/abuse/legal UX сохранены для второй волны. |
| Test data | Business rows disposable (`DEC-081`). |

## Что блокирует публичный portfolio launch

1. **Figma / package 07:** mobile-first screens and required states are not the Pen v2 / Figma cutover. Visitor Work/Author already reuse `/product/:publicId` and `/seller/:slug` on portfolio APIs.
2. **Media ops:** production S3 provider unselected; local restore checksum needs backfill of existing PostgreSQL bytes.
3. **Auth/legal UX:** email/password path exists; registration/cookie controls and Belarus lawyer answers are unfinished.
4. **Security residuals:** dependency evidence and deployed cookie inventory remain launch gates.
5. **Operations:** staging TLS, email, migrations, observability and real-content checks are not proven on a public environment.

## Что не блокирует First MVP

- offer expiry/revoke/counteroffer;
- non-payment, second chance и handoff statuses;
- seller sales history и auction scheduler starvation;
- auction/fixed/offer legal copy;
- orders, purchase/sales cabinet and critical commerce notifications;
- chat, reviews, ratings, likes, wishlist, notification center;
- photo/text process story, AI, subscription, payments, delivery, quantity and
  internationalization.

Всё перечисленное сохранено во втором backlog; ничего не объявлено отменённым.

## Рекомендуемый технический способ отключения commerce

Durable-вариант — server-authoritative capability, default `false`:

- client navigation/routes/actions не экспонируют commerce;
- API mutations и чувствительные reads проверяют capability;
- jobs/scheduler не создают commerce outcomes;
- public discovery исключает commerce-only поля и тестовые listings;
- commerce tests явно включают capability;
- существующие modules/migrations/tests остаются в Git.

Долгоживущая отдельная ветка хуже: она перестаёт получать общие auth/media/security
исправления. Новая feature branch нужна только на время будущей реализации commerce v2.

## Порядок закрытия

1. Review and fast-forward `feature/profile-revision-media` into `main` if accepted.
2. Package 07 (Figma/UI) only after that explicit design task.
3. Lawyer pack, production providers, staging restore/backfill, then F15.

## Проверка этого обновления

Код и API/mobile checks listed in [`11-PROJECT-STATUS.md`](../product/11-PROJECT-STATUS.md)
were rerun on 2026-09-09. RFC and protected product docs were not rewritten.
`.pen` is not in the diff.
