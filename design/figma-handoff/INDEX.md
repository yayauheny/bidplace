# Local versioned Figma handoffs

This index points to the current task-local sources. Read product/design owners
first; visuals do not add fields, permissions or backend behavior.

| Source                                                                                                                               | Scope                                                                                 | Status                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Auth full-screen registration, 2026-10-07](auth/2026-10-07-auth-fullscreen/README.md) | Registration sequence: email `4547:23379`, nickname `4547:24138`, password `4547:24428`, confirmation `4547:25026` (`DEC-105` revision) | Current registration source |
| [Auth dialogs, 2026-10-07](auth/2026-10-07-auth-dialogs/README.md)                                                                   | Login sheet, recovery shell, exit confirmation. Registration sheet `526:15557` is not the registration source | Current for login, recovery, and exit |
| [Text fields, 2026-10-06](fields/2026-10-06-text-fields/README.md)                                                                   | Common eight-state field set `292:5044`                                               | Existing shared field source               |
| Read-only `portfolio-phone-v1` at `/Users/yayauheny/projects/bidplace-home-figma-completion/design/figma-handoff/portfolio-phone-v1` | Remaining portfolio source; exact nodes may be embedded in parent captures            | Immutable canonical library from `d9fb5c2` |

Auth source priority is the `DEC-105` revision: full-screen registration first,
then the dialog bundle for login, recovery, and exit. The dialog registration
sheet is not a fallback for those four full-screen nodes. Keep the old library
and both capture trees intact. Do not substitute an exporter `prompt.md`, a
multi-phone board's width, or a reference screenshot for component
measurements. Runtime code is unchanged until implementation.
