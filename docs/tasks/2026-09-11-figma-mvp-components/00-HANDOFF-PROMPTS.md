# Figma portfolio MVP — independent component handoffs

Date: 2026-09-11
Status: Active

These prompts are self-contained. Run only one package per branch and commit.
The release target is Expo Web in a browser with a centered 390 px phone
column. Native iOS/Android is not an acceptance target.

## 1. C3 — Work/author cards and compact identity

Recommended model: Grok 4.6 High. This package controls shared geometry and
image/frost composition, so it requires exact local-source inspection.

```text
Work in /Users/yayauheny/projects/bidplace. Implement only C3 from
docs/design/10-FIGMA-COMPONENT-IMPLEMENTATION-PLAN.md: WorkCoverCard,
AuthorCoverCard and AuthorIdentity. First read AGENTS.md, docs/product/00,
01, 05 and 11, docs/design/00–04, and the local capture packages for nodes
874:5458, 874:5473, 874:5487, 874:5512, 874:5526, 874:5616, 874:5631,
874:5659, 874:5671, 874:5685, 874:5540, 874:5564, 874:5576 and 874:5591.
Do not infer geometry from screenshots when nodes.json provides it.

Product is portfolio-only. Cards may render image, title, author and public
Work facts only. Never render price, timer, auction/sale state, bid CTA, cart,
likes, inventory or hidden commerce switches. Remove mode="portfolio" and
other compatibility props from the production master if they still exist;
do not add a replacement mode flag.

Requirements:
- exact 264×352 base anatomy and a measured 366×488 full-width variant without
  scaling text/strokes or stretching the image;
- use dynamic server images; capture rasters are QA references only;
- one CoverFrost master, correct crop and bottom overlay fields;
- AuthorIdentity compact source row is 348×84 with an 84 px avatar, not the
  112 px profile avatar;
- define deterministic wrapping/truncation for long title/name/slug, zero tags
  and missing/failed media;
- keep components query/router-free and use design tokens;
- add focused unit tests and matched 390 px browser evidence.

Do not assemble Home/Works/Author screens in this package. Update
docs/design/04-DESIGN-STATUS.md, docs/design/10-FIGMA-COMPONENT-IMPLEMENTATION-PLAN.md
and docs/product/11-PROJECT-STATUS.md. Do not edit any .pen or source capture.
Create feature/figma-card-masters and one commit. Run mobile focused tests,
typecheck, lint and Expo Web export. Report exact files, checks and remaining
pixel gaps.
```

## 2. C4 — Catalog filter and sort controls

Recommended model: Composer 2.5. The behavior is bounded and can be reviewed
from typed props and state tests.

```text
Work in /Users/yayauheny/projects/bidplace. Implement only C4 discovery
controls from docs/design/10-FIGMA-COMPONENT-IMPLEMENTATION-PLAN.md. Read
AGENTS.md, product docs 00/01/05/11, design docs 00–04, and local Figma nodes
874:5434, 526:12980, 526:13009, 526:13065, 526:13142 and 584:17554.

Build one master each for FilterSortBar, FilterTrigger, SortTrigger,
FilterSheet, FilterOptionRow, FilterSearchField and ResultsCountAction. They
receive selected values, counts and callbacks through typed props; they do not
fetch, mutate, filter or invent facet values. Preserve the current category +
material Work contract and direction + city Author contract. Do not add price,
auction, announcement or archive filters. Use the existing web-capable sheet
dependency only if focus trap, Escape, backdrop click and focus restoration
are proven; otherwise use the smallest existing accessible overlay primitive.

Cover closed/open, single/multi-select, reset/apply, zero results, long labels,
keyboard and disabled states. Do not wire screens or change APIs. Update design
status/plan and product status, never .pen/captures. Create
feature/figma-discovery-controls and one commit. Run focused tests, mobile
typecheck/lint and Expo Web export; include a 390 px browser smoke.
```

## 3. C5a — Creator hero, socials, tabs, about and compact header

Recommended model: Grok 4.6 High. This package includes atmosphere stacking,
privacy visibility and sticky-state boundaries.

```text
Work in /Users/yayauheny/projects/bidplace. Implement only the non-share C5
creator masters: CreatorHero, CreatorSocialActions, CreatorProfileTabs,
CreatorAboutSections, AchievementsTimeline and CompactCreatorHeader. Read
AGENTS.md, product docs 00/01/05/11, design docs 00–04, and every local creator
about/works/default/scrolled package plus achievement node 742:20510.

Reuse AuthorAtmosphere and the existing button/icon/chip masters. Do not create
a second blur, avatar, chip, tab or icon-button master. Public socials render
only for present validated Telegram/Instagram/website URLs. Public email and
private handoff contact must be impossible to pass to the public component.
Tabs are only Работы and Об авторе. No Архив, likes or notification bell.
CompactCreatorHeader owns only its visual state; the screen later owns sticky
activation. Timeline supports text-only and image records and remains readable
at 390 px. Empty optional sections disappear without blank gaps.

Do not assemble the route screen and do not implement ShareSheet here. Add
visibility/a11y/long-content tests and matched component screenshots. Update
design status/plan and product status, never .pen/captures. Create
feature/figma-creator-masters and one commit; run focused tests, mobile
typecheck/lint and Expo Web export.
```

## 4. C5b — Web ShareSheet and QR

Recommended model: Grok 4.6 High. Browser share/clipboard/download and dialog
accessibility need careful failure-state handling.

```text
Work in /Users/yayauheny/projects/bidplace. Implement the shared Expo Web
ShareSheet + ShareQr used by creator and Work pages. Read AGENTS.md, product
docs 00/01/05/11/13, design docs 00–04, local share captures 526:13756 and
597:18787, and the existing sharePath contracts. Web only is the release
target; do not add native iOS/Android share behavior.

The screen passes a server-authoritative relative sharePath. Resolve it against
the current public origin and reject paths outside the existing /works/:id and
/authors/:slug contracts. Generate a real QR, never a placeholder. The sheet
owns the exact dimmer, dialog semantics, initial/final focus, Tab containment,
Escape/backdrop/close dismissal, copy status, QR download state and errors.
Clipboard must have a safe web fallback when navigator.clipboard is unavailable
on non-secure localhost/HTTP. Download must create a correctly named PNG and
revoke temporary object URLs. Never include public email/private handoff data.

Reuse OverlayDimmer, FigmaGlassSurface, FigmaButton and FigmaIconButton; do not
add a second modal style. Add unit tests plus Playwright for copy success,
fallback, download, focus restoration, Escape and invalid path. Do not wire
route layouts beyond replacing an existing share placeholder with this master
if necessary for acceptance. Update status docs, never .pen/captures. Create
feature/web-share-sheet and one commit; run focused tests, typecheck, lint and
Expo Web export.
```

## 5. C6 — Public Work component set

Recommended model: Grok 4.6 High. Optional tabs, media ordering and public-data
visibility affect multiple user states.

```text
Work in /Users/yayauheny/projects/bidplace. Implement only C6 public Work
masters from docs/design/10-FIGMA-COMPONENT-IMPLEMENTATION-PLAN.md using local
nodes 745:21209, 745:20634, 621:19311 and share node 597:18787. Read AGENTS.md,
product docs 00/01/05/11 and design docs 00–04 first.

Build WorkGallery, WorkIdentityBlock, WorkContentTabs, WorkStory,
WorkFactsList, PaymentDeliveryStub and RelatedWorksSection. Reuse C3 cards and
the shared ShareSheet. Product is portfolio-only: no price, timer, sale badge,
bid history, cart, likes or purchase CTA. История exists only when non-empty;
otherwise Детали is the sole active panel and ?tab=story must normalize away.
Facts omit absent optional rows, preserve zero-like valid values and include
dimensions, material/technique, edition and creation date when present.
Gallery preserves server order, crop and missing-media state. Related works
must exclude the current Work.

Keep components query/router-free; route normalization may remain in an
existing pure composition helper. Add tests for empty story, long facts,
missing media, one/many images and current-work exclusion. Do not rebuild the
whole screen. Update status docs, never .pen/captures. Create
feature/figma-work-masters and one commit; run focused tests, typecheck, lint
and Expo Web export.
```

## 6. C7 — Auth/application/create-work form masters

Recommended model: Composer 2.5 for visual primitives; require Grok 4.6 High
review before merge because auth, drafts and uploads cross sensitive flows.

```text
Work in /Users/yayauheny/projects/bidplace. Implement only C7 form/wizard
masters. Read AGENTS.md, product docs 00/01/05/11/13, design docs 00–04 and only
KEEP_FIRST_MVP auth/apply/create-work captures. Preserve existing server
contracts and validation; this is not an auth/upload backend rewrite.

Build FormStepHeader, WizardProgress, PhotoPickerField, WorkMediaPicker,
FieldGroup, TextareaField, DateOrYearField, DimensionsField, TaxonomyPicker,
DraftExitDialog and contract-derived ReviewSummary. Application socials are
optional and must never block submit. Private handoff remains a separate
private field group. Work steps are images/title → details → optional plain
text story → review. Do not use sale status, price, shipping, buyer contact,
process media, AI, OAuth or passwordless captures. Missing review/verify/reset
frames use existing product behavior and shared primitives; do not claim
pixel-perfect parity.

Keep wizards thin, preserve draft resume/exit and existing auth security
behavior. Add validation/state/a11y tests. Do not assemble every route in this
package. Update status docs, never .pen/captures. Create
feature/figma-form-masters and one commit; run affected tests, mobile
typecheck/lint and Expo Web export. Request a security review before merge.
```

## 7. C8 — Screen assembly and release acceptance

Recommended model: Composer 2.5 for mechanical placement, followed by Grok 4.6
High review. Start only after C3–C7 masters are merged.

```text
Work in /Users/yayauheny/projects/bidplace only after C3–C7 production masters
are present. Assemble Home, Works, Authors, Author, Work, Search, auth,
application and create-work routes from those masters. Screens own data,
routes, section order and responsive composition only. They must not copy
card, glass, frost, tab, field, button, sheet or dock CSS locally.

Follow docs/product/05-MVP-RFC.md over conflicting old commerce frames. Home
may show Открытие недели only from non-null server curatorSelection; never
substitute newest/hardcoded content. No active auctions, prices, timers, cart,
bids, purchases or sales copy. The dock is exactly one 232×64 four-item
capsule; no separate search FAB. Search must not be faked: if its API contract
is still missing, record the blocker and leave that route out of completion
claims.

For each route verify loading, empty, error/retry, missing media, long content,
390 px, keyboard, zoom and reduced motion. Add matched screenshots against the
specific local Figma references with deliberate product-copy differences
documented. Ensure one barrel and one production master per role. Update
docs/design/02/04/10 and docs/product/11; do not modify .pen/captures. Create
feature/figma-screen-assembly and commit in small route groups. Run focused
tests after each group and final mobile tests/typecheck/lint/Expo Web export.
```

## Execution order

1. C3 cards and identity.
2. C4 discovery controls and C5a creator masters (separate branches).
3. C5b ShareSheet/QR.
4. C6 Work masters.
5. C7 forms.
6. C8 screen assembly and acceptance.

Do not run these packages concurrently in one working tree. A later package
must rebase onto the accepted commits of its dependencies.
