# First story field and photo sending status — 2026-10-27

Status: **Partial**. Follow-up to `6d51920d` on `feature/photo-workflow`.
Scope: preserve the first text input instance/key, keep blank-save filtering,
clarify sending status without layout changes, remove the duplicate empty hint.
No DnD implementation, server API, storage or other mechanism changes.

## Root cause and correction

The empty field was a standalone `StoryTextInput`; first input replaced it with
a keyed `ProductBlockActions` subtree containing a new field. Refocusing that
new field could not preserve the original instance/composition/caret.
The UI now renders the virtual paragraph through the same keyed list subtree.
Its stable key is passed to the existing story owner's `addText` when adopted.
Initial typing does not request focus repair; explicit text/heading insertion
retains its existing focus behavior. Filled stories get no extra empty block.
The existing serializer still omits blank/whitespace text when saving. The
duplicate «Начните создавать тут» pill is removed; the field placeholder remains.

The existing reserved photo-caption area now says «Загрузка фотографий» while a
card is actually sending, instead of calling that phase preparation. Preparation,
order confirmation and completed counts remain distinct. No row/card/CTA geometry
was changed and no artificial runtime delay was added.

## Addressed checks

- Story owner adopts the supplied empty-field key, keeps it through typing and
  clearing to whitespace, then sends no blank block on save.
- Photo owner render test transitions through local preflight, preparation,
  sending, order confirmation and completion with the expected text.
- Existing media E2E now holds the actual image POST and asserts sending text,
  unchanged status height and unchanged grid Y. After upload, the existing
  decode/error/Retry checks still run.
- It retains a handle to the initial textarea, types the first character and
  more characters, moves the caret and inserts in the middle (`АБ!В`). The
  original node must stay connected and focused; selectionStart must be3.
  Clearing to whitespace keeps the original node and exposes «Пропустить».
  The duplicate hint is absent. Existing text-growth/menu/focus checks continue.

| State | Chromium | WebKit |
| --- | --- | --- |
| Actual network sending | [sending](chromium-sending-390.png) | [sending](webkit-sending-390.png) |
| Empty story, one placeholder | [empty](chromium-empty-story-390.png) | [empty](webkit-empty-story-390.png) |
| Entered story | [story](chromium-story-390.png) | [story](webkit-story-390.png) |

**Not implemented requirement:** automatic server-side reuse of an identical file
chosen for gallery and story. The current session SHA-256 only detects repeated
gallery selection; it is not that feature and does not prove server content,
variant compatibility, reference ownership or cleanup safety. That requirement
remains separate and unfinished.

Existing Web8081/API3017 were reused with new disposable fixtures; no database
reset or user-account cleanup. DnD was not expanded. Physical Native, system ghost,
the user's manual DnD failure and live CDN acceptance remain open. Export is a
build check, not physical-device acceptance. Final commands/results are recorded
in the [workflow audit](../../2026-10-26-PHOTO-WORKFLOW.md).
