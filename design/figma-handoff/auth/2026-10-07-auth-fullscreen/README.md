# Auth full-screen proposals — 2026-10-07

Status: **registration source after the `DEC-105` revision**. Captures are unchanged.

These four captures are the registration sequence. Login, recovery, and exit
confirmation stay in the
[dialog bundle](../2026-10-07-auth-dialogs/README.md). No runtime changes are
included in this handoff revision.

## Read order

1. [catalog.json](catalog.json): archive → capture root → actual auth surface.
2. [NODE-MAP.json](NODE-MAP.json): exact overlay/auth subtree, original styles,
   geometry, text and fidelity warnings. Not a component implementation.
3. Per-screen `design/nodes.json`, `references/`, `assets/`, `manifest.json`,
   `fidelity/coverage.json` and `mcp/figma-locator.json` in original export layout.
4. [STYLES.md](STYLES.md): measured values and differences from prior sheets.
5. [DISCUSSION.md](DISCUSSION.md): what the `DEC-105` revision settled, and what is still open.
6. [ASSETS.json](ASSETS.json), per-screen `PROVENANCE.json` and
   [VALIDATION.md](VALIDATION.md).

## Mapping

| Step | Capture | Root | Auth surface | Component |
| --- | --- | --- | --- | --- |
| Email | [Email](screens/email/README.md) | `4547:23168` | `4547:23379` | `RegisterForm` email step |
| Nickname | [Nickname](screens/account-name-reference/README.md) | `4547:23927` | `4547:24138` | `RegisterForm` username step |
| Password | [Create password](screens/create-password/README.md) | `4547:24217` | `4547:24428` | `RegisterForm` password step, `AuthPasswordField` |
| Confirm email | [Verify email](screens/verify-email/README.md) | `4547:24815` | `4547:25026` | `verify-email.tsx`, `VerifyEmailForm`, `AuthCodeField` |

All captures are `390×874`. Their roots also contain hidden/offscreen sample
artwork and commerce UI. Only the mapped overlay/auth subtree is auth evidence.
Do not import that background into the product, use PNG as an interactive form,
render an exporter prompt, or treat a 1×1 PNG as an icon.

## Registration contract

The `DEC-105` revision is the product decision. This file does not replace it.

- One `User`. Author capability is the existing `SellerProfile` of that user.
  Settings do not add a second account.
- Step order is email, nickname, password, then the existing email
  confirmation. Values stay in one form. `register` is called once, from the
  password step. Password confirmation is client-only.
- The nickname step writes `User.slug`. It does not write `displayName`.
  The name is `SellerProfile.fullName`, entered later in the author profile.
- There is no `User.username`. The author form does not edit a second slug.
  Existing public addresses are copied onto `users.slug` unchanged, then
  `seller_profiles.slug` is dropped. An account with no slug sets it once
  before the author application, using this nickname field. A later nickname
  change is not part of this wave. Old revision snapshots do not become the
  public address. The migration steps are in the `DEC-105` revision.
- Availability on `4547:24138` is a read. It does not reserve the nickname.
  The chips `niko631`, `niko632`, and `niko633` are sample data, not a
  suggestion API. Conflict is returned by `register`.
- The email step does not check whether an account exists. The caption
  «Зарегистрируйтесь или войдите» is not a combined login.
- Login stays dialog `526:14885`. Recovery stays the single-use link. Exit
  confirmation and the history owner stay as they are.
- `32 сек`, the example email, and the sample OTP digits are not server
  settings. The cooldown stays 60 seconds. Confirmation copy must not say the
  letter arrived merely because the request was accepted.
- This bundle has no back/close control, no Google asset, no recovery frames,
  and no desktop frames. Do not invent them from the dialog registration sheet
  `526:15557`.

## Consent, three separate gaps

- Styled ranges for `4547:23406` are absent (`unresolved-mixed-text-style`).
  The same gap remains on dialog nodes `526:14902`, `526:15580`, and
  `558:16958`, and on confirmation copy `4547:25029`. A versioned Inspect with
  those ranges is required before calling the type 1:1. Missing ranges do not
  choose consent behavior.
- No capture in either auth bundle is a public privacy or rules page, and the
  mobile app has no such route. Do not invent the page or its copy.
- `POST /auth/acceptRules` already stores `TermsAcceptance` for the signed-in
  user and `CURRENT_RULES_VERSION`. The client does not call it. The checkbox
  frames `4547:23401` and `4547:23404` are drawn selected in the sample. Do not
  reproduce that selected state and do not treat it as saved consent. Wiring
  `acceptRules` needs the missing page source, or an explicit owner decision
  that registration may proceed without persisted acceptance. That decision is
  not in this revision.

The read-only `portfolio-phone-v1`, both capture trees, the field-state bundle,
and the protected Pen remain intact. Runtime stays on `displayName` until the
implementation prompt in the dialog handoff is executed.
