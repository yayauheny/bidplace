# Bidplace staging

2026-11-06 — **Partial: prepared locally; not pushed, deployed or live verified.**
Owner of staging setup and acceptance. Decision: DEC-154. Production remains in
[CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md); variable definitions remain in
[ENVIRONMENT.md](ENVIRONMENT.md).

## Integration and provenance

One replacement PR from `feature/staging-refresh` to current `main` supersedes the
old split PRs [#47](https://github.com/yayauheny/bidplace/pull/47) and
[#48](https://github.com/yayauheny/bidplace/pull/48). Neither old PR was merged or
closed by this preparation. Register workflow and application together; default
branch stays `main`. No force-push to either old branch is required.

Inspected refs: main `dfa7d6bc34c24f7870f5cc1d116c70531aac1aef`, #47
`304bd7936cb0ede8ca5a90f246a1e3ce543e3cac`, #48
`130fba43c190fd163809cefa5b9c56d3cbde97d2`. Both old PRs are Draft, without
reviews or inline review threads. #47's old Verify passed; #48's old Verify
failed. Those results do not validate this adaptation. Moderation fix
[#102](https://github.com/yayauheny/bidplace/pull/102), `0e07484b`, has successful
[Verify](https://github.com/yayauheny/bidplace/actions/runs/42196968275).
Its integration into main must be rechecked before staging integration; this
branch does not copy or change its tests/runtime.

| #47/#48 area | Current main | Transfer |
| --- | --- | --- |
| #48 workflow (also in #47) | Absent | One workflow; main-only source, explicit branch + SHA approval, full Verify gate |
| Worker/Container/SPA and production release controls | Existing owners | Extend them; preserve production workflow and security protections |
| Health SHA + Docker build argument | Absent | Bake candidate SHA, expose it only in staging health and Worker version |
| Disabled mail / env / mail outcome | SMTP required; classifier moved to `antifraud/auth` | Skip SMTP only for staging; guaranteed rejection shared by auth and commerce outbox |
| Worker environment/router/Wrangler | Session/OTP, private tick, probe protections added since #47 | Retain those; add staging contract, strip Access headers; Cron explicitly empty |
| Deploy/config/migrate/image scripts | Production owners have evolved | Adapt staging helpers to current owners; retain production gates |
| Test accounts + authenticated smoke | Absent / older unauthenticated smoke | Non-reset provisioning; Worker + API exact SHA, Access denial, JSON and SPA checks |
| `products.mapper.spec.ts` adjustment | Main already evolved independently | Do not transplant the old unrelated test correction |
| Seed-contract test | Existing owner | Add only provisioning and migration guard cases; do not execute destructive seed |
| Product index/architecture/status/security/docs | Substantially newer | Compact current owner updates; do not copy historical blocks |
| Old staging DEC-119 | Main DEC-119 means Figma/Pen decision | Preserve main history; new explicit staging decision is DEC-154 |

Selected **durable fix**: adapt to main. **Acceptable workaround**: approve the
reviewed feature branch before merging. **Hack, rejected**: deploy October code,
replace production scripts wholesale, bypass checks or reset staging data.
Shared transport/config/release owners remain the extension points; no second
commerce or auth implementation is introduced. W6/W7 remain incomplete.

## Exact target and read-only provider evidence

- App: `https://staging.bid.place`, Worker `bidplace-staging`, one private Nest
  Container, Expo SPA. `workers.dev` and preview URLs disabled.
- Neon project `ancient-mode-04937403`, branch `br-divine-base-bavyjhcm`, endpoint
  `ep-snowy-fog-bacznby0`, database `neondb`; separate from production. Endpoint
  metadata confirmed pooling and idle state. A read-only query found no public
  tables on 2026-11-06. Recheck emptiness immediately before initialize.
- Private R2 `bidplace-staging-media-private`: no custom domain, r2.dev disabled.
  Public R2 `bidplace-staging-media-public`: `media-staging.bid.place`, active
  TLS/ownership, r2.dev disabled. Only synthetic/non-confidential images allowed.
- Cloudflare account `56b0c4b96497366c262447d2a18bf632`, zone
  `f10d49913e125d8b0d424018322aeb07`. Cache rule matches both media hosts,
  excludes all query parameters, respects origin browser/edge TTL. This is
  configuration evidence, not R2 upload/CDN hit/revoke/purge acceptance.
- Access app `83cec6e4-2094-42ea-9732-529da063e667`: only
  `work.evles@gmail.com`, 24h session, no preflight bypass. **No CI Service Auth
  policy exists.** Browser cookie/session and Safari remain unverified.
- GitHub `staging` Environment exists, branch policy permits main and the old
  portfolio release branch. It has no variables/secrets; repository variables
  are also empty (metadata/name-only reads). Secret values were never read.

## Operator settings — names and destinations, never values in chat

Repository Settings → Secrets and variables → Actions → **Variables**:

- `STAGING_DEPLOY_BRANCH`: the explicitly approved candidate branch.
- `STAGING_DEPLOY_SHA`: its reviewed full 40-character commit SHA. Change this
  approval explicitly for each candidate, including rollback; no fallback.

Settings → Environments → **staging → Variables**:

- `CLOUDFLARE_ACCOUNT_ID`, `STAGING_NEON_ENDPOINT_ID`, `TURNSTILE_SITE_KEY`.
- `SERVICE_RULES_OWNER`, `SERVICE_RULES_CONTACT`, `SERVICE_RULES_TEXT`.

Settings → Environments → **staging → Secrets**:

- `CLOUDFLARE_API_TOKEN` — deployment permission for staging Worker/Container;
  verify actual provider scope before first run. Account-wide deployment scope
  is a residual risk; repository checks do not constrain the token itself.
- `DATABASE_URL` (pooled), `NEON_DIRECT_URL` (direct), same approved staging
  endpoint, `neondb`, TLS required; staging-only database role.
- `SESSION_SECRET`, `OTP_HASH_SECRET`, `INTERNAL_TICK_SECRET`, `RELEASE_CONTROL`
  — independently generated staging secrets, each at least 32 characters.
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — object access only to both staging
  buckets. `CLOUDFLARE_CACHE_TOKEN` — purge permission on the zone; zone-level
  permission includes production, so media host checks remain essential.
- `TURNSTILE_SECRET_KEY` — separate widget for staging hostname; verify widget
  hostname and mode in provider console.
- `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` — staging CI service token.
- `STAGING_TEST_PASSWORD` — at least 12 characters; adding accounts never
  changes passwords of existing users.

Do not configure SMTP or Google/Telegram credentials for this acceptance scope.
Remove obsolete staging `JWT_SECRET` configuration if encountered; it is unused.
Move values directly from provider/password manager into GitHub, never via chat,
repo dotenv, artifacts or build arguments. Names above are all currently missing.

Cloudflare Zero Trust → Access application above: create/choose the staging CI
service token, then **Service Auth → Include that exact Service Token**. Never
Bypass or Any Valid Service Token. See [Cloudflare service-token guidance](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).
GitHub staging Environment: restrict workflow source to `main`, remove obsolete
release branch policy; configure required reviewer protection if available.
No provider or GitHub settings were changed during preparation.

## Deployment contract and approval boundary

Workflow is manual only and must first exist on default branch main. It validates
source main, approved candidate branch and exact approved SHA, membership in that
branch, and a successful full **Verify workspace** step for that SHA. Draft fast
checks and build-only success are insufficient. Only then does the isolated job
receive staging Environment secrets and checkout the validated SHA. Approval of
that branch/SHA means trust in its executable code. GitHub Environment branch
rules constrain the source workflow, not the candidate checkout.

Runtime secrets use a temporary JSON file outside checkout, mode 0600, removed
on exit. Build gates strip runtime, Access, account and deployment credentials;
image build arguments contain only release SHA. Web export disables dotenv,
uses public config, and scans text assets for synthetic credential canaries and
the opposite environment origin. Worker/API identity must both match candidate.
The explicit GitHub Deployment records candidate SHA with
`production_environment=false`; the automatic Environment entry can show the
source workflow SHA instead. A successful CLI exit alone is not live acceptance.

## Operations, migration and rollback

Before any external mutation/deploy, present and obtain owner approval for:
operation, exact target above, full candidate SHA, migration list/inventory,
backup location, rollback SHA/schema compatibility and permitted live writes.
Preparation does not authorize dispatch, merge, provider changes or seed.

1. Recheck current main and #102 integration; finish full CI on candidate SHA.
2. Operator fills missing settings and grants CI Service Auth.
3. **initialize**, only after explicit permission and empty-schema recheck:
   approved endpoint → empty public schema → no committable foreign sessions →
   checked-in Prisma migrations → test accounts. No production data copying.
4. **deploy**, same SHA: Access preflight for root, API and version paths → migration status → Cloudflare gates,
   staging web/image build → Worker+Container deployment → authenticated smoke.
   Deploy never applies migrations. Do not rerun initialize on a populated DB.
5. Later schema changes: review exact migrations + backup/inventory → **close**
   with current accepted SHA, preserve image and confirm API stopped → approve
   new candidate SHA → **migrate** → **deploy** that same new SHA. Separate
   workflow operations serialize without cancellation. Failure leaves API closed.
   The commerce replacement migration drops legacy sale tables: pending migration
   with existing sales or legacy handoff contacts is refused; do not bypass the guard or reset data.

**accounts** adds absent buyer/seller/admin accounts transactionally. Existing
password, role, ban, session version and content remain intact. Accounts are
`buyer@bidplace.test`, `seller@bidplace.test` (slug `vex`),
`admin@bidplace.test`. They have verified email and normal password/session auth;
`TEST_EMAIL_BYPASS=false`. Prepare author/work through ordinary UI/moderation.
All Bidplace mail is disabled at transport boundary, including outbox mail;
Cloudflare Access OTP is a separate infrastructure login. Disabled delivery is a
guaranteed reject, not a success or retryable SMTP outage.

Rollback is a **full Worker and image deploy** of a previous accepted SHA after
explicit SHA approval, only with a compatible schema. No automatic database
rollback, reset or destructive seed. First application deployment has no previous
accepted application SHA: stop/close the failed deployment; diagnose or forward
fix. A backup restore into a separate isolated database is a separate approved
operation and must include media consistency.

## Verification gaps

Cron is deliberately OFF (`TICK_CRON` empty, `triggers.crons=[]` even when a stale
caller value exists). Auction completion, periodic recovery, notification dispatch
and unattended progress are not accepted on this stand. Re-enable only in a
separate agreed test window; mail must remain disabled.

Remaining live checks: Access browser session and CI token, login/logout/session
invalidation and CSRF, owner/admin/stranger permissions, upload/source privacy,
publication/hide/revoke/recovery, CDN MISS/HIT and old URL with query variants,
commerce UI/state and receipt/share download, Chromium and real Safari/device
behavior. SMTP delivery/OTP/reset and Google/Telegram acceptance are outside this
scope. Do not run load tests, destructive suites, seed, or real-user transactions
against the stand. Synthetic live writes still require the separate permission
above. W6/W7 are not completed by local checks or a successful staging deploy.


## Local verification evidence (2026-11-06)

- Node 22.20.0, pnpm 11.7.0, Wrangler 4.147.0, Prisma 6.19.3; frozen install.
- API dependency build, API typecheck and lint without autofix: passed.
  API unit suite: 82 files, 1159 tests passed (expected negative-path diagnostics).
- Cloudflare typecheck/lint: passed; Worker tests: 52 passed; deployment script
  tests: 32 passed, including Access scope, isolated endpoint and migration guards.
- Ops: 39 passed, including executing workflow validation with rejected branch,
  SHA, approval and CI cases. YAML, bash and embedded JavaScript syntax passed;
  checked-in Wrangler config passes the installed package JSON schema.
- Disposable PostgreSQL: 2 provisioning/legacy-migration guard tests and 53
  auth-transport/internal-tick/notifications integration tests passed. Five seed
  cases were intentionally excluded; no destructive seed was executed.
- Staging and production Expo SPA exports passed origin/canary validation using
  the public Turnstile verification key, not real runtime credentials.
- Required `pnpm cloudflare:image:verify`: **failed before application build**.
  First attempt: Docker Hub EOF. Subsequent attempts: Debian security mirror
  returned HTTP 502 fetching `ca-certificates` (20250419~deb12u2). No image gate
  bypass, image identity/native-runtime success or container acceptance is claimed.
  Repeat that exact command in a network-working environment; full candidate
  Verify and image success are required before any staging deployment.
- Markdown links and `git diff --check`: passed. Focused independent review
  findings on Access scope and legacy contacts were fixed with regressions.

No push, new remote PR, provider mutation, migration, deployment or live test was
performed. A future Draft PR should report this image blocker explicitly; local
checks cannot replace full Verify for its exact candidate SHA.
