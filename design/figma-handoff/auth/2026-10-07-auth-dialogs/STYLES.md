# Measured auth styles

These are source measurements for implementation, not runtime tokens already
installed. `NODE-MAP.json` and original nodes own exact per-node properties.
Reuse/extend semantic tokens in `packages/design-tokens`; do not duplicate a
route-local token set or overwrite common variants merely because auth differs.

## Sheet shell

| Role                  | Exact source value                                | Evidence                              |
| --------------------- | ------------------------------------------------- | ------------------------------------- |
| Viewport              | `390×874`                                         | all six root frames                   |
| Scrim                 | `#2A2A2A` at `0.5` opacity                        | `526:14884`, other auth overlays      |
| Surface               | `#FFFFFF`; upper corners `32`, lower corners `0`  | `526:14885`, `526:15114`, `526:15557` |
| Sheet width           | `390`; content width `350`                        | same sheet nodes                      |
| Insets                | top `8`, right/left `20`, bottom `20`             | same sheet nodes                      |
| Handle                | `36×4`, `#EFEFEF`; header handle slot `14` high   | `4425:2933` / `4425:2934`             |
| Header                | `350×46`; handle-to-title gap `6`                 | `4425:2932`, `4425:3052`, `4425:3014` |
| Login title           | Inter semibold `18/26`, tracking `−1%`, `#121212` | `4425:2937`                           |
| Form gap              | login `10`; registration/verification `12`        | `526:14891`, `526:15564`, `526:15121` |
| Header-to-content gap | login `14`; registration/verification `16`        | corresponding sheets                  |

Captured heights/positions are default, keyboard-closed evidence, not absolute
page coordinates to paste into code. Login is `545` high at `y=329`;
registration `443` at `431`; verification `319` at `555`; excluded email-only
login `410` at `464`; excluded OAuth add-email `204` at `670`. Content hugs;
errors, keyboard, safe area, small height and zoom must remain usable.

The supplied reference is a bottom sheet on phone, not a centered desktop modal.
Preserve the existing `390px` phone-column behavior at wider widths as a derived
responsive composition, with no claim of desktop Figma parity. A different wide
desktop layout requires an explicit design source/decision. Avoid changing
ShareSheet, filters, viewer or seller dialog geometry as a side effect.

## Inputs and actions

| Role                                             | Exact source value                                                                                                         | Evidence / implementation boundary                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Login email/password and registration name/email | height `51`, radius `18`, inside stroke `0.5`, `#8A8A8A`; placeholder Inter `14/24`                                        | `526:14892`, `526:14894`, `3467:15524`, `526:15566`                                                                |
| Registration password/confirmation               | height `54`, radius `18`, inside stroke `1`; placeholder Inter `16/26`, tracking `−1%`; right eye icon `18` in `26` frame  | `526:15567`/`526:15568`/`526:15570`, `526:15571`/`526:15572`/`526:15574`; explicit auth password variant if needed |
| OTP group                                        | `350×51`, horizontal gap `12`; six fill cells `48.33×51`, radius `12`, inside stroke `0.5`                                 | `558:16980`; cells `526:15123`, `558:16960`, `558:16981`, `558:16985`, `558:16989`, `558:16993`                    |
| Primary button                                   | height `51`, radius `80`, fill/border `#121212`, inside stroke `0.5`; Inter medium `14/26`, tracking `−2%`, `#FFFFFF`      | `4425:3033`, `4425:3028`, `4425:3117`                                                                              |
| Registration text action                         | height `51`; Inter semibold `14/26`, tracking `−2%`, `#565656`; white fill/border                                          | `526:14897`                                                                                                        |
| Forgot-password link                             | Inter regular `12`, `#565656`, right-aligned                                                                               | `526:14895`; no explicit line-height in export                                                                     |
| Provider rows                                    | `350×51`, gap `10`; white pill, radius `80`, border gradient `#D1D1D1 → #EBEBEB`; Inter semibold `14/26`, `−2%`, `#565656` | `526:14899`/`526:14900`/`526:14901`; inspect gradient transform in nodes, do not flatten to nearest solid variant  |
| Resend text action                               | height `47`; Inter semibold `14/26`, tracking `−2%`, `#565656`                                                             | `526:15125`; `32 сек` is example copy, not a cooldown setting                                                      |
| Consent control                                  | black round `20×20`, inner white dot; text starts after gap `6`                                                            | `526:15577`–`526:15580`; source is a selected state, not consent by default                                        |

The common input state board remains
`../../fields/2026-10-06-text-fields/design/nodes.json`: empty, hover, filled,
focus, error, success and disabled. Preserve single focus outline, field-level
errors in normal flow, red error focus and readable disabled states. Filled or
visited fields never automatically become success; no green/mint press flash.
OTP's six-cell anatomy is a separate presentation of one code value; it must not
produce six unrelated form fields or six required Tab stops.

## Exit confirmation

Source `746:23093`: white `366×200` panel, radius `28`, padding `24/20/20/20`,
text group `326×79`, group gap `12`, gap before actions `22`. Title
`746:23095` is Inter semibold `22`, tracking `−2%`, centered, `#121212`; its
text box is `27` high but no explicit line-height is supplied. Body
`746:23096` is Inter regular `15/20`, tracking `−2%`, centered, `#121212`.

Actions `746:23097`: two `159×55` pills, gap `8`, radius `80`, inside stroke
`0.5`, Inter medium `14/26`, tracking `−2%`. Leave `746:23098` is
`#F3F3F3`/`#565656`; continue `746:23099` is `#121212`/`#FFFFFF`.
`366×200` is the captured copy size; changed copy, error and zoom may increase
height. Use one shared component, with operation-specific text and behavior.

## Data gaps: do not guess

- `558:16958` (code explanation) is mixed regular/bold text. Export provides
  size `16`, line-height `22`, tracking `−2%`, but omits exact family/weight
  ranges (`unresolved-mixed-text-style`). Preserve the source and resolve those
  ranges from a matching versioned Inspect before declaring exact parity.
- `526:14902` and `526:15580` omit mixed legal-link ranges, colors and some
  typography. Valid legal destinations and actual consent handling also need
  verification; blue painted words are not working links or persisted consent.
- Title/link line-height may be absent. Node box height is evidence, not a
  fabricated resolved line-height. Do not relabel a derived choice as measured.
- Google vector `I526:14901;298:6024;521:10381` has unresolved mixed fills in
  this export. Available `1×1` PNGs are not a substitute. Resolve a matching
  complete asset; a different provider icon from a package is not exact parity.
- Registration password frames differ from the common field primitive. Extend
  the shared field API only for this measured presentation; preserve behavior
  and other consumers. Do not silently force either `51/14/0.5` or `54/16/1`
  onto every input.
- Forgot/reset default, pending, success and invalid-link screens have no exact
  capture in this batch. Compose them from this shell and existing working
  forms; label the result **derived**, not a 1:1 export. Never use the OAuth
  add-email reference as evidence that password recovery changed.
- Hover/error/pending OTP, unselected consent, open eye, drag thresholds and
  large-screen composition are not fully specified in these static exports.
  Use already documented/shared interaction patterns; unresolved exact values
  stay explicit. Do not add speculative animations or change source files.
