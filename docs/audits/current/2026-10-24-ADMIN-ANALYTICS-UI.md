# Administrative analytics UI — 2026-10-24

Status: Partial, mobile/adaptive acceptance passed; all local graph checks/builds passed; remote CI and physical hardware acceptance pending.
Base: `feature/analytics-foundation@0ead324b` (#63). Independent branch
`feature/admin-analytics-ui`; shared administrative navigation belongs to #64,
based separately on #62. No merge/deploy/production collection enablement.

## Scope and ownership

Success: one mobile-friendly foundation dashboard, UTC periods/custom dates, one
selected daily series, separate operational registrations and proven cohort
conversion, explicit server permission/client collector/coverage/unknown states.
Durable fix: extend existing protected read behind `includeActivity=true`; legacy
strict response stays unchanged. Rejected workaround: per-day extra requests or
reuse semantically different overview. Rejected hack: infer enabled from counts.
No outstanding product decision; founder approved minimal API extension.

Controller supplies actual server `ANALYTICS_WEB_ENABLED`; client build flag is
shown separately. Current response can contain historical observations even when
collection is off. Growth reuses PostgreSQL version/environment/UTC bounds and
counts distinct session IDs per active day. Period sessions remain distinct across
the whole interval, so crossing-midnight daily sums can differ. API client passes
AbortSignal; changing periods cannot display old period data as new.

Reuses FormPageShell/AppShell, Safe Area/dock reserve, FigmaTabs, TextField,
FormSection, PaddedGrid, existing buttons, typography/tokens and infrastructure
states. react-native-svg15.15.4 was installed already. Feature-owned line view
shows one series, measured width, zero baseline, maximum and exact selected day;
no mixed-unit stacks or chart library. Browser identity is labelled as browsers,
not people. First authors/works mean first publication; current moderation and
unknown waiting time are separate from period growth. Legacy v1 excluded.

No new service, endpoint, table, migration, role, dependency or design system.
Default API omits new fields; missing optional fields show explicit unavailable status rather than false/off/zero
substitution. Deploy the API extension before this UI; older strict query parsers
reject includeActivity. No hidden compatibility retry is introduced. Shared dock
is not duplicated in this independent PR; after #64 it links to the same existing
`/analytics` route. Exact new/desktop admin Figma composition is absent; approved
Bidplace primitives reused, desktop exact parity remains NEEDS-FIGMA.

## Staged review and checks

Independent source review: no substantial blockers in compatibility, UTC/session
semantics, permissions and metric truthfulness. Independent mobile screenshot
review320/390: no UX blockers; horizontal metric/day tabs reuse existing behavior.
Reviewer did not run runtime, physical keyboard/screen reader or exact Figma parity.

PostgreSQL owner19 pass (including shared midnight session and non-UTC DB timezone);
API-client49 pass; UTC/custom-period11 pass; full graph typecheck passes.
Mobile browser acceptance, adaptive stage and full graph checks follow.

Physical iOS/Android, real keyboard/text scaling, live collection/CDN and deployment
remain Needs verification; no claim of hardware or production acceptance.

Final mobile repeat6/6 and subsequent adaptive/mobile acceptance8/8 passed in
Chromium/WebKit: actual protected read,401/403,320/360/390/430, invalid/custom UTC
dates, one metric, no observations, unavailable metadata, retry, long source and
768/1024/1440→390 resize with preserved date/metric. The initial WebKit date case
failed while Metro source changed; same assertions passed with frozen files. No
assertions, timeouts or retries were relaxed.

Independent adaptive review found no substantial issues (source and Chromium
1024/1440 screenshots; runtime/WebKit reviewed through parent acceptance only).
Full API unit470, mobile1047 and contracts47 pass; client49 and owner integration19
pass. Exact final graph/build/integration/CI results are recorded in PR.

Evidence: [mobile overview](../evidence/2026-10-24-admin-analytics/overview-chromium-390.png),
[320](../evidence/2026-10-24-admin-analytics/overview-chromium-320.png),
[growth](../evidence/2026-10-24-admin-analytics/growth-chromium-390.png),
[empty](../evidence/2026-10-24-admin-analytics/empty-chromium-390.png),
[error](../evidence/2026-10-24-admin-analytics/error-chromium-390.png),
[desktop](../evidence/2026-10-24-admin-analytics/adaptive-overview-chromium-1440.png).
All browser variants also remain in `/private/tmp/bidplace-analytics-ui-evidence`.

Final local graph: typecheck/lint (zero warnings),247 integration pass/29 existing
skips, API470/mobile1047/contracts47/client49/config8/database1 unit checks, ops31,
E2E fence, all-platform build/export and docs links passed. No failing required
local check remains. CI belongs to the exact published HEAD and is recorded in PR.

Accessibility follow-up: period, selected metric and selected day now link to real
labelled panels using the existing public Work/author pattern. Browser acceptance
checks selected-tab associations and keyboard ArrowRight/ArrowLeft. No visual or
metric behavior change.
