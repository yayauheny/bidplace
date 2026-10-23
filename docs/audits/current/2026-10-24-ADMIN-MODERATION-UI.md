# Admin moderation UI — 2026-10-24

Status: Partial; local checks and all-platform export passed; remote CI and physical hardware acceptance pending.
Base: `feature/admin-foundation@bb4bd81e` (PR62), stacked UI branch
`feature/admin-moderation-ui`. Release remains `57b03211`; backend PR62/63 are not
merged. No merge/deploy, new role, migration, table or dependency.

## Accepted scope and source

Founder approved ordinary Home/Search/Add/Profile unchanged; admin uses five items:
Home/Search/Moderation/Analytics/Profile, no cart. Profile goes to `/account`,
Moderation to `/admin`, Analytics to `/analytics`. Access booleans for moderation
and analytics stay separate; current auth grants both only to existing admin.
Server admin guards stay authoritative. No moderator/RBAC implementation.

Read-only Figma `HRRtDp0bQlukw7ptTkuEZg`: component section143:147 (browser view;
section context returned no selection), Work526:11505 and author4306:8671 (MCP
contexts/screenshots obtained 2026-10-24). Reuse Bidplace components/tokens and
public gallery anatomy, excluding commerce content. New admin workflow is the
explicit founder composition; no supplied admin/desktop frame gives exact parity.
Dynamic private images come from API, not copied Figma assets. No Figma edits.

## Audit and smallest durable fix

- Reuse AppShell/FormPageShell/Safe Area/dock owners, FigmaTabs, Button family,
  WorkGallery/AppDialog, MediaDeliveryNotice and protected media transport.
- Reuse AdminUsersPanel and AdminWorkCatalogProposals; keep all incident/catalog
  actions. Retain legacy DTOs/routes and backend decisions/freshness ownership.
- Replace long inline cards/actions with bounded queue and detail routes
  `/admin/products/[id]`, `/admin/authors/[id]`. Remove only superseded inline code.
- Durable API addition: `includeCard=true` opts into optional card metadata;
  default response stays byte-shape compatible with old strict clients. Bounded
  ID page then narrow projection under RepeatableRead; no full-detail N+1 reads.
  Reuse photo-source selector/media delivery selection. Thumbnail identity uses
  existing protected image/photo endpoints; no object keys or public pending URLs.
- Rejected workaround: fetch full details for every list row. Rejected hack:
  substitute public gallery/analytics or infer unknown historical publication.

Queue uses FlatList,15 records/page, server cursors and route-owned section/search/
filter. Back retains the mounted queue/scroll. Filters are non-exclusive; approved
parent and pending edit remain separate. Unknown submission/first-publication is
labelled, not guessed. Gallery uses existing viewer with optional private renderer
and thumbnails. Comparison is vertical fields/photos/catalog/story blocks; first
publication has no invented before snapshot. Dates and achievement images stay
available. Unknown history actor/revision is explicitly unknown.

Actions confirm a captured decision target, preserve reason on failure/409, block
same-turn double submits and ignore results across auth epochs. Parent visibility
restore is separate from review; new proposals cannot block old-publication
restore. Author/listing/proposal guards stay visible. Decision success is distinct
from actual media completion. User management and direct logout remain reachable.

## Staged reviews

1. Mobile source review found missing parent restore, approval prerequisites,
   category, achievement dates/images and story-only comparison; all corrected.
2. Mobile screenshot review found the private image96px default overriding large
   aspect geometry; fixed at AdminObjectImage. Independent UX review of320/390
   screenshots found no substantial blockers. Horizontal filter scroll is existing
   FigmaTabs behavior. Dock/action clearance and gallery bounds have browser checks.
3. Only after mobile runs: adaptive FormPageColumns opt-in composes the same gallery
   and metadata side by side from measured container width; default consumers retain
   stack layout. Public DesktopHeader reuses existing icon controls for admin
   destinations. Resize must preserve reason and viewer ownership.

## Verification and limits

Actual checks before adaptive follow-up:17 HTTP/PostgreSQL owner tests,39 affected
mobile owner tests; full mobile1024 tests; mobile typecheck/lint and API lint passed.
Four author/Work privacy E2E plus queue Back/filter,320/360/390/430/no-overflow,
empty/error/retry and guest-dock cases passed in Chromium/WebKit. Admin profile
navigation/settings/logout passed separately (2 tests). Final adaptive/mobile
repeat, full dependency graph build and CI are recorded in the PR.

Screenshots: `/private/tmp/bidplace-admin-ui-evidence` (mobile queue/detail/changes/
history/confirmation/author/empty/error; adaptive evidence follows). Physical iOS/
Android, system keyboard/text scaling and live storage/CDN remain Needs verification.
Browser emulation does not prove hardware acceptance. Exact desktop parity is
NEEDS-FIGMA; desktop checks establish behavior and robustness only.

Maintenance: existing owners retained; one detail workflow and one comparison
owner, no parallel admin backend or design system. Comparison intentionally uses
bounded snapshots, not a text diff engine. Shared nav belongs to this PR; analytics
UI stays separately based on PR63 and does not duplicate these navigation changes.
Exact line/services/contracts/dependencies/compatibility comparison belongs to PR.

Final independent adaptive review found no substantial new issues (source and Chromium768/1440; reviewer did not run runtime/WebKit/Figma parity). Queue pagination errors now preserve cards and expose retry; owner regression passes14 tests. Full graph typecheck/lint pass. API unit464, contracts47, API client49, mobile1024, database1 and config8 pass. Integration241 pass/29 skipped (existing S3-dependent suite); ops31 and E2E fence pass. Repository env-path tests were run separately without the synthetic env override, which otherwise changes their expected resolution; production config was not read. Adaptive follow-up4/4 Chromium/WebKit passed.

Committed screenshot evidence: [mobile queue](../evidence/2026-10-24-admin-moderation/queue-chromium-390.png), [Work](../evidence/2026-10-24-admin-moderation/work-mobile-chromium.png), [changes](../evidence/2026-10-24-admin-moderation/changes-mobile-chromium.png), [history](../evidence/2026-10-24-admin-moderation/history-mobile-chromium.png), [author](../evidence/2026-10-24-admin-moderation/author-chromium-390.png), [desktop](../evidence/2026-10-24-admin-moderation/work-adaptive-chromium-1440.png).

Final accessibility review found missing tab-panel associations. Detail now links
its labelled panel; queue selectors use the existing visual rail with explicit
selection-toolbar semantics and pressed state. No new navigation or layout.
Shared owner units and browser DOM/keyboard acceptance verify these associations.
