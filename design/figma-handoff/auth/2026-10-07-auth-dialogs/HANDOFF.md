# Auth design execution handoff

Prepared against release documentation HEAD
`844e43cd87150f0faf045d709ad6808cea372ddb`; this import is a later local commit.
Production runtime at preparation: `541d763547f7b021895daa3d533c3196c37a4e67`,
Worker `3afe08d5-b204-495c-8dcc-91d43e6af92b`. No runtime UI changes were made
while preparing this handoff. Revalidate the checkout before execution.

## Objective and success criteria

Replace full-page auth presentation with the supplied phone-sheet composition,
while preserving email/password auth, email verification and the current
single-use-link recovery flow. Keep email-code login and real OAuth out of scope.
Google/Telegram are honest UI placeholders. Preserve field errors, safe return
destinations, keyboard/focus, session ownership and duplicate-submit protection.
Provide a shared exit confirmation derived from the supplied component.

Success means source-node mapping and deliberate adaptations are reviewable,
the auth lifecycle still works locally, relevant checks pass and no protected
source, production data, credentials or infra is changed. A handoff import is
not evidence of implemented UI or complete 1:1 parity.

## Confirmed founder decisions

- Use supplied bottom-sheet auth designs; keep standard email/password login.
- Code screen design is for existing email verification, not passwordless login.
- Google/Telegram are placeholders; no OAuth adapters, credentials or endpoints.
- Registration keeps **«Имя» → `displayName`**. Author nickname/slug remains in
  the author application. Do not invent an account nickname or uniqueness rule.
- Keep existing forgot/reset link logic. The earlier generated-password idea
  and subsequent recovery-placeholder suggestion were superseded by the
  founder's latest instruction: preserve the working flow, update its design.
- Mask the middle of the user-entered email in recovery confirmation. Do not
  imply that masking proves delivery, hides account existence or replaces auth.
- Reuse the exit-confirmation design with copy appropriate to the operation.
- Import six packages into the current repository; source library stays read-only.
- Plan/import only in this preparation task; no product implementation/deploy.

## Verified current implementation

| Owner                                                                                                 | Current contract / gap                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/components/layout/AuthViewport.tsx`                                                  | `AppShell`, brand, scroll, full-page layout; no auth sheet                                                                                    |
| `apps/mobile/src/features/auth/auth-card.tsx`                                                         | title/description/content container, no modal lifecycle                                                                                       |
| `apps/mobile/src/features/auth/auth-form.tsx`                                                         | working login/register; registration name/email/optional phone/password; no repeat password/provider rows                                     |
| `apps/mobile/src/features/auth/schemas.ts`                                                            | existing field messages; repeat-password comparison currently belongs to reset form                                                           |
| `apps/mobile/src/features/auth/verify-email-form.tsx`                                                 | one six-digit field, request/verify locks, auto-request guard, refresh-session then safe redirect; no resend countdown                        |
| `apps/mobile/src/features/auth/forgot-password-form.tsx`                                              | neutral response: if an account exists, a reset link was requested                                                                            |
| `apps/mobile/src/features/auth/reset-password-form.tsx`                                               | token + user-chosen password, existing confirmation and invalid/expired-link handling                                                         |
| `apps/mobile/src/features/auth/auth-redirect.ts`                                                      | validated internal destination; excludes auth-route loops/external returns                                                                    |
| `apps/mobile/src/app/(auth)/*`, `src/app/verify-email.tsx`                                            | public auth deep links; verification still requires an authenticated session                                                                  |
| `apps/mobile/src/components/ui/AppDialog.tsx`, `app-dialog-layer.web.tsx`, `app-dialog-host-style.ts` | existing dialog/sheet, focus trap/return, Escape, backdrop and reduced-motion foundation; geometry/header is not this auth design             |
| `packages/contracts/src/user.ts`                                                                      | registration `displayName`, email, password; phone optional; no nickname/confirm-password fields                                              |
| `packages/api-client/src/auth.ts`                                                                     | all real auth/recovery endpoints; verification request currently returns only `{ ok: true }`                                                  |
| `apps/api/src/otp/otp.service.ts`, `otp.controller.ts`                                                | server cooldown `60s`, code TTL `5m`, five wrong-code attempts; user/IP limits; delivery failure deletes new code; no deadline/retry metadata |
| `apps/api/src/password-reset/password-reset.service.ts`                                               | neutral forgot response; hashed single-use link; reset atomically changes hash and increments `sessionVersion`; no generated-password mail    |

Read product auth/security/architecture owners and relevant design documents.
Account auth email never becomes a public author contact as a side effect.

## Approach and trade-offs

**Durable fix:** compose one shared auth sheet and one shared exit confirmation
from existing dialog/focus infrastructure; keep route screens thin and form/API
owners intact; map measured visual roles to semantic tokens/variants. Keep direct
auth URLs and validated `redirectTo`, with a separate validated public return
context for dismissal. Render the real underlying portfolio page, not export
artwork. Reuse existing router/overlay patterns after inspecting installed Expo
57 / expo-router 57 / dialog 1.5.2 APIs.

**Acceptable workaround, only if documented:** with the present `{ ok: true }`
OTP response, a UI timer can conservatively count 60 seconds from a confirmed
request response; it is not exact server remaining time. Reload/new-tab and
cooldown rejection cannot restore the precise server deadline from this contract.
Expose this limitation. If exact authoritative countdown needs metadata, propose
the smallest response/header addition separately; do not silently change backend
behavior or add polling in this design wave.

**Hack, rejected:** arbitrary timeout to remove races, timer on every render,
whole-screen image UI, fake OAuth success, author slug made into an account name,
generated password email, full-screen forms inside a nearly matching dialog,
or duplicated route-local tokens and modal implementations.

## Behavior and adaptations

1. Preserve `/login`, `/register`, `/verify-email`, `/forgot-password` and
   `/reset-password` deep links, reload and Back. Auth↔auth transitions share
   the shell and validated destination. Never show a protected page behind an
   unauthenticated dialog. Fresh deep links use a real safe public background,
   without manufacturing browser history or caching whole page screenshots.
2. Phone reference is `390×874`; preserve sheet radius `32`, white surface,
   handle, header, gaps and exact action/input variants in `STYLES.md`. Wider
   viewport and short/keyboard-open viewport are derived accessible adaptations.
   Use existing motion/reduced-motion, no new bounce, mint ring or success flash.
3. Registration first field stays «Имя». Optional phone may be omitted from this
   compact form: omitted/null remains valid and no stored phone is overwritten.
   Repeat password is UI-only, validated against `password`, never sent as a new
   API property. Eye controls toggle visibility accessibly without losing value,
   focus or selection. Do not trim or silently transform passwords.
4. Existing error mapping remains: local/remote field errors at their fields;
   credential mismatch/network/5xx as a neutral form error. No raw exceptions,
   password, OTP, token or private email in telemetry or failure copy.
5. Verification has six visual cells but one string value and one accessible
   code control. Support paste of all six digits, leading zero, normal typing,
   Backspace and `one-time-code` autofill. Confirm through the real existing API,
   refresh committed session and return once. No code-login flow or local bypass.
6. Countdown uses a deadline and current time rather than decrement assumptions;
   hidden tab/visibility return recalculates it. Cleanup timers and stale async
   callbacks on unmount/session change. A server reject overrides UI availability.
   A timer never proves inbox delivery or overrides request locks/limits. Do not
   auto-send again solely because a sheet remounted or the timer reached zero.
   Failures must remain truthful, not «Код отправлен» after a failed request.
7. Recovery continues to request a link. Result copy stays conditional:
   «Если аккаунт с email … существует, мы отправили ссылку для создания нового
   пароля». Mask only the entered address, deterministically, including short
   local parts; never obtain an email from a user-lookup endpoint. API success
   does not establish delivery. Preserve existing invalid/reused/expired reset,
   password confirmation and session revocation behavior. These screens are
   explicitly derived from the shell; no exact capture exists in this batch.
8. Provider rows use exact source slots. Activation shows «Вход через Google
   пока недоступен» / «Вход через Telegram пока недоступен», with no redirect,
   SMTP or login request. No fake authenticated state, no empty clickable handler.
9. Consent in the registration capture is a selected visual sample. Never
   preselect legal acceptance or equate the painted link with persisted consent.
   Verify existing legal destinations and versioned `getRules`/`acceptRules`
   contract before wiring. If required privacy/rules destinations or acceptance
   timing are absent, report the specific blocker; do not invent policy text,
   routes or silent API calls. Existing author/rules gates stay unchanged.
10. All supported user dismissals of an in-progress sheet go through the same
    shared confirmation: close/backdrop/Escape/route Back, and swipe only if
    actually supported by the existing sheet. Continue restores the form and
    focus; leave safely returns to the public context. An internal step change
    is not an exit. Do not invent drag thresholds just because a handle exists.
    Keep browser minimize/tab switch free of prompts; an OS/tab close cannot
    reliably show a custom modal. If dirty-page unload support already exists,
    retain its native behavior rather than claiming guaranteed interception.
11. During a mutation, dismissal must not pretend to cancel server work. Apply
    the existing pending policy/locks and ignore stale callbacks appropriately.
    Closing verification does not delete the account, log out or set
    `emailVerifiedAt`; a confirmed account remains saved. Copy must reflect this
    («Подтверждение можно пройти позже»). Never replace author save-and-exit
    semantics with a two-button discard dialog as an unrelated redesign.

## Fidelity blockers and boundaries

`STYLES.md` lists unresolved mixed text, Google asset, line-height and missing
states. Retrieve matching versioned Inspect/assets before claiming 1:1. Current
live Google button differs from pinned capture; do not silently use live button
geometry. Fix only the affected asset/range or ask for a replacement capture.
Screens can progress independently, but an unresolved source stays explicitly
blocked; approximate values are not recorded as measured tokens.

The two passwordless/OAuth references remain imported but not reachable flows.
No Neon Auth, Auth adapter, DB migration, user/role changes, SMTP/config changes,
new production environment, resources, dependency or increased spend.

## Proportionate verification

- Validate package checksums and exact root/surface/role IDs before code edits.
- Use targeted existing unit tests for changed schema/masking/deadline/dismissal
  logic. Group behavior cases; no separate test per CSS value or non-animation.
- Adapt `apps/mobile/e2e/auth-layout.spec.ts` to the new supported composition
  and remove obsolete assertions about full-page layout/optional phone. Do not
  remove auth/security coverage to make a redesign pass.
- Extend existing `auth-lifecycle.spec.ts` as needed for registration, actual
  local verification, login, reload and link reset. Add one compact dismissal/
  paste/placeholder flow only where existing tests cannot express it. Never
  capture synthetic or real secrets in screenshots/trace/report output. Disable
  trace and failure screenshots for those sensitive lifecycle cases with the
  existing Playwright per-spec `test.use` options. Visual captures use separate
  empty/invalid non-secret values, not a password, active OTP or reset URL.
- Run mobile + affected packages' typecheck, lint without autofix and unit tests,
  `pnpm build:web`, and targeted Chromium/WebKit auth tests:
  `pnpm --filter @bidplace/mobile exec playwright test e2e/auth-layout.spec.ts
e2e/auth-lifecycle.spec.ts --workers=1 --retries=0`.
- Visual QA at 390×874 with empty/synthetic non-secret inputs: login,
  registration, code, field error and exit panel; keyboard/focus, short height,
  200% zoom and wider viewport usability. Masked recovery default/result are
  derived states. Use matching crops, exact source metrics and reviewed images;
  do not compare the irrelevant artwork/status-bar background as auth parity.
- Keep existing focus/navigation/session guarantees and real field validation.
  Update obsolete tests coherently; no DOM frame scanners, fixed sleep, threshold
  change, retries increase, skip or new golden to conceal a mismatch.
- Use local test services only. Run relevant checks once after the final change;
  repeat only for a changed file/failure. Full unrelated portfolio/media gates
  are not required by this wave. Known Home Opening visual debt stays explicit.

## Copyable instruction for the execution window

```text
Работай в /Users/yayauheny/projects/bidplace. Сначала перечитай AGENTS.md,
product/design owners и текущий tracked checkout. Подготовительный пакет:
design/figma-handoff/auth/2026-10-07-auth-dialogs/README.md.
Прочитай HANDOFF.md, STYLES.md, catalog.json, NODE-MAP.json,
SOURCE-COMPARISON.json и нужные исходные nodes.json/reference PNG.
Убедись, что локальный import-коммит доступен; не начинай со старого
production SHA и не перезаписывай чужие изменения.

Реализуй auth-дизайн этой волной локально: общая нижняя шторка вместо
полноэкранного Login/Register/Verify, оформление действующих Forgot/Reset,
общий компонент подтверждения выхода. Логин только email/password.
Код — только подтверждение email. Google/Telegram — честные заглушки.
Имя аккаунта остаётся displayName; никнейм автора задаётся позже.
Восстановление по существующей одноразовой ссылке, с маскированным
введённым email на результате. Пароли письмом не генерировать и не слать.

Сопоставляй роли строго по NODE-MAP.json. Новые captures — scoped source
для этих узлов; старую библиотеку и Pen не менять. Не смешивать live
Google-кнопку с зафиксированным архивом. Измеренные значения и пропущенные
данные разделены в STYLES.md. Разрешённые отличия: «Имя» вместо nickname,
тексты email verification/выхода, исключённые commerce/OAuth/passwordless
потоки, безопасные реальные состояния. Missing asset/style/legal contract
не додумывать: указать конкретный blocker, остальной независимый scope
продолжить. Desktop/recovery без captures считать derived, не 1:1.

Перед edits назови affected owners, сравни durable fix / acceptable workaround
/ hack и выбери простой durable вариант. Переиспользуй dialog/focus,
field/error, router и session patterns. Shared tokens/primitives, thin screens.
Не переписывай auth, OTP policy, reset policy и серверные rules gates.
Таймер не должен создавать рассылку/опрос: честно учти отсутствие серверного
resendAt. Если точный server deadline требует API metadata, предложи
минимальное изменение отдельно, не внедряй другой auth flow.

Сохрани URL/deep link/reload/Back/validated redirectTo, pending locks,
refreshSession после verify, нейтральные ошибки и реальный link reset.
OTP paste/autofill/leading zeros, field errors и masked email доступны.
Выход — общий confirm; продолжение сохраняет значения и фокус. Ни один
close не обещает откат серверного запроса/удаление уже созданного аккаунта.
Без mint/green flash, второй обводки и speculative motion.

Проверки — раздел Proportionate verification: расширяй существующие тесты,
не создавай отдельную инфраструктуру или тест на каждую мелочь. Typecheck,
lint, unit, web build, targeted auth Chromium/WebKit и visual QA. Не менять
таймауты, retries, golden/threshold ради зелёного результата. Синтетические
секреты не должны попадать в trace/скриншоты/вывод; реальные не читать.

Обнови дизайн-систему/flows/status, product status и архитектуру только если
границы действительно изменились. Статус исходников отделяй от runtime.
Создай локальные коммиты в короткой feature/fix ветке. Без push/deploy,
production SQL/migrations, новых ресурсов/окружений, смены ролей и creds.
.env, .cursor/, старый trace.zip и credentials не читать/не включать.
В финале: SHA, source→component mapping, deliberate differences,
проверки, unresolved blockers и точный оставшийся scope.
```
