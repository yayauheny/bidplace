# bidplace — текущий статус дизайна

Срез: 2026-10-23, MVP `872f22fc`. Визуальная приёмка в целом **Partial**.
Источник/правила — [design index](00-DESIGN-INDEX.md) и [design system](03-DESIGN-SYSTEM.md).
Полный прежний журнал, включая ограничения ранних экранов:
история.

## 2026-10-29 — Story upload revision, same geometry

**Partial.** No layout, token, or frame change. Story upload now sends the
editing revision that was current when the photo was selected. Chromium/WebKit
story matrix 12/12 still passes. Wide exact Figma parity and native acceptance
remain outside the claim. Evidence stays in the
[W0 journal](../launch/waves/W0-photo-and-trunk.md).

## 2026-10-29 — W0 regression acceptance refresh

**Partial.** Runtime layout/tokens remain the previous story implementation. With
explicit founder approval, browser specs now follow the separate author photo
step and explicit Work photo upload before the story step. Text recovery, no
duplicate writes and revision isolation assertions remain. save-race fixture
changes add dimensions/MIME only. Story matrix12/12 passes on Chromium/WebKit.
`8a5de85a` keeps an uncertain story photo across Continue, close and submit when
the save owns the transition lock; geometry is unchanged. Final390×874 evidence
and results belong to the [W0 journal](../launch/waves/W0-photo-and-trunk.md).
Wide exact Figma parity and native acceptance remain outside the claim.

## 2026-10-28 — W0 story editor ownership and styles

**Partial.** `ProductDraftStoryStep` reads capacity from `useProductStoryEditor`,
keeps text enabled while uploading and disables composition actions; saving still
locks input. `ProductBlockActions` owns story/tile geometry through `variant`;
PrivateStoryImage consumers share `authEpoch`. Styles moved to StyleSheet with
existing typography, spacing, palette and accepted local Figma4563:32790 geometry;
no new composition or DnD behavior. Empty virtual paragraph keeps its key/focus.
Alt input keeps intermediate spaces and normalizes only on save; sequential
keyboard entry is verified in Chromium/WebKit. Unknown upload outcomes reconcile
before save or retain local text on failure.

Owner/consumer119 tests and Chromium/WebKit story checks pass. Captures390×874
before/after retain layout; all story states are pixel-identical except46 toolbar-edge pixels at1 RGB level in one Chromium frame. Existing toolbar deviations from Figma275×52 remain;
wide parity is NEEDS-FIGMA and native remains Needs verification. Full mobile and
protected E2E gates remain unclosed; [W0 journal](../launch/waves/W0-photo-and-trunk.md#журнал-исполнения-2026-10-28).

## 2026-10-28 — Story interaction and opening avatar acceptance

**Partial.** Supersedes the control-gutter claims below: the selected story block
is raised so the whole 44×44 trigger receives hits; the neighboring textarea
stays outside that gutter. `product-draft-story.tsx` separates focus from height
measurement and recalculates height only on text/width changes. This prevents
scroll resets caused by transient zero height and handles 390→1024→1440→390
without reloading. `FormPageShell` uses Web keyboard dismissal `none`: RN Web's
`on-drag` blurs on programmatic scroll as well, losing focus while revealing a
field. Native keeps `on-drag`. The inactive gutter still has `pointerEvents="none"`.
`HomeOpening` now uses the existing plain avatar fallback and gray theme surface,
without manual retry controls; automatic retries remain. Plain fallbacks retain
an accessible image description through `ResilientRemoteImage`.

Chromium/WebKit checks cover all nine trigger hit points, independent neighboring
textareas, real wheel scrolling in a short viewport, subsequent keyboard input,
responsive textarea height, and pending/failed avatar requests. Existing photo/
story regression checks remain in scope. Upload/save/DnD and server contracts are
unchanged. [Evidence and actual checks](../audits/evidence/2026-10-28-story-interaction-final/README.md).
Native devices and actual browser zoom 200% remain **Needs verification**; wide
Figma parity stays **NEEDS-FIGMA**. Server gallery/story file reuse remains
**Not implemented**; session SHA-256 does not implement it.

## 2026-10-28 — Story editor control gutter

**Partial.** The text field no longer keeps the 44px control inside
`paddingRight`. The row is the input (`flex: 1` plus `space.x2`) and a 44px
strip outside the textarea, so the text width stays the same. The active ⋮
stays a real 44×44 box in that strip. A closed block is not raised, so the
button may paint over the next strip; a press there focuses that neighbor
and does not open the other menu. An inactive strip has `pointerEvents="none"`
and no control. Chromium and WebKit: clicks at the neighbor field's right−12,
right−4, and the strip center select that field in both directions, for two
single-line paragraphs and for heading plus paragraph. WebKit wheel over the
inactive strip scrolls the document and does not open a menu. Chromium's
story step has no scrollport, so that wheel does not move `scrollTop` and
does not open a menu. Toolbar stays 272.21875×53. Menu stroke stays
144.5×51.5 with rx=ry=25.75. Native 44×44 and gutter taps remain
**Needs verification** on a device. Browser zoom 200% was not run. Wide exact
parity stays NEEDS-FIGMA. Server file reuse is **Not implemented**.

## 2026-10-28 — Story editor active block controls

**Partial.** The user accepted variant A: Figma density stays (line-height
24/20, 6px between text blocks). ⋮ is shown only on the selected block, which
differs from Figma (⋮ on every block) and is accepted. Chromium and WebKit
measure a real 44×44 box for the selected ⋮ and for menu delete; the muted
42px glyph stays centered. Menu stroke is 144.5×51.5 with rx=ry=25.75.
Toolbar versus Figma 275×52 stays 272.21875×53 (allowance −2.78125 and +1).
Native 44×44 is **Needs verification** on a device: tap ⋮ on adjacent
single-line blocks, type in the gutter, scroll across the control, and check
Android does not clip the box.
[390×874 evidence](../audits/evidence/2026-10-28-story-editor-controls/README.md).
Browser zoom 200% was not run. `simctl` is unavailable. Wide exact parity stays
NEEDS-FIGMA. Server file reuse is **Not implemented**; session SHA-256 is not
that implementation.

## 2026-10-28 — Story editor hit targets and menu radius

**Partial.** Text ⋮ is a 24×24 Web box on a 20px line (pitch 26). Native hit
slop makes that control 44px wide; vertical slop is half the free gap (1px on
a 20px line), so the vertical target is 26px, not 44. Delete stays the compact
34×34 Web box; Native hit slop still reaches 44. Both shortfalls from 44px
need user agreement and are not treated as accepted. Menu stroke rx and ry are
both 20.75 on the measured 134.5×41.5 rect. Toolbar allowance versus Figma
`4563:32790` 275×52 is width −2.78125 and height +1 (measured 272.22×53).
[390×874 evidence](../audits/evidence/2026-10-28-story-editor-controls/README.md).
Browser zoom 200% was not run. `simctl` is unavailable; Native iOS/Android
unverified. Wide exact parity stays NEEDS-FIGMA. Server file reuse is
**Not implemented**; session SHA-256 is not that implementation.

## 2026-10-28 — Story toolbar primitives

**Partial.** Shared owners only: `FigmaButton` size `compactIcon` (43px,
trailing inset), `FigmaIcon` `image-02`, `typography.subtitle`, and
`destructiveInk`. Toolbar and block-menu fill stays `surfaceMuted`. Story icon
stroke is existing `stroke.icon` 1.3; icon-button default stays 1.6. Story
composition now uses them: creation story gap 12 (`FormPageShell.contentGap`),
text blocks 6 apart / 20 to images and toolbar, Web fields start at line-height,
52px in-flow toolbar, block-menu gradient ring/divider/shadow. Photo screen
unchanged; persistent status row (+38px vs Figma) and 44px step hit zones are
accepted differences. Black-theme `destructiveInk` is provisional
(`NEEDS-FIGMA`). Playwright Chromium/WebKit 390x874 snapshots not captured
(no local Postgres; run resets the e2e DB); Native iOS/Android unverified. Wide
parity stays open.

## 2026-10-27 — Stable first story field and sending status

**Partial.** Empty paragraph and first real paragraph share a keyed block/field
subtree; typing no longer remounts the input. Only the field placeholder remains
in the empty state; the second hint pill was removed at the user's request.
Photo status distinguishes actual sending from preparation without changing the
reserved row or grid geometry. Blank save filtering and existing mechanisms stay.
[Addressed input/caret/status checks](../audits/evidence/2026-10-27-story-input-status/README.md).
Server file reuse is **Not implemented**; session SHA-256 is not its implementation.
Manual DnD/system ghost and physical Native acceptance remain open.

## 2026-10-27 — Stable photo states and compact story controls

**Partial.** Live story nodes `4562:32461`, `4563:32768`, `4563:33344` and photo
`7329:704`/handoff `7388:723` were read-only. Stable photo status area, retained
local preview, loading badge and explicit duplicate text; compact absolute block
menu with movement/Escape focus. Shared `FigmaIconButton` owns compact/danger
roles and Web expanded semantics. The user-selected empty field is a deliberate
change to Figma's empty story, without forced keyboard opening. Direct picker and
growing text replace extra gallery/back controls and nested text scrolling.
[390/1024/1440 evidence and addressed checks](../audits/evidence/2026-10-27-photo-story-followup/README.md).
Wide exact parity stays NEEDS-FIGMA; manual user drag/OS ghost, physical Native,
load smoothness and original missing CTA remain unverified/not reproduced.

## 2026-10-27 — Connected Chrome photo acceptance

**Partial.** With the connected Chrome, actual browser zoom200% (Chrome label,
600×349 CSS viewport, DPR4, CSS zoom1) was checked through creation step2 and
account → ordinary Work draft editor. Done stays accessible; tools are reachable
by scrolling and Done returns to the form. Original missing CTA is **not
reproduced**, cause unknown. Manual mouse attempts were inconclusive; rounded OS
ghost, physical Native and JS-load smoothness remain unverified. Runtime
`ee4b71fd` unchanged; no new UI mechanism or styling. Zoom restored100%.
[Steps and screenshots](../audits/evidence/2026-10-27-photo-manual/README.md).

## 2026-10-27 — Manual photo acceptance availability

**Partial.** Runtime `ee4b71fd` is unchanged. This pass checked environment only:
local browser connector disabled; CUA Testing window shows `chrome://intro/`;
checked Web ports8081/8087 are not listening. `simctl` is unavailable and
`adb`/`emulator` are absent from PATH. Manual ghost, true zoom200%, both editor
entries and Native interaction/performance scenarios were not executed.
Original missing CTA remains **not reproduced**. Native `runOnJS(true)` smoothness
under load is a device-check risk, not a proven defect. Existing tests/builds were
not rerun or promoted to manual evidence. No implementation/infrastructure change.
Detailed acceptance record.

## 2026-10-27 — Drag boundary and Native integration

**Partial.** Follow-up above `c96d3f3f`: whole-grid `PhotoDropArea.web` handles
mouse drop on vacant cells/gaps/add tile using fixed parent-cell geometry; outside
release restores order. `SortablePhotoTile.web` no longer owns mouse drop.
Native gesture attaches only to `PhotoDragSurface`, excluding edit/delete/Retry;
`FormPageShell` now supplies bounded edge scrolling and actual scroll delta.
`PaddedGrid.activeItemId` raises the active row across neighboring rows. This
supersedes the earlier “no native edge scroll integration” limitation in code;
physical Native overlap/gesture/cancel acceptance is still **Needs verification**.

Local checks: 1114 unit tests, media14/14 and shared-consumer6/6 Chromium/WebKit,
affected typecheck/lint and e2e fence passed. Final held-mouse/touch/keyboard
rerun4/4 and Web export passed; Web/iOS/Android export also passed.
[Mouse recordings](../audits/evidence/2026-10-27-photo-drag-final/README.md).

Owner tests check button exclusion, scroll-adjusted row insertion, commit/cancel,
scroll edges and cleanup. Browser mouse checks use down/move/up rather than direct
drop dispatch. Recordings and final checks are in the
follow-up audit.
No route/API/media contract or Figma styling change. Native runtime unavailable
(`simctl` absent). System drag ghost and true browser zoom 200% remain unverified;
original CTA disappearance remains **not reproduced**, not declared fixed by the
scroll padding or CSS zoom test. No user window closed; no merge/deploy.

## 2026-10-27 — Photo interaction corrections

**Partial acceptance; local Web regressions verified.** Continued `feature/photo-workflow`
above `49831921`. Original's complete crop layer is inert and transparent;
Work/avatar CTA clears scroll content on 390×420, including ordinary-draft entry.
Picker add slot remains in place. Upload preflight/targeted Retry are visibly busy;
one alert distinguishes preparation/file/order/access/revision failures. Drop
previews neighbors, cancellation retains order, keyboard/reduced motion remain;
Chromium CDP touch covers long press, edge scroll and cancel. Avatar captures now
wait for a decoded eagerly loaded local image. Shared stage/preview surfaces and
creation-action shadow/label follow live `7329:704/822/823/824`, handoff `7388:723`.

[31 original captures and sequential drag/Retry frames](../audits/evidence/2026-10-27-photo-fixes/README.md)
([gallery](../audits/evidence/2026-10-27-photo-fixes/index.html)). Media 12/12, final
focused media 8/8 and shared Work/author/moderation consumer 6/6 browser cases
passed across Chromium/WebKit. Final keyboard-focus restoration after a row
remount passed 2/2; full Web/Android/iOS export passed. Existing onboarding E2E helper now confirms the
photo editor (its missing confirmation also failed on original HEAD); the admin
acknowledgement locator is exact, avoiding ambiguity with a transient publication
notice. No assertion/timeout was weakened.

CSS body zoom 2 passed; physical toolbar/OS zoom, iOS browser chrome and physical
Native drag/button/autoscroll acceptance remain Needs verification. Native uses
existing Gesture Handler/Reanimated neighbor preview but has no new native edge
scroll integration. OS-owned mouse drag-ghost shape is not proven by PNG. Exact
wide Figma parity remains NEEDS-FIGMA. Live Figma square handles and filled add
label are retained, contrary to those two pasted-review observations.

## 2026-10-27 — Photo state review pack

**Partial.** [86 unretouched Web PNG and indexed gallery](../audits/evidence/2026-10-27-photo-states/README.md)
cover 34 state categories across Chromium/WebKit. Primary viewport 390×874,
short screen 390×600, selected empty/editor/error states also 320–1440.
Runtime `804fe830` unchanged; new evidence adds no product styling decision.
Representative error/dialog/editor/order snapshots visually checked; the pack
is provided for further analysis, not a claim of exhaustive visual acceptance.
Native, 200% zoom and exact wide Figma parity remain unverified/NEEDS-FIGMA.

## 2026-10-27 — Photo edit icon reference

**Partial.** Founder screenshot approves a diagonal
pencil without an underline. Photo grid uses installed Hugeicons `Edit03Icon`
via the shared registry; its 22px glyph, outline button and interaction stay
unchanged. Other edit-icon consumers retain `PencilEdit01Icon`.
Chromium/WebKit media checks passed (2/2), Web export passed, refreshed
preparation/error screenshots visually
checked. Native rendering and 200% zoom were not checked.

## 2026-10-27 — Photo grid acceptance cleanup

**Partial.** Removed the extra grid discard button; disabled upload/error CTA
reads «Продолжить» with unchanged availability. Existing confirmation is reached
through Close for idle unfinished photos. Both refreshed 390×874 error images
were visually checked: no extra action, correct disabled label, unchanged layout.
Evidence and checks.
Chromium/WebKit close/cancel and upload/error checks pass. Native gestures,
200% zoom and live CDN remain unverified; no broader visual acceptance claimed.

## 2026-10-27 — Photo review corrections

**Partial.** Figma `7329:704/822/823/824` reread with screenshots. Web rectangle
uses four 8px corner markers, white 2px lines and 40% outside dim; avatar has a
single circular boundary. Installed Hugeicons `UndoIcon` is the exact reset
vector. `FigmaTabs appearance="plain"` reuses tab behavior/indicator with a
single 42px rail; default glass consumers are unchanged. Caption is Inter regular
13/18; selected/plain tab labels are medium/semibold 14/18. Editor keeps shell
insets once; browser screenshots exclude the Figma OS status bar. Failure is
visible inside the open Work/avatar editor and settings survive retry.
Representative four-state 390×874 and long/short viewport screenshots are
saved and visually checked;
wide checks are robustness, exact desktop parity remains NEEDS-FIGMA. Native
resize behavior has JS-adapter coverage, device calibration remains unverified.
Final 8/8 Chromium/WebKit media cases and 1104 mobile unit tests passed; graph
typecheck/lint and Web/iOS/Android export passed. No full Native/200%-zoom
acceptance is claimed.

## 2026-10-26 — Photo workflow

**Partial.** Read-only Figma `pAPQo6cADmG5XzVmBX76EE`: selection `7329:704`, Work
editor `7329:822`, upload/error `7329:823`, avatar editor `7329:824`, handoff
`7388:723`. Existing FormPageShell/PaddedGrid/FigmaTabs/buttons/icons are reused;
shared `CroppedPhoto` carries revision crop through Work cards/gallery. New rotate,
flip/reset/alert icons use FigmaIcon; feedback/tool text roles and error palette
belong to design tokens. Existing four-step product wizard is retained; the
six-dot sample does not change product routes. No Figma edits.
Six Chromium/WebKit media E2E passed; real editor reset/cancel/focus, crop-only
save and 390/1024/1440 overflow checks passed. Error tiles checked at 320–1440.
Evidence. Native gestures/device
output, accessibility at 200% zoom and exact visual parity remain Needs verification.
Only 390px reference frames exist here; exact 1024/1440 parity is NEEDS-FIGMA.

## 2026-10-25 — Explore / Blur16 integration

**Implemented for verified local web states; Native Needs verification.** Normal merge `87a2ab68` incorporates MVP
`068af087` / PR #66, preserving Blur16/Native60/Mask35 and agreed icon strokes.
Only product status conflicted; both feature entries and Native caveats retained.
Removed global `lastState`: Chromium/WebKit reproduced a previous query leaking
into a new Home → Search entry; fresh Search now starts from URL defaults.
Navigation-entry session restore remains unchanged. Header/animations unchanged;
caption Works have no frost. Passed: 1053 mobile unit tests, graph typecheck/lint,
46 Chromium/WebKit E2E plus six strengthened 390/1024/1440 responsive checks,
E2E fence and 192 docs links. Web/iOS/Android export and final-SHA CI results
are tracked in PR #67; export does not establish device acceptance.
Physical Native remains Needs verification.

## 2026-10-25 — Filled active dock icons

**Implemented for verified local browser states.** `FloatingDock` uses filled
Hugeicons for active Home/Profile through `FigmaIcon variant="filled"`. Search
stays outlined at 24px: inactive 1.3px, selected/pressed 2.5px. Add becomes
2.5px while pressed and returns to 1.6px at rest (`DEC-147`, founder screenshot;
working-copy geometry `7272:2707`).
Source `6WWy0IkFqsajKxErNsH3bQ` / `5685:190` inspected in read-only browser;
MCP access unavailable. Six Chromium/WebKit dock checks cover selection, reload,
Back/Forward, reduced motion, unchanged glass/232×64/24px geometry and focus.
1051 mobile unit tests, typecheck/lint and web build passed. Physical native
rendering and filled administrative glyphs remain unverified/undefined.

## 2026-10-25 — Explore acceptance refinements

**Partial — local browser checks passed.** Empty search follows live Figma `7240:2730`;
shared icon strokes follow the founder's 1.3/1.6px rule, Back uses the full arrow,
and segmented selection slides with Reanimated/reduced motion. Runtime owners:
`PageState`, `FigmaIcon`, `FigmaTabs`, `PageScrollView`, Explore panes. Active
filters remain recoverable. Passed: 36 Chromium/WebKit E2E, 1051 mobile unit tests,
typecheck/lint, web/iOS/Android exports, docs links and diff checks. Screenshots
390/1024/1440 were inspected; 390 empty-state geometry matches the source.
Exact desktop parity stays NEEDS-FIGMA; physical
native keyboard/motion remains unverified.

## 2026-10-25 — Explore unification

**Partial / Needs verification.** `/explore`, inline animated search, rounded
`FigmaTabs`, section filters and two-column caption Works replace catalog/overlay
composition (`DEC-137`). See implementation evidence.
Browser acceptance:70 E2E +8 geometry checks, Chromium/WebKit390/1024/1440, keyboard/reduced motion/200% zoom;1047 mobile unit tests and exports passed. Source390; 1024/1440 exact parity
NEEDS-FIGMA, physical iOS/Android keyboard/Back/motion not verified. Category artwork
has no public media mapping and retains existing placeholders.

## Текущие экраны и общие компоненты

| Область | Статус | Проверенное основание / остаток |
| --- | --- | --- |
| Login, fullscreen registration, recovery | Partial visual acceptance | Responsive AuthViewport, одна форма, сохранение ввода/ошибок, Back/Forward и focus; login audit, UI completion. Production Turnstile, real keyboard/zoom/device motion не подтверждены. |
| Registration consent | Implemented по DEC-124/125 | Один explicit control, lazy документы, сбой GET не блокирует register; document access. Старые записи про четыре checkbox и disabled до загрузки superseded. |
| Author application / Author Story / Work story | Implemented для проверенного web-среза, device parity Needs verification | Client/API cutover, ordered blocks, private media и сохранение перед переходом; UI completion. Старое «UI не переведён / B6 не начат» не текущее состояние. |
| Work editor | Partial, updated 2026-10-23 | Portfolio audit: сетка177×236/12, tile-local состояния и bottomAction; четыре визуальных этапа, Review metadata, photo tiles, ordered block menu и revision/save guards; independent review. Source frames 390; 1024/1440 exact parity NEEDS-FIGMA. |
| Фото Work и автора | Browser acceptance, native Needs verification | Portfolio audit: пять визуальных шагов автора, safe retry создания, Chromium/WebKit responsive evidence и 200% browser zoom.  Release-сетка/wizard, preview, пофайловый прогресс/retry/timeout/переходы объединены; 1023 mobile tests и 6 media E2E по merge-записи. Physical devices, live R2/CDN и Figma новых статусов Needs verification. |
| Account / settings | Partial | Published identity, общий cabinet owner, navigation/scroll/long identity; account acceptance. Settings title примерно +7 px при 390 — явное исключение BackButton/FigmaIconButton, 2 geometry failures сохранены. Desktop 1024/1440 и black parity NEEDS-FIGMA. Delete CTA отсутствует до API. |
| Public author / category / sticky header | Partial | Bleed, identity, grid, About, action-row motion и focus; author parity. Master/MVP exclusions и desktop grid start 384 vs 387 px записаны там; 1024/1440 exact parity NEEDS-FIGMA. |
| Public desktop navigation / footer / brand | Partial visual parity | Desktop header от 1024 CSS px, ordinary-page footer, shared chrome visibility; footer audit. 44px targets/MVP legal labels отличаются от static source; unavailable commerce controls дают честный feedback. |
| Home empty/loading/error и shared sheets | Implemented для проверенных browser states | Empty CTA capped 420; 390/1024/1440/1920 no-overflow, непрерывный drag, reduced motion/focus/dirty-busy guards; UI completion. Desktop empty-state exact parity NEEDS-FIGMA. |
| DateSelection и общий focus | Implemented web; native Needs verification | React Aria web / native picker API, monochrome semantic focus DEC-126/127; date audit. Black palette остаётся provisional, не включена пользователям. |

## Незакрытая приёмка

- Physical iOS **и** Android, Safe Area, системная клавиатура, native frost/compact
  header/motion и реальные жесты — Needs verification. Expo/Hermes export и WebKit
  эмуляция не заменяют устройства.
- Реальный browser zoom 200%, увеличение системного текста, short/resize states
  на устройствах — Needs verification. Reflow viewport сам по себе не zoom proof.
- Desktop/tablet exact parity требует frames 1024/1440 там, где доступен только390;
  responsive browser checks не превращают `NEEDS-FIGMA` в Implemented.
- Live Turnstile и R2/CDN, SMTP delivery — отдельные [release gates](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
- Старый Home Opening golden mismatch >0.12 остаётся историческим visual debt;
  проверки не ослаблялись. Новый полный visual suite здесь не запускался.
- Ранние screen-specific `Needs verification` не объявлены закрытыми этой очисткой:
  проверять по истории
  и owner evidence перед изменением соответствующего экрана.

## Последние результаты и правило обновления

2026-10-25: **Implemented for verified web states; native Needs verification.**
Work/author `CoverFrost` uses
approved Dock-style Blur16/saturate115%/Mask35 on web with the independent
Figma two-stop scrim and content-driven lower panel. This supersedes the
2026-10-24 blur60 experiment; exact Progressive Blur parity is not claimed.
Author top remains unblurred. Relative to PR #66 release base `bfab5198`,
Native migrates from a second `Image blurRadius=30` to intensity60 `BlurView`
over the original `BlurTargetView` image, with SDK31+ Android blur and older
Android tint/scrim fallback. The migration belongs to this PR, not the release base.
Chromium/WebKit owner E2E 2/2, real catalogs at390/1024/1440, visible WebKit
OS captures,1049 mobile unit tests, lint/typecheck and web/iOS/Android exports
passed; acceptance and screenshots.
Physical-device rendering and phone catalog smoothness remain Needs verification;
wider exact Figma composition remains NEEDS-FIGMA.
Review follow-up 2026-10-25: device tooling unavailable; Native acceptance now
explicitly includes details return and background/resume, tracking Expo #51845/#51848
without claiming reproduction in these cards. The acceptance owner also records
the original MVP-to-Explore integration procedure; it was executed in normal
merge `87a2ab68` with both blur and icon-stroke tokens preserved.

MVP merge 2026-10-22: полный verify green, API legal-pack assertion исправлен
`cc4911e5`; старое «full verify red» описывает UI-ветку до merge. UI evidence:
988 mobile checks, editor E2E26/26, UI68 passed +2 excluded settings failures,
WebKit focus/motion20/20. Фото merge 2026-10-23: 1023 mobile +6 media E2E.
Это сохранённые результаты исходных проверок, не новые прогоны текущей docs-задачи.

Обновлять нужную строку и ссылку на owner audit; одну короткую датированную запись
добавлять при новом результате. Не копировать тестовые логи и старые checkpoints.
Экран не Complete без loading/empty/error/responsive/accessibility acceptance.


2026-10-23 portfolio design: scoped Figma frames получены через официальный MCP;
shared CoverFrost и destructive controls обновлены, существующий footer проверен
без второго владельца. Audit и ограничения.
Точный desktop/black parity для новых frames — NEEDS-FIGMA; физическая клавиатура
мобильного устройства, системный text scaling и native rendering не подтверждены.
## 2026-10-22 — Registration before account creation

Implemented locally: DEC-135 adds email proof before password/social account
creation, reusing AuthCodeField and auth layout/actions. Registration retains
legal consent through a failed submission; resend/change-address remain explicit.
The consent checkbox supports web Space activation. Chromium/WebKit lifecycle
14/14 and OIDC/email-code/link smoke 12/12 passed on isolated schemas with a test
IdP; registration keyboard consent and code-form responsive resize are included.
Exact visual acceptance of the added registration step and native device QA
remain Needs verification; existing design tokens and composition are reused.


## 2026-10-23 — Совместная проверка auth и фото

**Partial visual acceptance; local behavior checks passed.** Сохранены cookie
bootstrap, password/email-code/provider формы и явные connections settings из
PR #58 вместе с photo/upload UI MVP. Chromium/WebKit: 12 auth completion,
14 auth lifecycle и 6 media checks прошли. CSRF headers добавлены только в
E2E API-транспорт; production guards и browser assertions/timeouts сохранены.
Native devices, live providers и точная визуальная приёмка нового proof-шага
остаются Needs verification.

## 2026-10-23 — Social onboarding: восстановление после SMTP rejection

**Partial visual acceptance; owner behavior checks passed.** `OnboardingForm`
показывает существующий rejected-copy, обновляет email state и разрешает новый
ключ после определённого `MAIL_REJECTED` без reload. Network/неопределённый 5xx
сохраняют ключ. Client submit owner покрывает все три исхода; layout, tokens,
routes и shared controls не менялись. Новая Figma/native acceptance не заявляется.
Chromium/WebKit completion owner: 14/14 passed, включая настоящий rejection
тестового SMTP и успешный новый запрос/подтверждение на той же странице.


2026-10-23 review follow-up: Add в галерее заблокирован при незавершённой пачке,
retry и явная отмена остатка доступны на плитке. AuthorIntroDialog использует portfolio-only copy.
Геометрия/shared controls не менялись; проверки и ограничения —
portfolio audit.


2026-10-23 final review P3: после partial upload error переход к истории/проверке
блокируется до retry/cancel незавершённого остатка, включая точки шагов. Retry,
cancel и Back остаются доступны; состояние очереди не подменяет uploadBusy.

## 2026-10-24 — Administrative analytics

**Partial.** Mobile-first foundation analytics reuses FormPageShell, FigmaTabs,
TextField, PaddedGrid and typography/tokens; one feature-owned SVG series uses the
installed library. Screens cover truthful collection/coverage/cohort states, UTC
dates and retry. Independent source/mobile screenshot review found no substantial
blockers. Exact new admin/desktop composition has no supplied Figma frame
(**NEEDS-FIGMA**); physical iOS/Android, keyboard and screen reader remain
**Needs verification**. Evidence/checks.

Analytics accessibility follow-up links period/metric tabs to real labelled
panels. The 90-day growth view now uses one `FigmaSelectField` and the existing
compact searchable `FilterSheet`, replacing the inline day tabs. Its radio list
has one Tab entry, stable ordering, arrow/Home/End selection and Space/Enter
confirmation with return focus; browser acceptance extends the existing owner.


## 2026-10-24 — Mobile moderation and administrative navigation

**Partial.** Existing Bidplace primitives compose queue/detail/vertical changes,
private gallery/history and confirmed decisions. Mobile Chromium/WebKit states
and independent source/UX review completed; adaptive/final verification pending.
Admin uses five existing dock controls (no cart), ordinary users keep four; profile
is account, moderation/analytics have separate selection. Audit.
Hardware keyboard/Safe Area/text scaling and exact desktop Figma parity unverified.

Moderation review follow-up: decision success offers an explicit return to the
previous page; active publication offers processing/status refresh instead of
another review decision. Existing controls/tokens/restore flow reused; no new
visual system. Browser evidence and CI belong to PR #64.


## 2026-10-29 — W1: Work state error copy

**Implemented locally / visual Needs verification.** `api-error-messages.ts`
provides the approved PRODUCT_IN_SALE and PRODUCT_STATE_CONFLICT text in
profile/cabinet hide and draft/story saves. Hide errors remain inside the open
AppDialog, with retry/cancel and generic fallbacks preserved; actual cabinet,
draft and story consumer regressions cover these paths. No source geometry,
tokens, routes or Figma changes. Longer-copy wrapping, responsive screenshots,
real keyboard/focus/zoom and native/device acceptance remain Needs verification.

## 2026-10-29 — W2b invisible auth proof

**Partial visual acceptance.** Shared `useInvisibleTurnstile` removes the old
visible challenge block from all auth consumers without changing AuthViewport,
controls, typography or spacing tokens. Registration at 390: Chromium and WebKit
scripted browser checks cover no prefetch/no reserved widget space, inline
«Попробуйте ещё раз», retained values and successful submit-time proof retry.
Auth owner units cover expiry, timeout, abort/unmount, value/session changes and
late callbacks. Live Cloudflare Invisible configuration remains **Needs verification**;
1024/1440 exact Figma parity, native keyboard/device motion remain outside this
scoped acceptance. See [shared system owner](03-DESIGN-SYSTEM.md#invisible-turnstile-auth-abuse-2026-10-29).
