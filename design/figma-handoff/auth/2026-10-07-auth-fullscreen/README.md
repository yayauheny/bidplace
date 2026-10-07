# Auth full-screen proposals — 2026-10-07

Status: **imported and inspected; presentation and flow decisions pending**.

Four designer updates supplied by the founder. These captures complement the
[earlier auth sheets](../2026-10-07-auth-dialogs/README.md); they do not silently
replace approved auth behavior, tokens or source priority. No runtime changes.

## Read order

1. [catalog.json](catalog.json): archive → capture root → actual auth surface.
2. [NODE-MAP.json](NODE-MAP.json): exact overlay/auth subtree, original styles,
   geometry, text and fidelity warnings. Not a component implementation.
3. Per-screen `design/nodes.json`, `references/`, `assets/`, `manifest.json`,
   `fidelity/coverage.json` and `mcp/figma-locator.json` in original export layout.
4. [STYLES.md](STYLES.md): measured values and differences from prior sheets.
5. [DISCUSSION.md](DISCUSSION.md): unconfirmed decisions; not executor instructions.
6. [ASSETS.json](ASSETS.json), per-screen `PROVENANCE.json` and
   [VALIDATION.md](VALIDATION.md).

## Mapping

| Capture | Root | Auth surface | Proposed use |
| --- | --- | --- | --- |
| [Email](screens/email/README.md) | `4547:23168` | `4547:23379` | First email step |
| [Account name reference](screens/account-name-reference/README.md) | `4547:23927` | `4547:24138` | Username proposal; contract conflict below |
| [Create password](screens/create-password/README.md) | `4547:24217` | `4547:24428` | Password and confirmation |
| [Verify email](screens/verify-email/README.md) | `4547:24815` | `4547:25026` | Existing email confirmation presentation |

All captures are `390×874`. Their roots also contain hidden/offscreen sample
artwork and commerce UI. Only the mapped overlay/auth subtree is auth evidence.
Do not import that background into the product, use PNG as an interactive form,
render an exporter prompt, or treat a 1×1 PNG as an icon.

## Confirmed contracts and pending differences

- The current account is one `User` with `displayName`; author nickname/slug
  belongs to the optional `SellerProfile`. `SellerProfile.userId` is unique.
  The new availability/suggestion screen is a proposal, not authorization to
  add an account nickname, public account profile, migration or lookup API.
- Standard email/password login, existing email verification and single-use
  reset-link recovery remain the confirmed flow. An email-first combined screen
  does not authorize account-existence probing or email-code login.
- Existing Google/Telegram unavailability placeholders remain unchanged.
- `32 сек`, example email, OTP digits and username suggestions are designer sample
  data. Actual resend cooldown remains server controlled (currently 60 seconds).
- The reference says a code arrived; runtime must not claim inbox delivery from
  request acceptance. Prior field validation and privacy remain authoritative.
- Full-screen versus sheet, step order, Back/exit controls, consent behavior,
  keyboard/zoom and wider viewport adaptation await an explicit decision.
- The new source has no Google/Telegram rows, recovery states, keyboard states,
  error captures, navigation controls or desktop layouts. It cannot resolve the
  older sheet Google-asset gap or supply geometry for those missing states.

The read-only `portfolio-phone-v1`, old auth bundle, common field-state bundle
and protected Pen remain intact. Confirm source adoption before updating
runtime styles or the canonical flow documents.
