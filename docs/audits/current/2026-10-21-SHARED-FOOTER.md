# Shared footer and responsive brand

Base19246233; feature/shared-footer. Sources: ibHSgpAKXnItNSHaHzvRk2 /
5065:21196 (1800 desktop),4980:16299 (390 mobile), read live2026-10-21.

Success: one footer at the end of regular pages, full-bleed surface/one shared
column, accessible real links, mobile dock clearance, no repeated brand mark
on desktop Home, uncropped combined logo. Preserve auth/editor/chrome behavior.
Confirmed scope: ordinary public/account/settings pages have a footer; auth,
full-screen forms, step editors and overlays do not.

Plan: brand owner → footer/link model → shared scroll integration → browser and
owner checks → canonical docs/commit. No production or database change.

- Durable (chosen): one PageScrollView composes existing PageColumn and SiteFooter;
  no nested page scrollers. Reuse the same navigation/auth destinations and legal
  route IDs. Brand uses one exact downloaded combined vector with contain fitting.
- Acceptable workaround: append a different footer JSX to every screen; rejected
  because spacing, links and responsive rules drift.
- Hack: fixed footer over the viewport or clipped logo hidden with padding;
  rejected because it obstructs content/dock and masks image-fit behavior.

Current LegalFooter only exists on Home/legal documents. Legal copy09 requires
agreement/privacy/data-consent/author-rules/prohibited/operator access. Preserve
those real destinations; omit inactive commerce/payment/chat features from Figma.
Privacy/cookies is one existing document, not a second invented endpoint.

Desktop:80px pre-gap and surface paddingY80,1280px content,484×92.455 logo,
200px columns with64px gap. Mobile:60px pre-gap,24px gutter,40px surface padding,
logo max345.509×66, columns gap30, region gaps40/48.16px medium links/semibold
headings;12px regular legal links. Wide adaptation uses existing1024px web policy.
Dock reserve is additional to design spacing and applied once at the scroll owner.

Logo diagnosis: Home's separate BrandLogo is unconditional. Desktop's RN Image
uses background-size:cover with overflow:hidden; rendered width115.15625 vs
SVG115.17 (browser intrinsic width rounds to115), risking edge cropping at scale.
Use contain at the shared brand owner; do not alter glyph paths or add offsets.

## Result

Implemented: SiteFooter and PageScrollView own full-bleed footer/column/scroll
composition. AppShell supplies the actual desktop chrome context; branded pages
show the central mark only without desktop chrome. Footer and navigation use
one 1024px web policy; auth keeps its independent agreed 768px dialog policy.
Desktop navigation uses the existing ghost FigmaButton (founder selected row3).
No API/service/database/release behavior changes. Existing private guards,
server cache and upload behavior remain owned by their current modules.

Checks: 44/44 owner unit tests; mobile tsc and scoped ESLint; design tokens build
and production web export. 26/26 Chromium/WebKit author/navigation/footer tests,
including widths320/390/440/1024/1440/1800, no horizontal overflow,44px footer
link targets, end-of-scroll dock clearance, login return focus and no register
footer. The author scroll tree stays mounted across initial data loading.

Visual limitations: links have44px targets instead of the Figma39px row pitch;
legal links also retain44px targets. Mobile logo fits the342px inner column at
390px instead of overhanging it by1.754px per side. Legal/support labels follow
live MVP destinations rather than unimplemented commerce/chat links. Exact
pixel parity is Partial. Real iPhone and browser zoom remain Needs verification.

New Home source3139:2222 was read live on2026-10-21. Desktop composition starts
at y140 below the68px header;1280px column. Header action outlines and Home
spacing are the next bounded change, separate from this footer integration.

## Desktop Home/header follow-up

Source: live ibHSgpAKXnItNSHaHzvRk2 /3139:2222 (1800px), founder supplied
2026-10-21; explicit button choice is third/ghost from the current master.
Chosen durable fix: extend shared FigmaIconButton with outlined surface and
reuse ghost FigmaButton links, rather than copying button states into the header
(workaround) or drawing noninteractive icons (hack). Profile/cart/notifications
share the outlined38px frame and existing hit slop. Bell/bag reuse the installed
Hugeicons library through the existing FigmaIcon registry. No new dependency.
Cart/notifications open existing FilterSheet feedback; no fake unread dot,
checkout endpoint or notification data. Founder explicitly allowed placeholders.
FigmaButton links preserve aria-current via a named accessibility prop.

Branded PageScrollView owns desktop top72px and inner gutter24px, deriving the
first section at y140,x272,width1256 for1800px (68px header). Mobile composition
and the existing MVP New works rail/New authors stack remain as specified in
03-DESIGN-SYSTEM; no trading sections, prices or timers added from the older frame.
Header groups respect content minimums, preventing ghost buttons from overlapping
search/actions at1024px. Actual content length/data differ from the static frame;
this is measured layout parity, not a claim of full pixel equality.

Checks:20/20 shared button/icon unit cases, mobile tsc/scoped ESLint, production
web export.8/8 targeted Chromium/WebKit cases include measured Home composition,
header overlap/placeholder focus and footer regression. Earlier full author/
navigation/footer pass26/26 was before adding placeholders; its unchanged pinned
bar/filters behavior was not rerun without a new concern. Physical device and
real browser zoom remain unverified.
