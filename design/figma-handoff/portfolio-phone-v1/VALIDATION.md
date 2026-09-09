# portfolio-phone-v1 — final validation

Date: 2026-09-10 (updated after seventh intake)
Scope: read-only audit of local handoff library completeness vs First MVP
Owner docs: `docs/product/05-MVP-RFC.md`, `docs/design/02-USER-FLOWS-AND-SCREENS.md`, `docs/design/09-FIGMA-CUTOVER-GAPS.md`

## Verdict

**PASS — library is complete and locally self-contained for First MVP handoff.**

All 79 catalog packages exist in-repo with the standard file set. Indexes,
checksums, and on-disk paths agree. First MVP screens are either covered by a
local package, covered with commerce slots to hide, or explicitly accepted as
runtime/code stubs per RFC. No package depends on Downloads paths or symlinks.

Remaining gaps are **founder/visual inputs**, not missing copies of files that
already exist in Downloads.

---

## 1. Local file-set audit

| Check | Result |
|-------|--------|
| Packages in `catalog.json` | **79** |
| Packages with full standard set | **79 / 79** |
| Unique layer rasters in `assets/` | **172** |
| Symlinks to Downloads | **0** |
| `.pen` files in library | **0** |
| Whole-frame photo SVG (>5 MB or embedded raster) | **0** |
| Files > 10 MB | **0** |
| `/Users/`, tokens, cookies in `metadata/` | **0** |
| `CHECKSUMS.sha256` vs on-disk files | **732 / 732 match** (re-run after seventh intake + Downloads re-audit) |
| Unique source assets missing from package | **0** |

### Non-blocking archive limits

- The checked-out library is **248 MB**. Its 732 checksummed files reduce to
  **640 unique blobs / 151.8 MiB**; **93.9 MiB** are repeated bytes required by
  self-contained packages. Git stores byte-identical blobs once, but a checkout
  still contains each package copy. Do not duplicate these files into runtime
  assets.
- All 79 source manifests have `fileKey: null` and `fileVersionId: null` because
  the capture plugin could not read the Figma file version. Node IDs, capture
  timestamps, source SHA-256 values, and the inspect-copy ID remain available,
  but the archive cannot cryptographically prove which live Figma revision was
  captured. Live read-only Figma wins on conflict.
- 39 captures contain 45 source-detail warnings below 2× (minimum **0.73×**).
  This does not affect byte completeness, but those layer rasters are reference
  evidence only and must not be promoted to production content or treated as
  retina-ready assets.

### Standard set (every package)

- `reference.png`
- `nodes.json`
- `README.md`
- `metadata/source-prompt.md`
- `metadata/source-manifest.json`
- `metadata/fidelity-coverage.json`
- `metadata/figma-locator.json`
- `assets/*` when the source zip had unique rasters (empty `assets/` only where
  source had none: `apply__identity-abort`, `filters__materials-checkboxes`,
  `text-fields`, `buttons`, `button-icons`)

---

## 2. Index consistency

| Check | Result |
|-------|--------|
| `catalog.json` ids vs `INDEX.md` main table | **79 = 79, no drift** |
| `packagePath` directories exist | **79 / 79** |
| Folder names match viewport + node id | **0 mismatches** |
| Extra packages on disk not in catalog | **0** |
| Fifth-intake aliases duplicated as second copies | **0** (11 aliases skipped per `IMPORT-REPORT.md`) |

Shared / unclassified entries present in catalog and on disk:

- `components/achievements-timeline__1471x641__node-742-20510`
- `components/text-fields__789x552__node-292-5044`
- `components/buttons__714x283__node-292-5058`
- `components/button-icons__250x174__node-297-5598`
- `_unclassified/unclassified__overlay-dimmer__390x874__node-526-13880`

---

## 3. First MVP coverage matrix

Verdicts: `covered` | `covered_hide_slots` | `accepted_stub` | `missing_visual`

| MVP surface | Verdict | Primary local package(s) | Notes |
|-------------|---------|--------------------------|-------|
| Home | **covered_hide_slots** | `home__first-fold__390x860__node-439-4404`, `home__default__390x3372__node-436-1137` | Hide opening-of-week, auctions, prices, timers (`09-FIGMA-CUTOVER-GAPS.md`) |
| Works catalog | **covered** | `works__default__390x2350__node-526-13248`, `filters__root__…`, `filters__materials-radio__…`, `filters__materials-checkboxes__…` | No auction/archive tabs in MVP |
| Authors catalog | **covered** | `authors__default__390x2350__node-526-12904`, `filters__cities__…`, `filters__city-search__…` | City filter; header «Материалы» on cities frame is a known Figma lie |
| Creator profile | **covered_hide_slots** | creator about / works / default / scrolled / share-sheet (10 packages) | Hide public `Архив`, cart, like, bell; share/QR kept |
| Work public page | **covered** | `work__details__390x2390__node-745-21209`, `work__history__390x2390__node-745-20634`, `work__history__390x2706__node-621-19311` | Details tab underline mismatch on `745:21209` documented in package README |
| Work payment/delivery tab | **accepted_stub** | — (no tab capture) | RFC §11: v1 stub in code (`PAYMENT_DELIVERY_STUB`); do not invent a frame |
| Auth email/password | **covered** | `auth__login-password__1123x1286__node-527-16954`, `auth__register-complete__390x874__node-526-15581`, `auth__register-error__1123x1286__node-527-16956` | Login/register boards are 1123 px-wide; verify-email and forgot/reset have no dedicated 390 frame — existing auth flow covers RFC §12 |
| Auth passwordless | **accepted_stub** (POST_MVP) | `auth__email-code__1123x1185__node-527-16955` | Kept in library; RFC defers passwordless code |
| Author application (4 steps) | **covered** | identity, about (variants), contacts, bio, landing, identity-abort | Step 4 private handoff: no dedicated frame; contacts screen exists but copy mentions buyer visibility — RFC §8 requires private handoff; runtime must not expose it publicly |
| Create work (4 steps) | **partial → accepted for handoff** | basics, details, story (+ plain-text alt) | Steps 1–3 covered. **No capture for step 4 review/submit (`Отправить на проверку`).** Shipping, buyer-contact, statuses-sheet, and story-process packages are POST_MVP |
| Search | **accepted_stub** | search overlay packages exist (`search__authors/categories/works-results`) | RFC/runtime: `/search` stub; overlays are reference-only for post-MVP |
| Floating dock | **covered** | dock geometry in Home/Creator `nodes.json` (`Frame 34`) | Code master: `apps/mobile/src/components/figma/FloatingDock.tsx` |
| Admin / cabinet / legal | **accepted_stub** | — | Out of phone-handoff scope; not a library fail |

### POST_MVP packages (keep, do not implement)

- `work__bid-sheet__…`, `work__buy-sheet__…`, `work__bids__…`, `work__announcement__…`
- `work__sold__…`, `work__not-for-sale__…`
- `create-work__statuses-sheet__…`, `create-work__shipping__…`
- `create-work__buyer-contact__…`, `create-work__buyer-contact-repeat__…`
- `create-work__story-process__…`
- `auth__email-code__…`
- `search__authors__…`, `search__categories__…`, `search__works-results__…`

### Hide-in-pixels commerce (keep package, hide slots in code)

- Prices, timers, «Торги», «В продаже», «Продано», «Анонс», cart, like on Work/Home/Creator captures
- Home/Creator/Work/card packages that otherwise remain in MVP scope may still
  contain price, timer, status, archive, cart, or like layers. Those individual
  layers remain hidden even when the package itself is retained.

---

## 4. Components sufficient for MVP

Each role has a **local measurable source** and a **production master**.

| UI role | Local design source | Code master |
|---------|---------------------|-------------|
| Floating dock | `Frame 34` in Home/Creator `nodes.json` | `FloatingDock.tsx`, `FloatingDockFrame*.tsx` |
| Button | `components/buttons__714x283__node-292-5058` (+ screen instances) | `FigmaButton.tsx` |
| Text field | `components/text-fields__789x552__node-292-5044` (+ screen instances) | `FigmaTextField.tsx` |
| Chip | Creator / Work / filters nodes | `FigmaChip.tsx` |
| Icon | `components/button-icons__250x174__node-297-5598` (+ screen instances) | `FigmaIcon.tsx` |
| Work card | `components/work-cover-card__264x352__node-*` (10 samples) + screen grids | `WorkCoverCard.tsx` (`mode="portfolio"`) |
| Author card | `components/author-cover-card__264x352__node-*`, `author-identity-row__348x84__node-874-5591` | `AuthorCoverCard.tsx`, `AuthorIdentity.tsx` |
| Cover frost | Work + Creator hero layers | `CoverFrost.tsx` |
| Author atmosphere | Creator profile captures | `AuthorAtmosphere.tsx` |
| Achievements timeline | `components/achievements-timeline__1471x641__node-742-20510` | Creator about screen |

**Foundation component sets** (sixth + seventh intakes): text fields, buttons,
button icons, work/author cards, filter/sort bar, and materials label now have
dedicated packages; screen captures remain valid cross-checks.
`catalog-segment-tabs` (`874:5421`) is `HIDE_FOR_FIRST_MVP` (auction/buy/archive).
**Known non-blocker:** Geist font files (`09-FIGMA-CUTOVER-GAPS.md`); runtime uses Inter.

---

## 5. Divergence checks (content vs folder names)

Confirmed separate packages (not collapsed):

| Same Russian name | Distinct nodes | Classification |
|-------------------|----------------|----------------|
| «Главная» | `439:4404` (860) vs `436:1137` (3372) | first-fold vs full page |
| «Фильтры чекбоксы» | `526:13009`, `526:13065`, `526:13142`, `584:17554` | cities, city-search, materials-radio, materials-checkboxes |
| «Участие в торгах» | `597:18787`, `526:12056`, `526:12173` | share, bid, buy |
| «вкладка история» | `745:20634` (2390) vs `621:19311` (2706) | two history layouts |
| «Создание работы» | 8 nodes | basics, details, story, shipping, etc. |

Known content lies (documented in package READMEs):

- Work «вкладка детали» body vs «История» underline (`745:21209`)
- Filters cities list under header «Материалы»
- Creator share imported from folder named «сделать ставку»

Catalog `scope` aligns with RFC: fully deferred search, commerce states,
shipping/buyer-contact/process-story, statuses, and email-code packages are
POST_MVP; reusable portfolio packages remain KEEP_FIRST_MVP even when named
commerce layers inside them must be hidden.

---

## 6. Do not implement from this library

Per `docs/design/09-FIGMA-CUTOVER-GAPS.md` and catalog scope:

- Search overlay (categories / authors / works) as live UI
- Bid / buy sheets, bids tab, announcement sale state
- Create-work sale status, sale time, price, «Подробнее о статусах»
- Create-work photo-text process variant (`877:6164`) as MVP story UI
- OAuth (Google / Telegram) on auth boards
- Passwordless email-code flow
- Commerce chrome on cards (price / timer / status) in portfolio mode

---

## 7. Open founder inputs (block visual parity only)

These do **not** fail the handoff library audit but block pixel-perfect MVP if a dedicated Figma frame is required:

1. **Create-work step 4** — review + `Отправить на проверку` (no capture in Downloads list)
2. **Apply step 4** — dedicated private handoff screen (contacts frame exists; no separate private-handoff capture)
3. **Auth** — dedicated 390 px verify-email and forgot/reset frames (1123 boards cover login/register only)
4. **Work** — payment/delivery **tab** frame (RFC allows code stub without Figma tab)

---

## 8. Full Downloads re-audit — 2026-09-10

Re-read **95** user-listed Downloads paths (Frame 6 → Frame 140, plus
create-work / apply / auth / catalogs / Home / Search / Creator). All 95
resolve on disk.

| Check | Result |
|-------|--------|
| Unique Figma nodes in the list | **79** |
| Unique `nodes.json` SHA in the list | **79** |
| Catalog packages | **79** |
| List nodes ⊆ catalog | **yes, exact set** |
| Catalog nodes missing from this list | **0** |
| Unique node in Downloads not imported | **0** |
| Library `nodes.json` SHA vs source zip | **79 / 79 match** |
| Unique source rasters missing from `assets/` | **0** (49 dropped names were byte-identical copies) |
| File-set / secrets / `.pen` / photo SVG / symlinks | still clean |

**16 extra paths** are aliases (same node + same SHA). Keep one package each:

| Node | Copies | Canonical package |
|------|--------|-------------------|
| `526:13756` | 3 | creator share-sheet |
| `526:12904` | 3 | authors catalog |
| `439:4404` | 3 | Home first-fold |
| `621:19475` | 3 | creator about 1609 |
| `526:13351` | 3 | creator works visitor |
| `874:5458` | 2 | work card Frame 5 |
| `874:5473` | 2 | work card Frame 9 |
| `621:19311` | 2 | work history 2706 |
| `526:12980` | 2 | filters root |
| `436:1137` | 2 | Home full page |
| `526:13880` | 2 | overlay dimmer (Frame 140 — solid `#2A2A2A` 50% veil, not a screen) |

Same Russian names with **different** nodes stay separate (Frame 4 ×2,
«Главная» ×2, history ×2, «Участие в торгах» ×3, «Фильтры чекбоксы» ×4,
eight create-work, nine apply fills).

Nothing in this list is a create-work review/submit, apply private-handoff,
390 auth verify/forgot, or Work payment/delivery tab. Those remain founder
visual gaps, not forgotten copies.

---

## 9. Re-run checklist

After any new import:

1. Repeat sections 1–2 checks (file set, index drift, checksums).
2. Regenerate `CHECKSUMS.sha256`.
3. Update `IMPORT-REPORT.md` and this file if MVP coverage changed.
