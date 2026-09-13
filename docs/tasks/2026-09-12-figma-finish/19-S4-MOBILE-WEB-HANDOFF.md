# S4 handoff — auth forms and final gate

Status: completed as mobile-web UI; registration completion remains `Partial`
because the confirmed runtime redirects immediately.

## Current scope

Founder decision: accept **mobile web at 390 px only**. Do not spend time on
Android, iOS, 1024, or 1440. Do not touch auth/API schemas, auth behavior,
seed data, Figma handoff, or `.pen` files.

The hard public-screen work is committed:

- `72429bd` — H2 and S8;
- `8fdbf0c` — S7 filter/sort masters;
- `3a002d8` — S2 `/works` catalog.

## Remaining S4 work

There is an uncommitted visual-only diff in:

- `apps/mobile/src/features/auth/auth-card.tsx`;
- `apps/mobile/src/features/auth/auth-form.tsx`;
- `apps/mobile/src/features/auth/forgot-password-form.tsx`;
- `apps/mobile/src/features/auth/reset-password-form.tsx`.

Existing captures are in `artifacts/figma-qa/S4/`. Preserve the 390 captures
and delete the obsolete 1440 captures before committing.

Sources: login `527:16954`, register error `527:16956`, register complete
`526:15581`, fields `292:5044`, buttons `292:5058`.

Candidate approaches:

- **Durable fix (use):** finish the existing diff with `AuthCard`,
  `FigmaTextField`/existing `TextField`, `FigmaButton`/existing buttons and
  design tokens. Preserve handlers, validation, redirects and analytics.
- **Acceptable workaround:** none needed.
- **Hack (reject):** route-local CSS, duplicate fields/buttons, fake auth
  states, schema changes or suppressed type errors.

Acceptance at 390:

1. `/login`, `/register`, `/forgot-password`, `/reset-password` match the
   referenced phone frames.
2. Default, field-error, submit-error and available completion/invalid-token
   states render without horizontal overflow.
3. Fields and buttons are 44 px; field gaps and error gaps use tokens.
4. Tab order and focus rings are usable; at `390 × 667` the primary action can
   be reached without being hidden by the dock/viewport.
5. No auth request, validation schema, redirect or analytics behavior changes.

Deliver:

- `artifacts/figma-qa/S4/REPORT.md` with 390 evidence and honest `Partial` for
  any missing Figma/runtime state;
- own top sections in `docs/design/04-DESIGN-STATUS.md` and
  `docs/product/11-PROJECT-STATUS.md`;
- focused ESLint/IDE diagnostics and the mobile TypeScript gate;
- one isolated commit: `auth: align mobile web forms`.

The full TypeScript command currently reports unrelated DOM-iterable errors in
cover-frost/glass-dock e2e files and `CreatorHeader.web.tsx`. Do not absorb
those files into S4. Report the blocker if it remains after rerunning.

## Final cleanup after S4

Run focused lint/typecheck, confirm no `.pen` diff, and ensure each report says
390 mobile web only. Do not stage unrelated API/security/seed/docs changes from
the dirty tree. Update task status, then stop; W16 gallery arrows and the
author About-tab URL remain founder decisions.
