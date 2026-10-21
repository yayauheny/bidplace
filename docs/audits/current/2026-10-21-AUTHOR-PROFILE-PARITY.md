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
