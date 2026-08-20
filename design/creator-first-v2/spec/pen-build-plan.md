# bidplace creator-first — pen build plan V2.1

Status: **do not build or modify any `.pen` file yet.** Visual explorations of the nine golden candidates happen first. Pen starts only after founder selects or combines a direction and tokens lock.
Direction: «Площадка авторов, а не журнал» — see `DESIGN-DIRECTION.md`.
Packet: `design/creator-first-v2/`.
Sources of truth, in priority order:

1. `design-system.yaml` — tokens, accent_selection, composition principles, iconography, classification.
2. `component-specs.yaml` — data/behavior plus visual anatomy (geometry still provisional).
3. `screen-blueprints.yaml` — golden screens × three explorations (`v2_gate`).
4. `content-fixtures.yaml` — unchanged text, numbers, accent assignment ids, media manifest.

The builder invents nothing. If a needed value is absent, it stops that element, records `Missing spec: <element>`, and continues.

## V2.1 gate — nine explorations before a locked recipe, then Pen

Authorized visual work **now** (not Pen):

Same content, hierarchy, fixtures, routes, auction rules, a11y. Different composition / scale / media / type / space / accent.

| # | candidate | viewport | screen | direction |
|---|-----------|----------|--------|-----------|
| G1A | home/1440/type-dominant | 1440 | home | A — type dominant |
| G1B | home/1440/media-dominant | 1440 | home | B — media dominant |
| G1C | home/1440/graphic-interplay | 1440 | home | C — graphic interplay |
| G2A | creator-profile/1440/type-dominant | 1440 | creator_profile | A — name dominates |
| G2B | creator-profile/1440/media-dominant | 1440 | creator_profile | B — portrait dominates |
| G2C | creator-profile/1440/graphic-interplay | 1440 | creator_profile | C — portrait + type + optional slab |
| G3A | work-detail/1440/live-type-dominant | 1440 | work_detail LIVE | A — type + transaction vs media |
| G3B | work-detail/1440/live-media-dominant | 1440 | work_detail LIVE | B — near-full-height media |
| G3C | work-detail/1440/live-graphic-interplay | 1440 | work_detail LIVE | C — shared-space / limited overlap |

Stop. Founder selects or combines a direction.

Then, in order:

1. Update golden screen blueprints to the selected composition.
2. Lock display typography, radius, and accent usage.
3. Propagate the design system.
4. Remaining states / viewports.
5. **Only then** Pen implementation.

Do **not** build F001–F118, and do **not** create component boards except what is required to render the nine explorations, before this gate.

Forbidden translation: `rounded colored container + tilted stack inside`.
Do not treat pills as forbidden. Do not lock exact golden geometry before selection.

Human reading rhythm (required of every exploration):
- one dominant visual event per viewport;
- first / second / ignore-until-continue is obvious;
- macro whitespace is allowed and not auto-filled;
- density is local; the page breathes between sections;
- remove chrome before increasing gaps;
- pass the AI-like design check (`DESIGN-DIRECTION.md` §8).

## 0. Ground rules for the builder (when authorized)

- New Pen file only: `design/pen/bidplace-creator-first-v2.pen`. Never open, edit, or resave `design/pen/bidplace-web-v2.pen`, `design/pen/bidplace-creator-first-v1.pen`, or any other existing `.pen`.
- No application code changes.
- All styles come from V2.1 tokens. `#FAF4EA`, radius 24/28/999 as defaults, and Piazzolla-as-display are not in this system. Display sizes, radius, and strong-accent usage remain provisional until lock.
- **Fonts and icons:** Gate M files in this packet. Golos is the UI family and the **starting** display candidate (`provisional_until_golden_approval`). Piazzolla only if a frame explicitly uses `editorial_quote`.
- **Accents:** never computed. Use fixture `accent_assignments` ids. `brown` is a deprecated alias of `red` (`accent_red_*`). Assigned accent ≠ visible strong accent. Soft accents are chips/hover, not scene fills.
- Future boards still carry «Будущее — не MVP»; none of that is in the nine golden explorations.
- **Allowed visible-text sources (exactly two):** (1) `content-fixtures.yaml` including `ui_copy`, and (2) labels explicitly quoted in «guillemets» inside `component-specs.yaml` and `screen-blueprints.yaml`.
- **Media:** only `content-fixtures.yaml media_asset_manifest` via `asset_id`. Paths in fixtures still say `design/creator-first-v2/assets/media/` — if the V2 packet copy has the same files under `design/creator-first-v2/assets/media/`, use the V2 copies. Do not generate images.
- **Logo:** symbol only, 28×28, `design/creator-first-v2/assets/logo/logo-transparent-256.png`.
- Cyrillic fixtures verbatim.

## Gate M — media-preparation gate (blocks the later build)

The nine golden explorations may not start until these paths exist. The Pen builder (later) must not download, search, or export fonts or icons, and must not invent photographs.

### Fonts (7 files)

| family | weight | packet path | V2.1 role |
|---|---|---|---|
| Golos Text | 400 | `design/creator-first-v2/assets/fonts/GolosText-Regular.ttf` | body |
| Golos Text | 500 | `design/creator-first-v2/assets/fonts/GolosText-Medium.ttf` | UI |
| Golos Text | 600 | `design/creator-first-v2/assets/fonts/GolosText-SemiBold.ttf` | titles / display_3 |
| Golos Text | 700 | `design/creator-first-v2/assets/fonts/GolosText-Bold.ttf` | starting display_1 / display_2 / prices (display family provisional) |
| Piazzolla | 500 | `design/creator-first-v2/assets/fonts/Piazzolla-Medium.ttf` | optional editorial_quote only |
| Piazzolla | 600 | `design/creator-first-v2/assets/fonts/Piazzolla-SemiBold.ttf` | optional editorial_quote only |
| Piazzolla | 700 | `design/creator-first-v2/assets/fonts/Piazzolla-Bold.ttf` | optional editorial_quote only |

Status: ready — files exist at those paths (`design-system.yaml typography.families.*.packet_status`).

### Phosphor SVG — 25 core icons (regular)

Exact packet paths from `design-system.yaml iconography.required[].svg_packet_path`:

1. `design/creator-first-v2/assets/icons/regular/magnifying-glass.svg`
2. `design/creator-first-v2/assets/icons/regular/plus.svg`
3. `design/creator-first-v2/assets/icons/regular/arrow-right.svg`
4. `design/creator-first-v2/assets/icons/regular/arrow-up-right.svg`
5. `design/creator-first-v2/assets/icons/regular/arrow-left.svg`
6. `design/creator-first-v2/assets/icons/regular/x.svg`
7. `design/creator-first-v2/assets/icons/regular/share-network.svg`
8. `design/creator-first-v2/assets/icons/regular/clock.svg`
9. `design/creator-first-v2/assets/icons/regular/caret-down.svg`
10. `design/creator-first-v2/assets/icons/regular/check.svg`
11. `design/creator-first-v2/assets/icons/regular/warning.svg`
12. `design/creator-first-v2/assets/icons/regular/image-broken.svg`
13. `design/creator-first-v2/assets/icons/regular/camera.svg`
14. `design/creator-first-v2/assets/icons/regular/camera-slash.svg`
15. `design/creator-first-v2/assets/icons/regular/dots-six-vertical.svg`
16. `design/creator-first-v2/assets/icons/regular/trash.svg`
17. `design/creator-first-v2/assets/icons/regular/arrow-square-out.svg`
18. `design/creator-first-v2/assets/icons/regular/telegram-logo.svg`
19. `design/creator-first-v2/assets/icons/regular/instagram-logo.svg`
20. `design/creator-first-v2/assets/icons/regular/globe.svg`
21. `design/creator-first-v2/assets/icons/regular/house.svg`
22. `design/creator-first-v2/assets/icons/regular/compass.svg`
23. `design/creator-first-v2/assets/icons/regular/user.svg`
24. `design/creator-first-v2/assets/icons/regular/circle-notch.svg`
25. `design/creator-first-v2/assets/icons/regular/heart.svg`

Fill counterparts used only on designed_post_mvp frames: `design/creator-first-v2/assets/icons/fill/heart.svg`, `design/creator-first-v2/assets/icons/fill/bookmark.svg`. Additional designed_post_mvp SVGs (not in the core 25, never on MVP frames): `regular/bookmark.svg`, `regular/play.svg`, `regular/pause.svg`, `regular/speaker-high.svg`, `regular/speaker-slash.svg`.

Status: ready — all 32 SVGs exist. Do not export from `@phosphor-icons/react` at build time.

### Logo symbol (1 display file)

- Packet: `design/creator-first-v2/assets/logo/logo-transparent-256.png` only
- Source copy: `/Users/yayauheny/Downloads/Telegram Desktop/logo_assets_web_expo/web/logo-transparent-256.png`
- Display: 28×28 in `global_navigation`. No wordmark, no 512.png, no logo.svg.

### Media assets (24 files)

Every `content-fixtures.yaml media_asset_manifest.assets[].asset_path` with `status: ready` (24 files under `design/creator-first-v2/assets/media/`). Each media slot in fixtures points at these via `asset_id`; the builder never infers an asset from a filename, and never searches or generates imagery.

If any Gate M file is absent at build time, the builder stops the affected frames, records `Missing asset: <id or path>`, and continues with frames that need no missing file.

## 1. After direction lock — foundations (reuse everywhere)

1. **Token styles**: locked color, type, radius after founder selection. Golos remains UI. Display family is whatever was approved. Piazzolla only `editorial_quote`.
2. **`foundations/tokens`**: swatch grid, type ramp in Russian sample «Тихий берег — Полина Мирош», spacing, radius (not 24/28/999 as the hero), accent row with assigned vs visible-strong note.
3. **`foundations/icons`**: 24px grid, Phosphor required set.

Do not recreate V1 beige/serif boards. Do not build this board before the nine explorations are selected unless a token sheet is required to render them.

## 2. After direction lock — component masters that the selected screens actually use

Build only what the selected golden compositions need, then the rest:

`global_navigation`, `creator_action`, `search_entry`, `status_chip`, `work_card`, `creator_card`, `media_stack`, `work_scene`, `creator_scene`, `story_chapter`, `process_steps`, `section_header`, `rail`, `auction_panel` (LIVE eligible), `footer`.

Visual anatomy = component-specs after lock. Data/states unchanged.

`auction_panel` remaining 12 semantic states and `bid_dialog` stay on the bid-states board **after** the golden gate.

## 3. After direction lock — remaining P0/P1/future

The exhaustive F001–F118 manifest below is **preserved as the later product-coverage contract**. It is not the V2.1 art-direction sequence.

Order after founder selection:

1. Golden-screen derivatives: long-content, minimal, loading, error, 1024, 390 for the same three routes.
2. Bid-states board (product coverage; quiet auction visual).
3. Explore / auth / onboarding / creation.
4. Future boards.

## 4–5. Unchanged product coverage

P1 screens and labeled future boards remain required for a full product Pen. They are not built in the V2.1 exploration pass.

## 6. Frame manifest (exhaustive — later, after golden gate)

| # | Board frame | Masters | Variants/states to show |
|---|-------------|---------|-------------------------|
| 1 | `components/status_chip/board` | status_chip | LIVE, SCHEDULED, SOFT_CLOSE, ENDED, ENDED_WON |
| 2 | `components/tab_pill/board` | tab_pill | tabs, status_filter × default, hover, focus, active, disabled |
| 3 | `components/filter_chip/board` | filter_chip | dropdown, sheet × default, open, applied, focus, disabled |
| 4 | `components/form_field/board` | form_field, inline_validation | field variants text/textarea/numeric/email/code × default, focus, filled, disabled, error, success, loading; validation states idle, loading, success, error, info |
| 5 | `components/search_entry/board` | search_entry | desktop_compact, explore_full, mobile_explore × default, hover, focus, filled, loading, disabled |
| 6 | `components/work_card/board` | work_card | standard, wide, square, plate × default, hover, focus, pressed, loading, image_missing; content cases: long_title (fixture work_long_title_live), minimal (fixture work_minimal_scheduled) |
| 7 | `components/creator_card/board` | creator_card | grid, rail × default, hover, focus, pressed, photo_missing, long_name |
| 8 | `components/media_stack/board` | media_stack | multi, single × default, advancing, focus, reduced_motion, image_error, loading |
| 9 | `components/work_scene/board` | work_scene | profile_release, home_featured, color_field; states default, single_image, reduced_motion (no_current_release = omission note) |
| 10 | `components/creator_scene/board` | creator_scene | desktop, tablet, mobile × default, photo_missing, minimal_content, long_content, loading, reduced_motion |
| 11 | `components/story_group/board` | story_chapter, process_steps, facts_group, creator_links | chapter plain_offset/media_led/color_field/split/text_only + no_media + long_text; steps editorial_sequence/list/filmstrip/text_only; facts two_column/stacked/missing_optional/long_values; links row/wrap |
| 12 | `components/bid_history_row/board` | bid_history_row | default, own_bid, leader marker, list_loading, empty («Ставок пока нет»), error |
| 13 | `components/sticky_bid_bar/board` | sticky_bid_bar | eligible, guest, leading × visible, hidden (note), ended_removed, reduced_motion |
| 14 | `components/navigation/board` | global_navigation, creator_action (masters) | nav desktop guest/authenticated, scrolled, nav_overlay_open, mobile top bar, mobile bottom nav; creator_action variants shown on their stage-4 board |
| 15 | `components/step_shell_group/board` | creator_step_shell, media_input, review_submit | shell form/media/choice/review + all shell states; media_input profile_photo_single/work_gallery_grid + empty, uploading, uploaded, upload_error, permission_denied, limit_reached, reorder_active; review complete/incomplete/submitting/submit_error/submitted |
| 16 | `components/feedback_group/board` | skeleton, error_block, empty_state, section_header, rail, footer, auth_panel (master) | per component-specs states |

`auction_panel` and `bid_dialog` masters are also built in stage 2 (after №1 and №4), but their state board is `bid-states` in stage 3 — no duplicate stage-2 board.

Component board acceptance: every state listed in `component-specs.yaml states` appears once; `do_not_invent` items absent; text only from the two allowed sources.

## Later stages (after direction lock)

P0 remaining frames F019–F059, P1 F060–F106, future F107–F118: same product coverage as V1. Visual rules from this V2.1 packet. Gate C is now **after the nine explorations and founder selection**, not after the full P0 set.

The original stage-3/4/5 lists and the F001–F118 table that follow remain the coverage checklist.

## 4. Build order — stage 4: P1 screens

Frames F060–F106 in the manifest (§6).

## 5. Build order — stage 5: labeled future boards (after P0 approved)

Frames F107–F118 in the manifest (§6): `follow_creator`, `wishlist_saved_work`, and `video_process_story` designed_post_mvp boards plus the concepts board. Every frame carries a visible «Будущее — не MVP» chip. Bidding is confirmed_mvp; follow, wishlist, and process video are designed_post_mvp — annotate this on those boards.

## 6. Frame manifest (exhaustive — every frame, in build order)

Semantic auction model (fixed): **13 semantic `auction_panel` states + 8 semantic `bid_dialog` states = 21 semantic states, shown as 19 visual frames** (F041–F059). Derivatives: F049 shows dialog `accepted` + panel `leading` in one interaction frame; F047 is the 390 viewport derivative of dialog `editing`; F054 carries dialog `soft_close_notice` as a labeled inset; dialog `repeat_bid` is an annotation on F046.

| # | frame_name | viewport | screen id | fixture id(s) | state / variant | component master ids |
|---|-----------|----------|-----------|---------------|-----------------|----------------------|
| F001 | foundations/tokens | board | — | ui_copy samples | — | none |
| F002 | foundations/icons | board | — | — | — | none |
| F003 | components/status_chip/board | board | — | works listings | all 5 variants | status_chip |
| F004 | components/tab_pill/board | board | — | ui_copy | all variants/states | tab_pill |
| F005 | components/filter_chip/board | board | — | ui_copy | all variants/states | filter_chip |
| F006 | components/form_field/board | board | — | ui_copy | all variants/states | form_field, inline_validation |
| F007 | components/search_entry/board | board | — | ui_copy.nav | all variants/states | search_entry |
| F008 | components/work_card/board | board | — | work_rich_live, work_long_title_live, work_minimal_scheduled | all variants/states + content cases | work_card, status_chip |
| F009 | components/creator_card/board | board | — | creator_rich, creator_minimal, creator_long_names | all variants/states | creator_card |
| F010 | components/media_stack/board | board | — | work_rich_live, work_minimal_scheduled | multi, single + states | media_stack |
| F011 | components/work_scene/board | board | — | work_rich_live, work_minimal_scheduled | all variants/states | work_scene, media_stack, status_chip |
| F012 | components/creator_scene/board | board | — | creator_rich, creator_minimal, creator_long_names | all variants/states | creator_scene, creator_links |
| F013 | components/story_group/board | board | — | work_rich_live | all variants/states | story_chapter, process_steps, facts_group, creator_links |
| F014 | components/bid_history_row/board | board | — | bid_history_fixture | all variants/states | bid_history_row |
| F015 | components/sticky_bid_bar/board | board | — | work_rich_live | eligible, guest, leading × states | sticky_bid_bar |
| F016 | components/navigation/board | board | — | ui_copy.nav | nav states (creator_action variants → F073–F080) | global_navigation, creator_action, search_entry |
| F017 | components/step_shell_group/board | board | — | ui_copy.onboarding, ui_copy.work_creation | all variants/states | creator_step_shell, media_input, review_submit, form_field |
| F018 | components/feedback_group/board | board | — | ui_copy.errors, ui_copy.empty, ui_copy.auth | per spec states | skeleton, error_block, empty_state, section_header, rail, footer, auth_panel |
| F019 | creator-profile/1440/default | 1440 | creator_profile | creator_rich, work_rich_live | default | creator_scene, work_scene, tab_pill, work_card, story_chapter, rail, footer, global_navigation |
| F020 | creator-profile/1440/other-discipline | 1440 | creator_profile | creator_other_discipline, work_ceramics_live | default (other discipline) | creator_scene, work_scene, tab_pill, work_card, story_chapter, rail, footer, global_navigation |
| F021 | creator-profile/1440/long-content | 1440 | creator_profile | creator_long_names, work_long_title_live | long_content | creator_scene, work_scene, tab_pill, work_card, story_chapter, rail, footer, global_navigation |
| F022 | creator-profile/1440/minimal-content | 1440 | creator_profile | creator_minimal, work_minimal_scheduled | minimal_content (photo_missing) | creator_scene, work_scene, tab_pill, work_card, story_chapter, rail, footer, global_navigation |
| F023 | creator-profile/1440/loading | 1440 | creator_profile | — | loading | creator_scene (skeleton), skeleton |
| F024 | creator-profile/1440/works-error | 1440 | creator_profile | creator_rich | error (works section) | creator_scene, error_block |
| F025 | creator-profile/1440/works-empty | 1440 | creator_profile | creator_minimal (empty works response) | empty | creator_scene, tab_pill, empty_state |
| F026 | creator-profile/390/default | 390 | creator_profile | creator_rich, work_rich_live | default | creator_scene mobile, work_scene, work_card, rail, global_navigation (bottom nav) |
| F027 | creator-profile/390/minimal-content | 390 | creator_profile | creator_minimal, work_minimal_scheduled | minimal_content | creator_scene, work_scene, work_card, rail, global_navigation |
| F028 | creator-profile/390/long-content | 390 | creator_profile | creator_long_names, work_long_title_live | long_content | creator_scene, work_scene, work_card, rail, global_navigation |
| F029 | creator-profile/1024/default | 1024 | creator_profile | creator_rich, work_rich_live | default | creator_scene, work_scene, tab_pill, work_card, story_chapter, rail, footer, global_navigation |
| F030 | work-detail/1440/live-default | 1440 | work_detail | work_rich_live, bid_history_fixture | LIVE, panel live_eligible | media_stack, auction_panel, status_chip, story_chapter, process_steps, facts_group, bid_history_row, rail, footer |
| F031 | work-detail/1440/scheduled-minimal | 1440 | work_detail | work_minimal_scheduled | SCHEDULED, panel scheduled_preview, minimal-content work | media_stack (single), auction_panel, facts_group, footer |
| F032 | work-detail/1440/long-title | 1440 | work_detail | work_long_title_live | LIVE, long_title (67 chars, 3 lines) | media_stack, auction_panel, status_chip, story_chapter, process_steps, facts_group, bid_history_row, rail, footer |
| F033 | work-detail/1440/live-no-bids | 1440 | work_detail | work_ceramics_live | LIVE, bid_count 0, history empty | media_stack, auction_panel, status_chip, story_chapter, process_steps, facts_group, bid_history_row, rail, footer, empty_state |
| F034 | work-detail/1440/media-error | 1440 | work_detail | work_rich_live (cover failed) | media_error (missing/broken media) | media_stack (image_error), auction_panel |
| F035 | work-detail/1440/ended-won-viewer | 1440 | work_detail | work_rich_live, ended_with_winner | ended, panel ended_won_viewer, chip «Продано» | media_stack, auction_panel, status_chip, story_chapter, process_steps, facts_group, bid_history_row, rail, footer |
| F036 | work-detail/1440/loading | 1440 | work_detail | — | loading | skeleton (media + panel) |
| F037 | work-detail/390/live-inline-panel | 390 | work_detail | work_rich_live, bid_history_fixture | LIVE, panel inline visible | media_stack, auction_panel, sticky_bid_bar (hidden note) |
| F038 | work-detail/390/live-sticky-bar | 390 | work_detail | work_rich_live | LIVE, scrolled, sticky_bid_bar visible | sticky_bid_bar (eligible), story_chapter |
| F039 | work-detail/390/scheduled-minimal | 390 | work_detail | work_minimal_scheduled | SCHEDULED minimal | media_stack (single), auction_panel (scheduled_preview) |
| F040 | work-detail/1024/live-default | 1024 | work_detail | work_rich_live | LIVE default | media_stack, auction_panel, status_chip, story_chapter, process_steps, facts_group, bid_history_row, rail, footer |
| F041 | bid-states/01-scheduled_preview | 480 board | bid_states_board | work_minimal_scheduled | panel scheduled_preview | auction_panel, status_chip |
| F042 | bid-states/02-live_guest | 480 board | bid_states_board | work_rich_live | panel live_guest | auction_panel |
| F043 | bid-states/03-live_not_eligible_email | 480 board | bid_states_board | work_rich_live | panel live_not_eligible_email | auction_panel |
| F044 | bid-states/04-live_not_eligible_rules | 480 board | bid_states_board | work_rich_live | panel live_not_eligible_rules | auction_panel |
| F045 | bid-states/05-live_eligible | 480 board | bid_states_board | work_rich_live | panel live_eligible | auction_panel |
| F046 | bid-states/06-bid_dialog_default | 480 board | bid_states_board | work_rich_live | dialog default (first_bid; repeat_bid annotated) | bid_dialog, form_field |
| F047 | bid-states/07-bid_dialog_editing_390 | 390 | bid_states_board | work_rich_live | dialog editing (keyboard-open derivative) | bid_dialog |
| F048 | bid-states/08-bid_dialog_submitting | 480 board | bid_states_board | work_rich_live | dialog submitting | bid_dialog, inline_validation |
| F049 | bid-states/09-bid_dialog_accepted_panel_leading | 480 board | bid_states_board | work_rich_live | dialog accepted → panel leading (interaction derivative) | bid_dialog, auction_panel |
| F050 | bid-states/10-bid_dialog_stale_minimum | 480 board | bid_states_board | stale_minimum | dialog stale_minimum | bid_dialog, inline_validation |
| F051 | bid-states/11-bid_dialog_rejected_validation | 480 board | bid_states_board | work_rich_live | dialog rejected_validation | bid_dialog, inline_validation |
| F052 | bid-states/12-bid_dialog_rejected_server | 480 board | bid_states_board | rejected_server_example | dialog rejected_server | bid_dialog, error_block (panel_inline) |
| F053 | bid-states/13-panel_outbid | 480 board | bid_states_board | work_rich_live | panel outbid | auction_panel |
| F054 | bid-states/14-panel_soft_close | 480 board | bid_states_board | soft_close_extension | panel soft_close + dialog soft_close_notice inset | auction_panel, bid_dialog (inset), status_chip |
| F055 | bid-states/15-panel_ended_won_viewer | 480 board | bid_states_board | ended_with_winner | panel ended_won_viewer | auction_panel |
| F056 | bid-states/16-panel_ended_lost | 480 board | bid_states_board | ended_with_winner | panel ended_lost | auction_panel |
| F057 | bid-states/17-panel_ended_no_bids | 480 board | bid_states_board | ended_no_bids | panel ended_no_bids | auction_panel |
| F058 | bid-states/18-panel_role_disabled_admin | 480 board | bid_states_board | role_disabled_admin | panel role_disabled_admin | auction_panel |
| F059 | bid-states/19-panel_role_disabled_self | 480 board | bid_states_board | role_disabled_self | panel role_disabled_self | auction_panel |
| F060 | home/1440/default | 1440 | home | work_rich_live (featured), works, creators | default | global_navigation, work_scene (home_featured), rail, creator_card, work_card, creator_action, footer |
| F061 | home/1440/minimal-catalog | 1440 | home | work_minimal_scheduled, creator_minimal | minimal | global_navigation, work_scene, rail, creator_card, work_card, creator_action, footer |
| F062 | home/1440/loading | 1440 | home | — | loading | skeleton |
| F063 | home/1440/error | 1440 | home | — | error (per-section) | error_block |
| F064 | home/390/default | 390 | home | work_rich_live, works, creators | default | global_navigation, work_scene, rail, creator_card, work_card, creator_action, footer |
| F065 | home/1024/default | 1024 | home | work_rich_live, works, creators | default | global_navigation, work_scene, rail, creator_card, work_card, creator_action, footer |
| F066 | explore/1440/works-default | 1440 | explore | all works fixtures | works tab default | search_entry, tab_pill, filter_chip, work_card, footer |
| F067 | explore/1440/creators | 1440 | explore | all creators fixtures | creators tab | creator_card, tab_pill |
| F068 | explore/1440/filtered-empty | 1440 | explore | — | no_results | empty_state (explore_no_results), filter_chip |
| F069 | explore/1440/query-loading | 1440 | explore | — | query_loading | skeleton |
| F070 | explore/390/works-default | 390 | explore | all works fixtures | works default (incl. 2-up squares span_2=167) | work_card, filter_chip, bottom nav |
| F071 | explore/390/filters-sheet | 390 | explore | — | filters sheet open | filter_chip (sheet) |
| F072 | explore/1024/works-default | 1024 | explore | all works fixtures | works default | search_entry, tab_pill, filter_chip, work_card, footer |
| F073 | creator-action/1440/guest_or_non_creator | 1440 | creator_action_states_board | ui_copy.creator_action_labels | variant guest_or_non_creator | global_navigation, creator_action |
| F074 | creator-action/1440/approved | 1440 | creator_action_states_board | ui_copy.creator_action_labels | variant approved | global_navigation, creator_action |
| F075 | creator-action/1440/pending_review | 1440 | creator_action_states_board | ui_copy.onboarding pending | variant pending_review + status screen | creator_action, review_submit (submitted status) |
| F076 | creator-action/1440/changes_requested | 1440 | creator_action_states_board | ui_copy | variant changes_requested + correction status screen | creator_action, error_block |
| F077 | creator-action/1440/restricted | 1440 | creator_action_states_board | ui_copy | variant restricted + status screen | creator_action |
| F078 | creator-action/390/guest_or_non_creator | 390 | creator_action_states_board | ui_copy | variant guest_or_non_creator (bottom nav plus) | global_navigation, creator_action |
| F079 | creator-action/390/approved | 390 | creator_action_states_board | ui_copy | variant approved | global_navigation, creator_action |
| F080 | creator-action/390/pending_review | 390 | creator_action_states_board | ui_copy | variant pending_review | global_navigation, creator_action |
| F081 | onboarding/390/intro | 390 | creator_onboarding_mobile | ui_copy.onboarding | step 0_intro | creator_step_shell, creator_action |
| F082 | onboarding/390/step1-default | 390 | creator_onboarding_mobile | ui_copy.onboarding | step 1 default | creator_step_shell, form_field |
| F083 | onboarding/390/step1-keyboard-open | 390 | creator_onboarding_mobile | ui_copy.onboarding | keyboard_open | creator_step_shell, form_field |
| F084 | onboarding/390/step3-validating-async | 390 | creator_onboarding_mobile | ui_copy | step 3 loading «Проверяем адрес…» | form_field (loading), inline_validation |
| F085 | onboarding/390/step3-validation-success | 390 | creator_onboarding_mobile | ui_copy | step 3 success «Адрес свободен» | form_field (success), inline_validation |
| F086 | onboarding/390/step3-validation-error | 390 | creator_onboarding_mobile | ui_copy | step 3 error «Адрес занят» | form_field (error), inline_validation |
| F087 | onboarding/390/step4-media-permission-denied | 390 | creator_onboarding_mobile | ui_copy.errors | permission_denied | media_input |
| F088 | onboarding/390/step7-disabled-submit | 390 | creator_onboarding_mobile | ui_copy.onboarding | incomplete review | review_submit (incomplete) |
| F089 | onboarding/390/retry-offline | 390 | creator_onboarding_mobile | ui_copy.errors | offline_retry | creator_step_shell, inline_validation |
| F090 | onboarding/390/step7-review-complete | 390 | creator_onboarding_mobile | creator_rich fields | complete review | review_submit (complete) |
| F091 | onboarding/390/submitted-status | 390 | creator_onboarding_mobile | ui_copy.onboarding pending | submitted_status | review_submit (submitted) |
| F092 | onboarding/1440/step1-derivative | 1440 | creator_onboarding_mobile | ui_copy.onboarding | desktop derivative (centered card 480) | creator_step_shell |
| F093 | work-creation/390/step2-media-default | 390 | work_creation_mobile | work_rich_live images manifest | step 2 media grid | media_input (work_gallery_grid) |
| F094 | work-creation/390/step2-uploading | 390 | work_creation_mobile | — | uploading progress | media_input |
| F095 | work-creation/390/step2-permission-denied | 390 | work_creation_mobile | ui_copy.errors | permission_denied | media_input |
| F096 | work-creation/390/step3-keyboard-open | 390 | work_creation_mobile | work_rich_live story | keyboard_open | creator_step_shell, form_field (textarea) |
| F097 | work-creation/390/step1-validation-error | 390 | work_creation_mobile | — | empty title error | form_field (error) |
| F098 | work-creation/390/step7-disabled-submit | 390 | work_creation_mobile | ui_copy.work_creation | incomplete review | review_submit (incomplete) |
| F099 | work-creation/390/retry | 390 | work_creation_mobile | ui_copy.errors | server_error retry | creator_step_shell, inline_validation |
| F100 | work-creation/390/step7-review-complete | 390 | work_creation_mobile | work_rich_live fields | complete review | review_submit (complete) |
| F101 | work-creation/390/submitted-status | 390 | work_creation_mobile | ui_copy.work_creation | submitted_status | review_submit (submitted) |
| F102 | work-creation/1440/step2-derivative | 1440 | work_creation_mobile | work_rich_live images manifest | desktop derivative | creator_step_shell, media_input |
| F103 | auth/390/default | 390 | auth | ui_copy.auth | default | auth_panel, form_field |
| F104 | auth/390/code-entry | 390 | auth | ui_copy.auth | code_entry | auth_panel, form_field (code) |
| F105 | auth/390/code-error | 390 | auth | ui_copy.auth | code_error | auth_panel, inline_validation |
| F106 | auth/1440/default | 1440 | auth | ui_copy.auth, work_rich_live cover | default split (fixed accent_periwinkle_soft) | auth_panel, work_card |
| F107 | future/follow-creator/states | 1440 board | future_boards | ui_copy.follow, creator_rich | anonymous, default, followed, loading, error | follow_creator, inline_validation |
| F108 | future/follow-creator/profile-placement-1440 | 1440 | future_boards | creator_rich | default in creator_scene slot + «Будущее — не MVP» chip | creator_scene, follow_creator |
| F109 | future/follow-creator/profile-placement-390 | 390 | future_boards | creator_rich | default full-width + chip | creator_scene mobile, follow_creator |
| F110 | future/concepts | 1440 board | future_boards | future_concepts_labels | labeled concept cards, fixed accent_red_soft (deprecated alias accent_brown_soft) | none |
| F111 | future/wishlist/states | 1440 board | future_boards | ui_copy.wishlist, work_rich_live | anonymous, default, saved, loading, error | wishlist_saved_work, work_card, inline_validation |
| F112 | future/wishlist/card-placement-1440 | 1440 | future_boards | work_rich_live | default on work_card + «Будущее — не MVP» chip | work_card, wishlist_saved_work |
| F113 | future/wishlist/card-placement-390 | 390 | future_boards | work_rich_live | default on work_card + chip | work_card, wishlist_saved_work |
| F114 | future/wishlist/detail-placement-1440 | 1440 | future_boards | work_rich_live | detail_pill default + chip | media_stack, auction_panel, status_chip, wishlist_saved_work, story_chapter, process_steps, facts_group, bid_history_row, rail, footer |
| F115 | future/wishlist/detail-placement-390 | 390 | future_boards | work_rich_live | detail_icon_mobile default + chip | media_stack, auction_panel, sticky_bid_bar, wishlist_saved_work |
| F116 | future/video-process/states | 1440 board | future_boards | work_rich_live, ui_copy.video | poster, ready, playing, paused, muted, loading, error, unavailable | video_process_story, process_steps, skeleton, error_block |
| F117 | future/video-process/placement-1440 | 1440 | future_boards | work_rich_live | poster above process_steps + chip | video_process_story, process_steps, media_stack, auction_panel, status_chip, story_chapter, facts_group, bid_history_row, rail, footer |
| F118 | future/video-process/placement-390 | 390 | future_boards | work_rich_live | poster above process_steps + chip | video_process_story, process_steps, media_stack, auction_panel |

**Totals: 118 frames** — 2 foundations, 16 component boards, 41 P0 (11 creator-profile + 11 work-detail + 19 bid-states), 47 P1, 12 future.

Explicit scenario → frame mapping (required coverage):
- author of another discipline → F020 (+ F033 via work_ceramics_live);
- work with minimal content → F022, F027, F031, F039;
- missing/broken media → F034 (+ image_missing on F008, photo_missing on F012/F022);
- ended auction with winner → F035 (ended_won_viewer full screen), F055, F056;
- rejected_server_example → F052.

## 7. Builder verification checklist (run before handing back)

1. Diff contains exactly one new file `design/pen/bidplace-creator-first-v2.pen`; `design/pen/bidplace-web-v2.pen` and every other `.pen` untouched.
2. First authorized visual pass: G1A–G3C (nine explorations). Pen starts only after founder selection. A later full pass: all 118 manifest frames exist with exactly the manifest `frame_name` values; no extra unnamed frames.
3. Grep frames for forbidden MVP concepts: followers/подписчики, ratings, reviews, wishlist, fixed price, payments, chat, crypto, video-required. Zero occurrences on MVP frames (F001–F106); future concepts only on F107–F118 with the «Будущее — не MVP» chip.
4. Discovery cards (home/explore/profile rails): no price, no deadline, no countdown anywhere.
5. Work detail LIVE frames: current price + bid action visible without scroll at 1440 and 390 (sticky bar counts on 390).
6. All visible text traces to the two allowed sources (§0); no invented facts, prices, or names.
7. All imagery traces to `media_asset_manifest` asset ids; all accents match `accent_assignments` / `fixed_assignments` **ids** (`brown` resolves to red). Assigned accent may be unused as a visible strong mark.
8. All icons are the canonical Phosphor icons from `iconography.required`.
9. Contrast spot-check: ink-on-canvas, white-on-ink, ink-on-yellow/pink/orange strong, white-on-blue/teal/red strong. No cream canvas.
10. Visual drift check: no default radius 24/28/999 on scenes/cards; pills are not the product language and not forbidden on tabs/filters/tags; no Piazzolla on names/titles/chapters; no wrapping accent_soft scenes.
11. Reduced-motion and loading/empty/error coverage per `global_rules.required_states_every_screen` (full pass) / golden defaults (first pass).
12. Annotation layers present: server-owned values, role variations, WePresent vs Get Hyped notes from the blueprint.
13. Report: built frames list vs authorized set, any `Missing spec` / `Missing asset` entries, deviations (must be none without approval).
14. Human reading rhythm: each golden exploration has one dominant event, obvious first/second/ignore order, at least one large empty zone, no complete grid filling, no equal-weight chrome pile. AI-like design check: if branding were removed, this must not read as a generated UI kit.

## 8. Out of scope for the builder

- Any change to spec files (they are read-only inputs; discrepancies are reported, not fixed).
- Any interaction prototyping beyond Pen's static frames + annotations.
- Any export to code, tokens, or the repository frontend.
- Any image generation, search, or substitution (Gate M owns media).
