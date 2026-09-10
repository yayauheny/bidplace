# CoverFrost applicability audit — 2026-09-10

**Recommendation: retain production `blur(30px)`.** No candidate meets the
no-readability-regression gate. No production component, token, layout, dependency,
lockfile, `.pen`, or source capture changed. Branch `fix/progressive-cover-frost`
starts at `542e6aa`. This is an engineering comparison, not a new product decision.

[Matched screenshots](comparison.html) · [Raw measurements](evidence/results.json) ·
[Size/clipping measurements](evidence/analysis.json) · [Reduced transparency probe](evidence/fallback.json)

## Scope and acceptance

Owners: `docs/design/03-DESIGN-SYSTEM.md` for CoverFrost, `05-MVP-RFC.md` for public
portfolio content, `10-CODE-ARCHITECTURE.md` for shared primitives. The current
phone-width browser target takes precedence over historical Pen desktop/native
acceptance text. No product-flow conflict or founder decision is required.

Before coding: compare matched 390px screenshots on color, grayscale and high
contrast; quantify title-background contrast and band transitions; preserve one
semantic image, pointer-inert/aria-hidden frost, dynamic media/height and keyboard
access; test 20-card scrolling; verify React 19/Expo Web. Only a stable visual gain
with no readability/performance regression qualifies. More changed pixels alone
never establishes a gain.

| Variant                          | Classification                               | Experimental algorithm                                                                              | Result                                                            |
| -------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| A                                | acceptable workaround, existing production   | one uniform 30px backdrop                                                                           | retain                                                            |
| B3/B4/B5                         | durable fix candidate, rejected for adoption | 3/4/5 full-size siblings, linear radius samples to 60, overlapping triangular alpha masks           | more detail behind title; contrast regression; corner differences |
| C4/C6/C8                         | durable fix candidate, rejected for adoption | actual `progressive-blur@1.0.0` LinearBlur, side=bottom, strength=60, falloff=100, transparent tint | contrast regression; larger than equivalent local code            |
| M                                | acceptable workaround candidate, rejected    | one 60px blur with linear opacity mask                                                              | sharp/blur mixture, contrast regression                           |
| duplicate artwork / Figma raster | hack, excluded                               | image replacement                                                                                   | violates task constraints                                         |

`ProgressiveBackdropBlur.web.tsx` is an isolated research primitive, not a new
production master. Its radii, gradient and corners come from existing CoverFrost
spec; only experimental step count varies. Overlapping masked backdrop layers are
the conceptual reference used by Andrew Prifer and BoringUI; the local triangular
band generator was written independently, without copying their implementations.
The vendored library is downloaded only into temporary storage, not committed.

## Measurement method and limitations

- Real React 19.2.3, bundled Inter 500, 18px/22px title, 264×352 card inside a
  390×844 viewport, DPR 1. Identical synthetic SVG fixtures across variants:
  colored/grayscale bands with shapes and an 8px black/white stripe stress image.
  These are test images, not Figma raster backgrounds or production media.
- The fixture deliberately isolates the substrate; it does not reproduce a whole
  screen. Production DOM/keyboard checks run separately against Expo's export.
- Contrast = minimum white/background WCAG luminance ratio over the title's
  bounding region (12px horizontal inset), with text visibility hidden but layout
  retained. This conservative region metric is not a glyph-level WCAG audit.
  Even A is below 4.5 on the color/grayscale stress fixtures: retaining A is not
  a claim that arbitrary media already satisfies AA.
- MAE is mean absolute RGB difference from A, 0–255, excluding a 12px horizontal
  margin. It measures change, **not distance to Figma**. Horizontal edge energy
  is mean adjacent-pixel luminance difference per vertical third. It includes
  the common tint; it is not a recovered Gaussian radius. Maximum adjacent-row
  luminance jump flags transitions, not a perceptual seam certification.
- 20 cards, 120 requestAnimationFrame-driven scroll positions, forward/back,
  119 intervals/run; Chromium has three repeats, other engines one. These are
  scheduling proxies, not GPU timings or a low-end-phone benchmark. Browser/OS
  frame caps and power policy affect them. No hardware GPU memory measurement
  or physical mobile-browser acceptance was available.
- One RGBA surface for a 264×78 frost is 82,368 bytes at DPR1; twenty cost 1.57MiB
  before overscan/intermediates. At DPR3 that is 14.14MiB per layer; 3–8 layers
  multiply this allocation-area proxy. It is **not measured GPU memory** and
  does not account for compositor culling/reuse. Layer count is not a guaranteed
  count of GPU passes. No speculative `will-change` or containment tuning added.
- Figma nodes `874:5459`, `874:5474`, `874:5543` specify 0→60 progressive radius,
  vertical offsets, transparent→#292929 at 70%, top corners 12px. Local captures
  contain composited reference rasters, not a matching unfiltered source for these
  synthetic images. Neither CSS sigma=60 nor sigma=30 establishes Figma's exact
  kernel. Pixel-perfect/proven Figma-distance improvement cannot be claimed.

## Chromium 149 headless results

Title contrast: color / grayscale / stripes. MAE: same order. Scroll is worst p95
of three runs, milliseconds.

| Variant | Contrast ratios    | RGB MAE vs A          | Scroll p95 | Maximum row jump |
| ------- | ------------------ | --------------------- | ---------- | ---------------- |
| A       | 2.10 / 2.24 / 4.54 | 0.00 / 0.00 / 0.00    | 17.5       | 0.01509          |
| B3      | 1.53 / 1.56 / 2.14 | 13.65 / 12.35 / 26.44 | 17.6       | 0.03316          |
| B4      | 1.48 / 1.48 / 2.68 | 13.47 / 12.38 / 22.98 | 17.6       | 0.04101          |
| B5      | 1.45 / 1.45 / 3.32 | 13.41 / 12.46 / 20.95 | 17.7       | 0.04651          |
| C4      | 1.43 / 1.43 / 1.24 | 24.02 / 22.78 / 51.68 | 17.6       | 0.01918          |
| C6      | 1.43 / 1.43 / 1.24 | 22.51 / 21.92 / 46.30 | 17.6       | 0.01564          |
| C8      | 1.43 / 1.43 / 1.24 | 21.29 / 21.11 / 40.86 | 17.6       | 0.02045          |
| M       | 1.60 / 1.61 / 1.48 | 19.96 / 17.57 / 48.59 | 17.7       | 0.01647          |

All B/C variants lose contrast on all three fixtures. B5's stripe contrast is
3.32 versus A's 4.54; C4/6/8 reach only 1.24. B has larger row transitions than A;
C exposes high-frequency stripes behind the title. No candidate wins even before
physical-device performance and Safari/Firefox acceptance gates.

## Installed Chrome 152 and windowed engines

[Windowed run](evidence/headed/results.json): Chrome 152.0.7977.83; Firefox 151; WebKit 26.5.
Same fixtures, viewport and procedure; run separately after export builds.

| Variant | Stripe contrast | Scroll median / worst p95 (ms) |
| ------- | --------------- | ------------------------------ |
| A       | 4.61            | 33.3 / 34.2                    |
| B3      | 2.17            | 33.3 / 34.1                    |
| B4      | 2.68            | 33.3 / 34.0                    |
| B5      | 3.36            | 33.3 / 33.9                    |
| C4      | 1.25            | 33.3 / 34.0                    |
| C6      | 1.25            | 33.3 / 33.6                    |
| C8      | 1.25            | 33.3 / 33.8                    |
| M       | 1.48            | 33.3 / 34.4                    |

The ~33.3ms scheduling interval appears in every Chrome variant; it does not
isolate GPU cost. Chrome reproduces the readability regression. Firefox/WebKit
still show no pixel change on disabling filters, including A. This is an
unresolved environment/rendering limitation, not specifically a headless bug.
These engines cannot provide visual acceptance or comparable blur-cost results.
Windowed runs also preserve image count, dynamic height/media and scroll-return
pixels. Reduced-transparency now reports active in Chrome during capture.

Reproduce: `FROST_CHROME=1 FROST_HEADED=1 FROST_OUTPUT=/private/tmp/cover-frost-headed node docs/research/2026-09-10-cover-frost/run.mjs`.

## Rendering, accessibility and browser support

Current Chrome, Safari and Firefox implement backdrop-filter and gradient masks
([MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter),
[mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask-image)).
Older Safari needs the WebKit backdrop prefix. Support of each property does not
prove the masked composition renders correctly on every GPU.

- Tested headless Chromium 149.0.7827.55, Firefox 151.0 and WebKit 26.5. All report
  CSS support. Only Chromium changes pixels when filtering is disabled. Firefox
  and WebKit produce identical A/B/C/M images here: **rendering unverified**, not
  evidence that released Firefox/Safari lack CSS support. WebKit is not Safari.
- One image/card and zero images in frost, aria-hidden and pointer-events:none
  pass; a11y snapshots contain artwork/link/content and no substrate. Dynamic
  height 78→122 and image switching pass. Chromium/Firefox default Tab hits the
  link; WebKit's default Mac tab policy skips it. Focused keyboard buttons still
  resize/swap. This is not a physical screen-reader audit.
- All 24 headless variant/browser combinations return pixel-identical card
  screenshots after scrolling back. No differences outside card bounds plus a
  2px antialias margin. Chromium B/M differ from A at 25 sampled pixels outside
  the top frost arc; clipping parity remains unresolved. C has zero such pixels.
  These measurements do not certify no transient shimmer/seams during motion.
- Experimental forced-colors fallback disables filters, uses Canvas/LinkText,
  preserves semantic content; emulation passes in all three engines. A dedicated
  Chromium CDP probe confirms reduced-transparency: opaque #292929 and no blur.
  The initial matrix detached CDP too early, so its `reduced: false`
  entries are not acceptance evidence; `fallback.json` is the corrected probe.
  The runner now keeps CDP alive while sampling. Preference support is not
  universal ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency)).
  No fallback is added to production in this audit. Existing media/forced-colors
  readability gaps remain open; uniform blur alone is not a universal fallback.

## External implementations

- [AndrewPrifer/progressive-blur](https://github.com/AndrewPrifer/progressive-blur),
  npm 1.0.0, MIT: `LinearBlur` generates geometric radii from 0.5 to strength,
  not a linear Figma profile. `strength=60` was tested directly, without assuming
  radius equivalence. Bottom direction, percentage masks, div props and dynamic
  height work. `aria-hidden` is supplied by caller; default pointer-events:none
  can be overridden by style. React/ReactDOM peer range is ^18.2.0. Actual React
  19.2.3 mounting and isolated Expo 57 Web export pass; this does not change the
  declared peer contract. Tree-shaken LinearBlur is 1,708 bytes minified / 639
  gzip versus local 614 / 413, externalizing React and existing shared spec.
  Whole bundled local spec costs 7,612 / 2,865 standalone; that is shared token
  overhead, not an incremental production cost. No dependency advantage proven.
- [rakib86/react-progressive-blur source](https://github.com/rakib86/react-progressive-blur/blob/main/src/index.tsx):
  three hardcoded layers, outer pointerEvents:auto, narrow class/intensity/position
  API. Its [manifest](https://github.com/rakib86/react-progressive-blur/blob/main/package.json)
  includes its own package as a dependency. Excluded as requested.
- [BoringUI](https://boringui.dev/docs/progressive-blur/) uses overlapping masks
  and bounded profiles plus a surface fade to hide the noisy edge. That extra
  fade is not CoverFrost's specified tint and cannot be copied unexamined.
- progressive-acrylic excluded as requested: an imperative, broader surface API
  is unnecessary for this primitive. No installation or adoption.

The supplied report is a useful hypothesis, not implementation authority. In
particular, canvas can draw cross-origin images but reading/exporting a tainted
canvas is restricted; SVG filter URLs are valid backdrop-filter syntax, though
variable-radius cross-browser behavior is not thereby solved. No canvas,
OffscreenCanvas, WebGL, decoder, CORS changes or image readback enter production.
CSS backdrop variants sample the displayed image without requiring CORS readback.

## Reproduction and verification

Run in the isolated worktree. Do not run performance comparison alongside builds.
No commands below load project `.env` files. The export API origin is a local test
server; all API/image responses used by the focused test are mocked.

```sh
pnpm install --offline --frozen-lockfile --ignore-scripts
# Build the existing dependency graph and generate Prisma types first.
pnpm --filter @bidplace/design-tokens build
pnpm --filter @bidplace/contracts build
pnpm --filter @bidplace/api-client build
pnpm --filter @bidplace/database build
# Expo's generated, gitignored expo-env.d.ts must reference expo/types.
mkdir -p /private/tmp/cover-frost-vendor
curl -L --fail https://registry.npmjs.org/progressive-blur/-/progressive-blur-1.0.0.tgz -o /private/tmp/progressive-blur-1.0.0.tgz
tar -xzf /private/tmp/progressive-blur-1.0.0.tgz -C /private/tmp/cover-frost-vendor
node docs/research/2026-09-10-cover-frost/run.mjs
node docs/research/2026-09-10-cover-frost/analyze.mjs
node docs/research/2026-09-10-cover-frost/fallback.mjs
node docs/research/2026-09-10-cover-frost/export-library.mjs
```

Tarball SHA-256: `e1f33b69f37ab14a7ba82ac92f6eacd09a5f6fbe12099c965c437680dd039253`.
The library export probe temporarily changes only the worktree entrypoint and
restores it in `finally`; no manifest/vendor changes remain. Run it sequentially
with other Expo commands. Its first direct-Node launch could not resolve the
worklets Babel plugin; using the project's `.bin/expo` shim fixes module paths.

Commands actually used from `apps/mobile` after dependency preparation:

```sh
../../node_modules/.bin/vitest run
./node_modules/.bin/tsc --noEmit
../../node_modules/.bin/eslint .
EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_URL=http://127.0.0.1:8097 CI=1 ./node_modules/.bin/expo export --platform web --clear --output-dir /private/tmp/cover-frost-expo-export
# In another shell, from repo root:
node docs/research/2026-09-10-cover-frost/serve-export.mjs
# From apps/mobile:
./node_modules/.bin/playwright test --config ../../docs/research/2026-09-10-cover-frost/playwright.config.ts
```

Unit tests: 251/251. Mobile typecheck and lint pass after generating dependency
outputs and Expo types. Baseline export and isolated library export pass. Existing
focused test had an invalid `work.uniqueness` fixture field against the strict
contract at 542e6aa; removed only that test field and extended DOM/image/keyboard
checks. No API/schema change. An export without API origin fails at runtime;
a clean Metro rebuild with the explicit mock origin is required.

Final focused Playwright: **1/1 passed**, including one DOM/semantic image,
empty frost accessibility subtree, Tab/Shift+Tab focus and actual backdrop pixel
change. `.pen` and capture diff: empty. Production remains the documented uniform
approximation; no new runtime status is promoted.
