# Auth abuse blank-form visual evidence (2026-10-10)

Captured by `/private/tmp/bidplace-auth-abuse-browser/visual-evidence/run-capture.mjs`
against Expo `http://127.0.0.1:50172` and API `http://127.0.0.1:50181`
(schema `auth_browser_root_20261010_v1` on root stack).

| Item | Value |
| --- | --- |
| PNG count | 50 (Chromium + WebKit × 5 surfaces × 5 viewports) |
| Turnstile | Scripted test fixture only (`installTurnstileFixture` pass); no production mock flags |
| Service rules | Synthetic `GET /api/auth/rules` stub for registration steps only |
| verify-email session | **API-register-session-only** — `POST /api/auth/register` with scripted `pass:register:localhost:*` proof; no DOM password, no mailbox |
| Doc IPs | Chromium `203.0.113.42`, WebKit `203.0.113.43` (`X-Forwarded-For`) |
| Page errors | None (asserted empty) |
| Horizontal overflow | Asserted false at each viewport before screenshot |

Surfaces: `login`, `register-email`, `register-password` (empty password fields),
`recovery`, `verify-email` (empty code, send not triggered).

Viewports: 390×874, 375×667, 440×956, 1280×720, 390×400.

Naming: `<engine>-<surface>-<W>x<H>.png`.
