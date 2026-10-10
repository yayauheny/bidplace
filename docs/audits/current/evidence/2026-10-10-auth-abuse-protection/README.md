# Auth abuse protection — audit evidence (2026-10-10)

Branch: `feature/auth-abuse-protection`. Policy detail stays in
[`docs/product/13-APPLICATION-SECURITY.md`](../../../../product/13-APPLICATION-SECURITY.md)
(**DEC-109**); this folder is evidence and limits only.

## Automated checks (independently verified)

| Area | Result |
| --- | --- |
| API unit | **395** cases / **64** files + **42** env/config unit = **437** total (not a separate “42 auth-abuse unit” bucket) |
| PostgreSQL integration | **28** (`auth-abuse.integration.spec.ts`) |
| HTTP integration | **22** |
| Contracts tests | **41** |
| API client tests | **35** |
| Cloudflare config/scripts | **12** |
| Typecheck / build / targeted lint (affected graph) | **0** failures |
| Mobile unit | **709** / **120** files (includes **11** owner form-unit cases); `tsc`, ESLint, e2e database fence **0** with `EXPO_NO_DOTENV=1` on Node **22.23.3** |
| Web static export | Production web build embeds the configured API origin (root export verification) |

Optional full-package ESLint on `packages/contracts` is **not** claimed green: base `ee37e9d` still has known `import/no-duplicates` in `packages/contracts/src/admin.ts` (unchanged on this branch).

## Visual blank-form capture (root QA)

- **50** PNGs + manifest:
  [`forms/CAPTURE-MANIFEST.md`](forms/CAPTURE-MANIFEST.md) (manifest geometry unchanged).
- Chromium and WebKit × five surfaces × five viewports; contact sheet reviewed; sample full frames checked.
- Turnstile in captures is the **scripted test fixture** (geometric placeholder), not a live Cloudflare challenge.
- At **390×400**, frames show the scroll band in view; not every control is visible in one simultaneous frame.

## Browser matrix — `Implemented` (local loopback, scripted fixture)

Suite (`playwright.auth-abuse.config.ts`): **7** + **7** + **8** tests in
`auth-layout.spec.ts`, `auth-lifecycle.spec.ts`, and `auth-abuse.spec.ts` =
**22** definitions × **2** browsers = **44** passed (root final run). API env used
`TEST_EMAIL_BYPASS=false` so OTP/verification gates stay real.

Coverage includes five viewports, CSS zoom, keyboard, and resize. **6** wire tests in
`auth-cookie-proxy.unit.mjs`. **6** accepted cookie-proxy cases (**3** held-response
tests × both engines): withheld **2xx** + `hasSetCookie`, `/api/auth/me`, reload, same
document, no manual **Continue**.

Durable e2e gating (not production behavior): register password visibility runs after
`expectTurnstileReady` with the local Turnstile fixture; register nickname Turnstile
evidence is captured at initial stable **390×874** before resize/zoom. No extra
retries, timeout inflation, assertion relaxation, or production toggle changes.

Portable reproduction:
[`apps/mobile/e2e/README.md`](../../../../../apps/mobile/e2e/README.md),
`apps/mobile/playwright.auth-abuse.config.ts`,
`apps/mobile/e2e/support/auth-cookie-proxy.mjs`.

Login post-redirect continuation is automatic in app code; independent security review
found no correctness defect in that path.

## Out of scope for this folder

Native Turnstile, live Cloudflare Siteverify, real SMTP mailboxes, edge WAF, and
production rollout of additive migrations
`20261010010000_auth_abuse_protection` / `20261010100000_auth_abuse_legacy_import`
remain separate operator verification (see project status).
