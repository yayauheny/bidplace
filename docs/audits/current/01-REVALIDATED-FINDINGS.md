# Revalidated current findings

**Baseline:** `eef669b7c343c52a14b8abfb3db42dbaeda4f6af` plus the release-gate
branch changes. Historical audit IDs are retained only as references; each row
below has one current status.

| Historical finding                               | Current status                           | Current evidence                                                                                                                                                                             |
| ------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VAL:D13 — rules response mismatch                | **RESOLVED**                             | `packages/contracts/src/rules.ts :: acceptRulesResponseSchema`, `apps/api/src/auth/auth.service.ts :: acceptRules()`, and `packages/api-client/src/auth.ts :: acceptRules()` use `{ user }`. |
| LOGIC:BL-01/BL-14 — pending revision writable    | **RESOLVED**                             | `apps/api/src/products/products.service.ts :: update()` applies `canAuthorEditRevision()` in its locked flow; revision integration coverage is present.                                      |
| M-LOGIC-01 — no mobile cabinet                   | **RESOLVED**                             | `apps/mobile/src/app/(seller)/cabinet.tsx` and `features/sellers/author-cabinet-screen.tsx`.                                                                                                 |
| M-LOGIC-02/06/13 — editor loses edits            | **RESOLVED for the current editor path** | `ProductDraftScreen` uses RHF, persists before submit/navigation, and uses editing-revision hydration tokens.                                                                                |
| M-LOGIC-03/04 — stale 401 session/deep link loss | **RESOLVED**                             | `AuthProvider` observes `authKeys.session`; unauthorized recovery preserves that entry as anonymous and protected routes carry safe `redirectTo`.                                            |
| M-LOGIC-05 — volatile application steps          | **RESOLVED**                             | Seller drafts use server `applicationStage`, URL step resolution, and RHF state.                                                                                                             |
| M-LOGIC-07 — packaging/delivery in editor        | **RESOLVED for mobile editor**           | `apps/mobile/src/features/sellers/product-draft-form.spec.ts` proves the editor request omits both fields; legacy contract/storage remains retained.                                         |
| CROSS:T1 — mobile tests absent from verify       | **RESOLVED**                             | root `package.json :: verify` runs mobile unit tests and `test:e2e-fence`; browser suites have separate workflows.                                                                           |
| CROSS:T7 — runtime/docs commerce mismatch        | **RESOLVED**                             | `AppModule` boundary and retained Prisma commerce data match current architecture/status documents.                                                                                          |

## Current release findings

### CUR-01 / Email verification is not an enforced author-flow invariant

**RELEASE BLOCKER / PRODUCT DECISION · confirmed**

Evidence:

- `docs/product/05-MVP-RFC.md :: Author candidate, Auth`
- `apps/api/src/otp/otp.service.ts :: verify()`
- `apps/api/src/sellers/sellers.service.ts :: create()`
- `apps/api/src/products/products.service.ts :: create()`
- `apps/mobile/src/app :: route inventory`

Finding: the RFC sequence says an author confirms email before the application,
but Seller creation does not require `User.emailVerifiedAt`, Product creation
only requires an approved Seller profile, and mobile has no verification route.
OTP support exists but does not currently establish the sequence as a server
invariant or a complete UI path.

Impact: release readiness / product contract.

Suggested direction: founder decides whether verification is mandatory before
author application, before submission, or deferred; implement the selected
server boundary and UI flow in a separate change.

Related old findings: CROSS:B4, LOGIC:BL-03.

### CUR-02 / Rules acceptance response is correct; required acceptance point is undecided

**PRODUCT/LEGAL DECISION · confirmed contract, incomplete flow evidence**

Evidence:

- `packages/contracts/src/rules.ts :: acceptRulesResponseSchema`
- `apps/api/src/auth/auth.controller.ts :: acceptRules()`
- `apps/mobile/src/features/auth`
- `docs/product/05-MVP-RFC.md :: Auth`

Finding: the response contract is consistently `{ user }`. Current source does
not establish one unambiguous mandatory point in the Portfolio author flow at
which rules acceptance must be completed, and external legal-document approval
is not source evidence.

Impact: legal UX / release decision.

Suggested direction: record the intended acceptance point and obtain external
legal approval before making it a release gate.

### CUR-03 / Browser and provider release evidence remains external

**NEEDS_EXTERNAL_EVIDENCE · confirmed**

Evidence:

- `.github/workflows/browser-e2e.yml`
- `.github/workflows/portfolio-release-gate.yml`
- `scripts/ops/media-preflight.mjs`
- `scripts/ops/staging-smoke.mjs`

Finding: source defines isolated Chromium and Chromium/WebKit gates plus S3 and
staging smoke commands. Green hosted browser runs, a provisioned S3 preflight,
staging smoke and a backup/restore drill still require their target environments.

Impact: release readiness.

Suggested direction: collect the run links and operational evidence for the
release candidate; do not substitute local configuration parsing.
