# Author profile — sequential completion

Base:1ae4b8b3, branch fix/author-profile-parity. Founder-approved scope2026-10-21.
Success: working shared filters/back controls; shared public desktop navigation;
matched author Works/About composition and continuous Reanimated sticky chrome;
uncut avatar halo; browser evidence at390/1024/1440 and exact1800 desktop reference.

## Order / recovery point

1. Shared FilterOptionRow / FilterSheet and BackButton — complete; commit follows.
2. Shared public desktop header, mobile dock retained — pending.
3. Author header / halo / Works / About / sticky motion — pending.
4. Final browser checks, preview and report — pending.

Finish and commit each stage before the next. No production deploy, database reset
or test fixture writes against the manual preview. Foreign .cursor/old evidence
remain untouched. Favorites/subscriptions, archive, basket, notifications and commerce
remain outside MVP; no fake selected/follow state or verified badge is inferred.

## Source / layout contract

Latest author source explicitly selected by founder: HRRtDp0bQlukw7ptTkuEZg,
page1:3. A page is not an implementation node: its exact child frames were read
with design context and screenshots. Previous pAPQo6cADmG5XzVmBX76EE references
provide provenance, not an override of the latest author file.

-4306:8453: mobile Works; header42px controls, avatar100px,12px gutter.
-4594:35522: category picker, full-width sheet,32px top radius,20px horizontal
 padding,36×4 handle,18px semibold title,15px medium labels, trailing16px check.
-4306:8671 /4594:36802: About expanded/scrolled; keep public Works/About only.
-4861:7803 /4886:10106:1800px desktop Works/About,1280px content, common top nav.
-4594:36589: share sheet reference, not motion timing authority.
-4857:5148 /4857:5549: ordinary-account/favorites scope deferred by founder.

Dynamic author/work media stay API-owned; no Figma sample photos become runtime
content. Existing Hugeicons/brand primitives are reused for matching assets.

## Stage1 diagnosis / candidate comparison

Measured current category data:20 option nodes are present. Label computed width
is0px because compact FilterOptionRow overrides flex:1 with flex:0 in RN Web.
The long panel therefore looks empty despite successful category loading.

- Durable fix (chosen): one trailing-check row style for existing filter consumers,
  nonzero flexible label, intrinsic wrapping, no scrollbar indicator. Preserve
  checkbox/radio semantics, draft/apply/cancel and selection limits.
- Acceptable workaround: change just the author's compact label; rejected because
  other filters would keep a different mechanism.
- Hack: fixed label width / fake category content / force hidden overflow without
  scrolling; rejected because it breaks long labels and keyboard/touch access.

BackButton becomes one muted round primitive with normal/pressed/disabled states.
The second faded arrow in Figma is a state reference, not a second navigation action.
Existing routes/callbacks remain unchanged; pass disabled through the shared button.

Impact: shared UI → existing filter state and URL parameters → unchanged API client,
category/portfolio services and persistence. Desktop nav will reuse dock destination,
auth capability and search owners. No new dependency or server contract is needed.

## Stage1 acceptance

- Fixed common label flex; one trailing check for radio/checkbox filter rows.
  Labels wrap;15/20 optionLabel,18/22 pickerTitle;44px minimum rows. A state
  reference is rendered as one accessible button, not duplicate arrows.
- Removed superseded boxed control styles/tokens and compact-row branch. Shared
  BackButton uses the existing muted FigmaIconButton, forwards disabled and keeps
  each callback. Form chrome now reserves44px with equal side slots.
- Compact FilterSheet no longer overrides AppDialog's bottom spacing with zero.
  Category uses current Figma20px bottom spacing, measured in both browsers;
  indicators are hidden while content remains scrollable. Other full pickers keep
  their own layout. Existing titleVariant= directions retains its typography.
- Existing navigateBack mistook Expo's synthetic index anchor for real history,
  landing direct author loads at Home with a leaked slug. It now honors the root
  history owner's stamped zero position; normal positive history still uses Back.
  No new listeners/state, authorization or auth-dismissal change.
- Checks:21 owner cases,4 navigation cases, then15 affected seller/header cases;
  mobile tsc, scoped eslint, tokens build and production export.14/14 browser
  cases Chromium/WebKit: real direct/natural Back, visible labels, keyboard toggle,
  URL apply/remove, focus restoration, background continuity and filter drilldown.
- [Before/after/reference screenshots](evidence/2026-10-21-author-profile/).
  Before label width0px; now a flexible nonzero text column with trailing check.
  The fixture has two options versus Figma's three, so intrinsic panel heights
  differ by one row. Key focus is retained; comparison screenshot uses pointer
  modality to avoid mistaking its monochrome focus indicator for a divider.


## Stage2: public desktop navigation

Stage1 committed as `853f5b01`. Founder confirmed desktop navigation from1024
CSS px; below it the existing mobile dock remains. Exact header source4980:15230
in the new author file:68px bar,48px search trigger,1280px inner content,
115.1696×22 provided logo. At1024/1440 layout adapts; no matching Figma frame
exists at those widths. Cart/notifications are excluded by the MVP decision.

Chosen durable owner: public-route context → AppShell navigation presentation,
shared use-app-navigation → existing auth/search/capability destinations. This
replaces the dock's private destination implementation. Private shells are
unchanged; public desktop has no phantom bottom dock reserve. A route-local
header or duplicated capability/redirect rules would be a workaround and were
rejected. No API/service/database/release contract changed.

Inactive stacked pages keep header geometry, but are inert and have no navigation
landmark/search ID. Browser checks caught duplicate background Home IDs before
this fix: search focus returned to the hidden page. Only the active public page
now owns the navigation target; auth close restores Profile/Create correctly.

Checks:12 navigation/inset unit cases, mobile typecheck and scoped eslint,
production web export,4/4 new Chromium/WebKit cases (1023→1024→1440→1800,
identity node retained, public routes, search/auth focus). Full author/filter
regressions run before commit. Screenshots saved beside stage1 evidence.
Remaining stage3: author composition/halo/grid/About and animated pinned actions.

## Stage3 diagnosis / choice

Stage2 committed23448b0d. Halo is painted inside a ScrollView whose viewport
ends at the centered content column. overflow:visible on its descendants cannot
escape the scrollport. Chosen durable fix: AppShell full-bleed content role with
the same shared PageColumn owner inside the full-width scrollport. Negative
per-route viewport widths or a bigger blur would only mask the cause (rejected).
Existing author data/API/cache/moderation remain unchanged. The grid owner gains
four-column capacity; no second grid or viewport-based column calculation.

## Stage3 result / review

- AppShell keeps one column geometry owner (PageColumn); author scrollport uses
  the bleed role. Halo remains the bounded15px /0.5-opacity duplicate of the
  real avatar, outside the column clip. No enlarged blur, viewport-width math,
  copied photos, remote sample assets or new dependencies.
- Identity100px /140px; name20/26 semibold /24/32 medium; metadata14/20 /
  16/24, exact existing accountMeta color. Existing Home authorName22 role is
  preserved. Wide About18/22 headings,15/24 body, two measured columns; mobile
  stacks. Achievements retain existing precision/media handling and scroll rail.
- Works:1–4 columns from measured width via the existing grid, min cover264,
 12px horizontal /32px vertical gaps. Canonical1280px content gives4×311px.
  Tabs and category trigger share the wide toolbar; mobile remains stacked.
- Desktop share uses the existing AuthorShare flow with a labelled muted trigger;
  owner settings goes to existing /account/settings. FigmaButton forwards the
  actual control ref for the existing return-focus owner. Visitors have no
  private settings action. QR/more and honest unavailable favorites/follow
  feedback are retained; no simulated subscription state.
- One action row remains mounted. Animated.ScrollView → shared scroll value →
  Reanimated translate/opacity. Measured header/row heights and20px hysteresis;
  common200ms/system-reduced-motion timing. React only receives accessibility
  visibility crossings. Identity/images never collapse, clone or remount.
- Self-review: accept with explicit visual limitations below. Server, public
  projections, auth guards, revision/privacy rules and database are unchanged.
  Source additions implement shared navigation, full-bleed layout and real
  responsive/motion behavior; old private dock destination code was removed.

### Verification and artifacts

-42 unit cases across8 owner files +15 existing button-style cases pass.
- Tokens build, mobile typecheck, scoped ESLint without autofix and web export pass.
-24/24 Chromium/WebKit browser cases: filters/Back/close/focus, search/auth,
  continuity across resize,320/390/440/1024/1440/1800, Works/About geometry,
  pinned action use and return, reduced motion, empty/unavailable author.
-2/2 recorded motion cases: same row on scroll/return in both engines. These are
  browser scroll recordings, not evidence from a physical iPhone.
- Live read-only /seller/vex: real photos/work data render, one desktop nav and
  avatar; no pageerror; API readiness200. No database reset or fixture write.
- Theme owner test had an obsolete Reanimated mock plus old legal-link/toolbar
  color expectations from earlier UI work. Updated mock APIs and exact current
  semantic roles (legalLink/ink); no assertions removed or production recoloring.
- Screenshots/video: [evidence](evidence/2026-10-21-author-profile/).

### Remaining limits

Functional UI is implemented and browser-verified. Visual parity is Partial:
reference data differ, current button master takes precedence, Archive/commerce
and verified/subscription/favorites states are deliberately excluded. Desktop
Works starts at384px versus reference387px with its older instance dimensions;
this is reported, not compensated by a route-local offset.1024/1440 responsive
adaptations have no exact supplied Figma frames (NEEDS-FIGMA). Physical iPhone,
system keyboard, true200% browser zoom and text enlargement remain Needs
verification. No native simulator, full suite, push or production deployment.

### Manual acceptance order

1. Refresh localhost:7899. Desktop Home → Works → Authors → author; resize across
   1024px. One top navigation or one mobile dock, never both.
2. /seller/vex: avatar halo, Works/About, card columns and social/share actions.
3. Category: visible labels, trailing checks, scrolling without indicator,
   apply/clear, Escape/backdrop and return focus; then Back.
4. Phone: scroll beyond identity, use pinned actions, scroll back. Repeat slow,
   quick and cancelled gestures on a physical iPhone; check system keyboard and
   accessible lower actions in login separately. Existing login/create-work
   acceptance order remains in2026-10-21-UI-COMPLETION.md.


Reproduce the author suite against the local preview:
`pnpm --filter @bidplace/mobile exec playwright test --config playwright.sheet-local.config.ts author-static-header.spec.ts`.
The catalog drilldown regression is in sheet-live.spec.ts. The committed local
config includes the author owner spec; temporary bounded configs changed only
selection/output/video and supplied no application behavior.
