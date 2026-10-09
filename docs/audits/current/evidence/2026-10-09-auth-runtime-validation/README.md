# Auth runtime validation — 2026-10-09

Base: `c375bb146ba512d36db0ed4456d0a279c16c3340`.
Branch: `fix/auth-runtime-validation`. Status: **Partial**.

Causes and changed owners:

- `AuthPasswordField`: web ref is a DOM input, not the native imperative API.
  RN-web 0.21.2 has selection restoration on `secureTextEntry`, but explicit
  focus restoration also requires preserving the captured selection. Web uses
  `setSelectionRange`; native retains `setSelection`. No suppression/catch.
- `app-dialog-layer.web.tsx`: full-width inner block omitted host flex alignment.
  The shared inner host now inherits that alignment; no route offsets.
- `AppDialog.tsx`: viewport-based 38/40 title exceeded the 366px surface.
  Existing section typography now shrinks/wraps within the header beside close.
- `BidplaceBrand.tsx`: decorative SVG accessibility props depend on platform.
- Contracts `user.ts`, auth form/availability hook, API controller and api-client:
  separate new write schema (3–20) from stored read schema (1–120). No DB change.
- `auth-form.tsx`: only unauthorized login errors show «Неверная почта или пароль».
  API → client classification → AuthProvider → form otherwise stays unchanged.
- Existing specs extended; old seller-create fixture no longer sends `slug`,
  and category observer tests mock the current `SvgXml` brand export.

Verification:

| Check | Actual result |
| --- | --- |
| API full unit suite | 59 files, 409 passed |
| Mobile full unit suite | 114 files, 625 passed |
| Contracts / api-client suites | 39 / 31 passed |
| Affected dependency graph typecheck / lint | Passed; no autofix |
| API build | Passed |
| Expo web export, dotenv disabled | `entry-a18d4439d9963e26e890e575e875b453.js` |
| Three auth-layout scenarios × Chromium/WebKit, workers=1, retries=0 | 6 passed, 35s |
| Real localhost:3001 health ready / unknown-email login | 200 / 500 |
| Read-only test DB slug lookup | Prisma P2022, `users.slug` |
| Complete auth-layout/history + auth-lifecycle gate | Not run: incompatible local schema; preparation would reset/migrate |
| Native runtime | Not run |

The browser run used the existing localhost:8081, with a temporary config
outside the repository that had no `webServer`/DB preparation. Registration
layout uses synthetic rules/availability and never submits account creation.
Reset uses a synthetic token without submitting a reset. Login 401/429/500
UI cases use synthetic responses; they do not prove real API credential behavior.
The real unknown-email request uses synthetic input. No account credentials or
env files were read. Database names/column metadata were inspected read-only.
Unit tests preserve consent/session/one-register ownership and reject 2/21/121
character writes while accepting historical reads.

Screenshots include Chromium/WebKit policy at 1280×720 and 375×667,
exit at 390×400, registration/reset password at 390×400, and an in-app live
policy image. All entered data is synthetic; password screenshots are masked.

Maintenance: fixes live in existing shared components and the contracts package.
Future writers reuse `newAccountSlugSchema`; response readers keep the wider
stored contract. No new helper module, token system, dependency or migration.
The existing User.slug migration/release compatibility requirement remains.
Policy is still «Документ готовится»; Google/Telegram OAuth remain unavailable.
No push, deploy, reset or migration was performed. Protected `.pen` is untouched.
