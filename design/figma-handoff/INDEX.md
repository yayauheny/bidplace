# Local versioned Figma handoffs

This index points to the current task-local sources. Read product/design owners
first; visuals do not add fields, permissions or backend behavior.

| Source                                                                                                                               | Scope                                                                                 | Status                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| [Auth dialogs, 2026-10-07](auth/2026-10-07-auth-dialogs/README.md)                                                                   | Six mapped auth/exit captures; scoped override of the old parent captures (`DEC-105`) | Imported, planned UI; see fidelity gaps    |
| [Text fields, 2026-10-06](fields/2026-10-06-text-fields/README.md)                                                                   | Common eight-state field set `292:5044`                                               | Existing shared field source               |
| Read-only `portfolio-phone-v1` at `/Users/yayauheny/projects/bidplace-home-figma-completion/design/figma-handoff/portfolio-phone-v1` | Remaining portfolio source; exact nodes may be embedded in parent captures            | Immutable canonical library from `d9fb5c2` |

For auth, start with the newer bundle's catalog/node map after checking the
parent source comparison. Keep the old library intact. Do not substitute an
exporter `prompt.md`, a multi-phone board's width or a reference screenshot for
component measurements. Runtime styles remain unchanged until implementation.
