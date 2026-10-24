# Cover glass acceptance — 2026-10-25

Status: Implemented for verified web states; physical native acceptance Needs verification.
Base: `665752489e8c10476dadd8e42c18ed5ad2b11937`, branch `fix/progressive-cover-blur`.

## Scope and source

Founder-selected durable fix: shared `CoverFrost`, one web
`backdrop-filter: blur(16px) saturate(115%)`, transparent-to-opaque mask at35%,
independent existing two-stop Figma scrim. Author top has no blur. Content owns
panel height; bottom panel upper corners12, existing card radius/crop unchanged.
Text/chips are siblings of the decorative layers. No second source image,
WebGL, Canvas, SVG blur, stacked blur layers or dependencies.

Read-only live Figma `pAPQo6cADmG5XzVmBX76EE`: work874:5473 and author874:5552;
references retrieved through MCP. Compared the same artwork/author photographs
with live screenshots and the existing `/private/tmp/bidplace-frost-diagnosis/v4`
Blur16/Mask35 prototype. Deliberate differences: two-stop Figma scrim instead of
prototype's three stops; actual text-driven78/100px panels instead of fixed103px;
portfolio title/author rather than commerce labels. This is an approved visual
approximation, not exact Progressive Blur parity. Desktop composition stays
NEEDS-FIGMA; existing full-width catalog geometry was preserved.

`CoverFrost.tsx` retains supported [Expo57 BlurView](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/)
`BlurTargetView`/`BlurView`: one
existing image, intensity60 (not a CSS radius), Android
`dimezisBlurViewSdk31Plus`, tint/scrim fallback below SDK31. No native mask or
second image was introduced. Physical iOS/Android rendering remains unverified.

Removed: unused `imageUrl` from both platform props/callers, unused frost aspect
ratio, blur string wrapper, obsolete progressive/top-zero tokens. Native intensity
has its own platform token so web tuning cannot change native behavior.
Shared card/image/retry/hover/navigation owners remain in place. Consumers:
Home opening/new works/new authors, Works/Authors catalogs, public author works,
related works and search work results; caption-only account cards are unchanged.
No API, persistence, product behavior, Dock or Explore changes; extension remains
owned by existing cards and tokens without a new renderer or format API.

## Verification

- Node22.20.0 / pnpm11.7.0; local dependencies installed from frozen lockfile.
  Initial node_modules symlinks pointed into a different checkout and produced
  missing datetimepicker/stale-package failures; replaced only local symlinks.
- `pnpm exec turbo run typecheck lint --filter=@bidplace/mobile...`:8/8 tasks PASS;
  lint without auto-fix. Expo startup regenerated stale ignored route types.
- `pnpm --filter @bidplace/mobile test`:145 files,1049/1049 PASS.
  Contracts48 and API-client51 tests PASS in affected graph checks.
- Existing theme regression failed on both base and change because its expo-blur
  mock omitted BlurTargetView (base replay in `/private/tmp/bidplace-cover-baseline`).
  Added the missing mock export; preserved all theme/remount assertions.
- `EXPO_NO_DOTENV=1 pnpm exec turbo run build --filter=@bidplace/mobile...`:
  4/4 PASS, web/iOS/Android exports. Successful exports do not prove device parity.
- Owner `figma-cover-frost.spec.ts`, Chromium and WebKit:2/2 PASS. Checks one
  source request per photograph, one img per card, one bottom filter, unblurred
  author top, mask/saturation, radii,78/100px text-driven panel, sharp text,
  loading/error placeholders and lower-panel geometry. Chromium blur-on/off
  pixel inequality retained. CSS color assertion now uses computed RGBA syntax.
- Actual `/works` and `/authors` routes, local public API with9 works/5 authors:
  Chromium/WebKit ×390/1024/1440 =12 checks PASS. Live resize, multiple photographs,
  lower-panel hover, scrolling, one image per sampled card, zero extra hover
  image requests, zero infinite animations or page errors. No new benchmark campaign.
- WebKit Playwright PNG omits composited backdrop blur. Verified visible WebKit
  through OS screenshots below: blur is present on both work and author bottoms.
  Computed-style assertions alone were not treated as visual proof.
- `pnpm docs:link-check` and `git diff --check`:PASS.

## Screenshots

Chromium at390, same photographs as the Figma card references:

![Work](../evidence/2026-10-25-cover-glass/chromium-works-reference-390.png)

![Author](../evidence/2026-10-25-cover-glass/chromium-authors-reference-390.png)

Visible WebKit OS captures (not Playwright element PNG):

![WebKit work](../evidence/2026-10-25-cover-glass/webkit-visible-work.png)

![WebKit author](../evidence/2026-10-25-cover-glass/webkit-visible-author.png)

Full local evidence: `/private/tmp/bidplace-cover-final`, including twelve
catalog screenshots, `catalog-checks.json` and `stabilization` state screenshots.
The temporary config targets the existing8097 web server and local3001 public
API; JSON responses were fulfilled with the test origin to respect the API's
existing origin allowlist. Server configuration and data were not modified.
