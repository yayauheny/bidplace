# Auth dialogs — 2026-10-07

Status: **imported and mapped; runtime implementation not started**.

This is the founder-provided, versioned visual source for this auth wave. It
overrides only the six mapped captures from `portfolio-phone-v1` at `d9fb5c2`.
That read-only library and all other screen/component sources stay unchanged.
The 2026-10-06 [field state board](../../fields/2026-10-06-text-fields/README.md)
still owns common input states; this bundle records auth-specific geometry.

## Start here

1. [HANDOFF.md](HANDOFF.md): scope, contracts, decisions and executor prompt.
2. [STYLES.md](STYLES.md): measured geometry, state boundaries and missing data.
3. [catalog.json](catalog.json): source archive → package → exact root/surface.
4. [NODE-MAP.json](NODE-MAP.json): source nodes mapped to proposed UI roles,
   with extracted layout/style, text and fidelity warnings.
5. Each package's `design/nodes.json` and reference PNG: primary evidence.
6. [SOURCE-COMPARISON.json](SOURCE-COMPARISON.json): differences against the
   immutable parent captures; [ASSETS.json](ASSETS.json): asset use restrictions.
7. [VALIDATION.md](VALIDATION.md): import checks and remaining fidelity gaps.

## Screen mapping

| Package                                                                    | Capture root | Relevant surface | Use in this wave                                               |
| -------------------------------------------------------------------------- | ------------ | ---------------- | -------------------------------------------------------------- |
| [login-password](screens/login-password/README.md)                         | `526:14674`  | `526:14885`      | Email/password login, provider placeholders, recovery link     |
| [verify-email](screens/verify-email/README.md)                             | `526:14903`  | `526:15114`      | Email verification only; adapt heading/copy                    |
| [login-email-code-reference](screens/login-email-code-reference/README.md) | `527:16675`  | `527:16886`      | Reference only; passwordless login excluded                    |
| [oauth-add-email-reference](screens/oauth-add-email-reference/README.md)   | `526:15126`  | `526:15337`      | Reference only; OAuth email collection excluded                |
| [register-password](screens/register-password/README.md)                   | `526:15346`  | `526:15557`      | Password registration; preserve account `displayName` as «Имя» |
| [confirm-exit](screens/confirm-exit/README.md)                             | `746:23037`  | `746:23093`      | Reusable exit confirmation; adapt text to actual action        |

Archive names are not flow contracts: the first “create account” archive shows
login, and the similarly named archive with `1` shows the excluded email-only
login. The `1123×1286` / `1123×1185` canonical parents are multi-phone boards,
not desktop dialog sizes. All six supplied viewports are `390×874`.

## Import integrity

Original `manifest.json`, `design/nodes.json`, assets, reference/fallback PNG,
`fidelity/coverage.json` and `mcp/figma-locator.json` were copied byte for byte.
Per-package `PROVENANCE.json` records the archive SHA-256, capture timestamp,
every copied file and intentional omissions. `CHECKSUMS.sha256` checks copied
source files without changing the source manifest.

Only generated `prompt.md` and flattened whole-screen SVG fallbacks are omitted.
Those SVGs embed the sample page, add no component semantics and duplicate the
reference PNG. Their absence is deliberate, not an incomplete required asset.
`fidelity/coverage.json` describes exporter render stability, **not** verified
production parity. Exporter prompts and generated code are not instructions.

Files remain in the same export layout as the existing field package:
`manifest.json`, `design/`, `references/`, `assets/`, `fidelity/`, `mcp/` and
`fallbacks/` where present. Metadata wrappers and derived maps are additional
handoff artifacts; they do not replace or rewrite source nodes.

## Scope and fidelity

Use the real current portfolio page underneath a dialog. Sample artwork, auction
timers, price/like/cart controls, status-bar pixels and offscreen content in the
captures do not become runtime product data or UI. A reference/fallback PNG is
never rendered as an auth form. `1×1` exporter assets are placeholders, not icons.

New captures change top sheet radius from `20` to `32`, and some ink/button
values. These are scoped auth overrides, not permission to restyle all dialogs
or fields. A live Figma read of `526:14901` on 2026-10-07 differs from the pinned
archive: `16px` medium text, `#2A2A2A` solid border and vertical padding `10`,
instead of archived `14px` semibold, gradient border and padding `12`. Do not
blend those versions or invent a third value. This wave targets the supplied
archive; any move to live Figma requires a separately versioned replacement.

Exact desktop compositions, recovery/reset screen captures, some mixed text
ranges and a complete Google icon asset are absent. See [STYLES.md](STYLES.md)
and [HANDOFF.md](HANDOFF.md). Do not claim complete 1:1 parity for derived or
unresolved states.
