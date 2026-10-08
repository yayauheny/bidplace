# Current fullscreen registration — 2026-10-08

Status: **current visual source; runtime remains Partial**.

This bundle replaces the four fullscreen captures from 2026-10-07. The old
bundle was removed at the founder's request; its files remain recoverable from
Git tree `3b56d84b36c27b623c2dd641a2958729701129c4`. See
[SOURCE-COMPARISON.json](SOURCE-COMPARISON.json) for lineage. In each capture,
only four branding nodes were added; the earlier auth controls did not change.

## Read order

1. [HANDOFF.md](HANDOFF.md): current gaps, ownership and the execution prompt.
2. [catalog.json](catalog.json): archive → root → auth surface → brand slots.
3. [NODE-MAP.json](NODE-MAP.json): source IDs and exact layout/style evidence.
4. Per-screen `design/nodes.json` and reference PNG; originals are unchanged.
5. [STYLES.md](STYLES.md), [ASSETS.json](ASSETS.json),
   [VALIDATION.md](VALIDATION.md) and per-screen provenance/checksums.
6. [Shared brand sources](../../branding/2026-10-08-brand/README.md).

| Step | Root | Surface | Mark slot / vector | Wordmark | Current owner |
| --- | --- | --- | --- | --- | --- |
| [Email](screens/email/README.md) | `4547:23168` | `4547:23379` | `4562:31590` / `4562:31593` | `4562:31592` | `RegisterForm` email |
| [Nickname](screens/nickname/README.md) | `4547:23927` | `4547:24138` | `4562:31610` / `4562:31612` | `4562:31613` | `RegisterForm` nickname |
| [Password](screens/create-password/README.md) | `4547:24217` | `4547:24428` | `4562:31615` / `4562:31617` | `4562:31618` | `RegisterForm`, `AuthPasswordField` |
| [Confirmation](screens/verify-email/README.md) | `4547:24815` | `4547:25026` | `4562:31620` / `4562:31622` | `4562:31623` | `VerifyEmailForm`, `AuthCodeField` |

All reference frames are 390×874. Only the mapped white auth subtree is auth
evidence. Hidden/offscreen artwork, auction controls and placeholder PNGs are
not runtime assets. Exporter prompts are not instructions.

Login, recovery and shared exit confirmation retain the
[dialog source](../2026-10-07-auth-dialogs/README.md). Shared input states retain
the [field source](../../fields/2026-10-06-text-fields/README.md). The read-only
portfolio library and protected Pen were not changed.

The product model remains `DEC-105`: one account, one `User.slug`, author name
entered later, one `register` call. The capture does not authorize OAuth,
passwordless login, duplicate usernames, sample suggestions, a 32-second server
cooldown, or a claim that email delivery has been confirmed.
