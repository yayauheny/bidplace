# Measured full-screen auth values

These are captured source values, not installed runtime tokens. `nodes.json`
owns geometry; `NODE-MAP.json` is an exact extraction of each auth subtree.

- Full white surface: `390×874`, no exported corner-radius property, vertical
  auto-layout, centered along both axes, gap `16`, padding `8/20/20/20`.
  Previous source uses a content-height bottom sheet and top radius `32`.
- Content width: `350`. Keep centering/auto-layout intent; sample y coordinates
  are evidence at 390×874, not offsets to paste into responsive code.
- Heading: Inter `20/22`, weight `600`, `#121212`, tracking `−2%`, centered.
  Earlier sheet heading is `18/26`.
- Plain explanation: Inter `14/20`, weight `400`, `#565656`, centered.
- Primary actions: `350×51`, Inter `14/26`, weight `500`, tracking `−2%`,
  white text on `#121212`, radius `80`; the stroke is a transformed
  `#2A2A2A → #585858` gradient, not a solid border. Keep its exported matrix.
- Email and nickname input: `350×51`, placeholder Inter `14/24`.
- Password fields: `350×53`, placeholder Inter `14/24` in these captures.
  Prior registration source uses `16/26`; do not mix versions implicitly.
- OTP: six source cell instances, `55×61`, group width `350`, gap `4`;
  radius `18`, digit Inter `24/34`. Older sheet uses `48.33×51`, group gap `12`.
  This is still one accessible code value, not six independent credentials.
- Resend action is `350×51`; example text uses Inter `14/26`, weight `500`, `#565656`.
  Earlier sheet resend is `47` high.
  The displayed 32 seconds is not a new cooldown setting.
- Username positive/negative copy: `#267B07` / `#731A06`, Inter `14/20`,
  weight `500`. Both appear in the design board simultaneously as examples;
  runtime must not claim either state without a real approved contract.

Missing values/states remain missing: mixed code copy `4547:25029` and consent
copy `4547:23406`, real consent/link contract, unselected/selected behavior,
error/pending/keyboard states, close/back affordances and desktop source.
No navigation or animation may be inferred from the static frame alone.
