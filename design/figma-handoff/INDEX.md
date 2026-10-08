# Local versioned Figma handoffs

This index points to the current task-local sources. Read product/design owners
first; visuals do not add fields, permissions or backend behavior.

| Source                                                                                                                               | Scope                                                                                 | Status                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Auth full-screen registration, 2026-10-08](auth/2026-10-08-auth-fullscreen/README.md) | Current email/nickname/password/confirmation with top mark and bottom wordmark (`DEC-105`, `DEC-106`) | Current source; previous four fullscreen captures removed from checkout |
| [Brand sources, 2026-10-08](branding/2026-10-08-brand/README.md) | Original supplied SVG and exact mark/wordmark vector derivatives | Replacement target; runtime uses previous branding |
| [Auth dialogs, 2026-10-07](auth/2026-10-07-auth-dialogs/README.md)                                                                   | Login sheet, recovery shell, exit confirmation. Registration sheet `526:15557` is not the registration source | Current for login, recovery, and exit |
| [Text fields, 2026-10-06](fields/2026-10-06-text-fields/README.md)                                                                   | Common eight-state field set `292:5044`                                               | Existing shared field source               |
| Read-only `portfolio-phone-v1` at `/Users/yayauheny/projects/bidplace-home-figma-completion/design/figma-handoff/portfolio-phone-v1` | Remaining portfolio source; exact nodes may be embedded in parent captures            | Immutable canonical library from `d9fb5c2` |

Auth source priority is the `DEC-105` revision: full-screen registration first,
then the dialog bundle for login, recovery, and exit. `DEC-106` replaces only
the four 2026-10-07 fullscreen captures; lineage and recoverable Git tree are in
the new `SOURCE-COMPARISON.json`. The dialog registration sheet is not a fallback
for those fullscreen nodes. Keep the read-only library, retained dialogs and
common fields intact. Do not substitute an exporter `prompt.md`, a
multi-phone board's width, or a reference screenshot for component
measurements. This source update does not change runtime code. The current
combined prompt is the new fullscreen bundle's `HANDOFF.md`.
