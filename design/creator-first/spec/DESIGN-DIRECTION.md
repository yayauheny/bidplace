# bidplace creator-first — design direction

Date: 2026-08-13
Status: design-architect recommendation, awaiting Gate B (founder direction approval)
Inputs: creator-first audit packet only (00/01/02 audits, FOUNDER-DECISIONS, REFERENCE-MANIFEST, REFERENCE-ANALYSIS, local reference images, targeted ui-ux-pro-max queries). Old Pen, current frontend, and current design tokens were not read.

## 1. Concept in one sentence

**«Культурный выпуск»** — a warm editorial creator home where every work is presented like a cultural release: calm magazine structure and navigation (WePresent voice) carrying vivid, lightly tilted media scenes and colored chapters (Get Hyped voice), with a quiet, always-findable auction layer.

## 2. Product hierarchy and non-negotiables

```text
creator → creator story/practice → works → one work's story/value → scheduled auction → bid → off-platform handoff
```

Non-negotiables carried into every decision:

1. Creator and work appear before any commerce metadata; discovery cards show media, title, creator, one descriptor — never price or deadline.
2. Work detail keeps price + bid action immediately findable in `LIVE`; deadline accessible but visually secondary.
3. One resilient creator template. Variation comes from real media, deterministic per-entity accent assignment (`design-system.yaml accent_selection`), and composition — never manual art direction or photo-derived palettes.
4. `Создать` is persistent and role-aware in the global shell on every viewport: guest/non-creator → creator onboarding; approved creator → add work; pending/restricted → honest cabinet/status.
5. Russian/Cyrillic is the primary stress test; BYN is the only currency; server owns identity, visibility, minimum bid, timing, winner, and contacts.
6. No followers, ratings, reviews, wishlist-as-MVP, fixed price, payments, chat, video requirement, or crypto semantics anywhere in the MVP surface. «Следить за автором» (`follow_creator`) and «Сохранить работу» (`wishlist_saved_work`) are fully designed post-MVP contracts (`product_phase: designed_post_mvp`, `implementation_status: backend_required`): they live only on labeled future boards, never on MVP frames, and never in MVP acceptance. `video_process_story` is the same class: optional, omitted when absent, autoplay forbidden. Bidding is confirmed MVP.
7. Feasible in Expo + React Native + React Native Web: no WebGL, no required video, no web-only library; blur used only in one bounded component with an opaque fallback.

## 3. Key tensions and how the direction resolves them

| Tension | Resolution |
| --- | --- |
| Magazine vs service | Page skeleton is editorial (manifesto, chapters, mixed grids); service controls (nav, search, `Создать`, auction panel) live in calm, fixed chrome that never participates in the editorial play. |
| Story vs transaction | Work detail alternates desire (media stack, story chapters) with one dedicated `auction_panel` component that is quiet but sticky/reachable in `LIVE`; a mobile sticky bid bar exists only while the auction is live. |
| Energy vs clarity | Get Hyped energy is confined to three named components (`media_stack`, `work_scene`, home collage) with hard tilt/overlap limits (±2.5°, ≤32 px, never over interactive targets). All chrome, forms, and transaction states stay untilted and calm. |
| Expression vs scalable templates | Accent fills are assigned deterministically per entity (stable id/slug → hash → one of six tested pairs; never position-, sort-, or date-dependent); single-image and short-text states collapse scenes gracefully (stack → single card + accent panel). No per-creator theming. |
| Web vs native | Mobile is a re-composed vertical story with Medallion control grammar (one decision per step, bottom pill actions, inline validation, safe-area discipline), not scaled desktop geometry. |

## 4. Rejected alternatives (short)

**A. «Печатный журнал» (WePresent-dominant).** Off-white canvas, serif manifesto, pastel cards, near-zero rotation, color only as quiet fills. Rejected: it breaks the founder's explicit 50/50 weighting by demoting Get Hyped to an accent, reads as "online magazine with no obvious product," and loses the youthful energy the brief demands. Its strengths (navigation clarity, content resilience) are kept in the chosen direction's structural layer.

**B. «Плакатная сцена» (Get Hyped-dominant).** Full-bleed saturated chapter panels, heavy grotesk display everywhere, tilted stacks as the default card grammar, oversized numbered sections. Rejected: maximalism drift — object comprehension and navigation degrade, single-image/short-text creators look broken, contrast management becomes per-surface firefighting, and the auction layer gets visually shouted down. Its strengths (media stack hero, colored chapters, info-plate anatomy, corner-arrow affordance) are kept as bounded components inside the calmer structure.

The chosen direction C is the only one of the three that simultaneously satisfies the 50/50 mandate, the discovery-card rule, sparse-content resilience, and quiet transaction clarity.

## 5. Reference synthesis — take / transform / reject

| Source | Take | Transform | Reject |
| --- | --- | --- | --- |
| WePresent | Sparse chrome; centered serif manifesto; mixed-size card grids with one image+caption anatomy; metadata rail + bounded reading column; mobile floating bottom pill; nav overlay with one recommended card | Manifesto becomes bidplace positioning + featured creator/work moment; story template becomes work/creator chapters | Publisher IA, its serif brand, long essay pacing |
| Get Hyped / Bullit | Media stack with visible tilted back layers; compact info plate beside dominant media; colored chapter surfaces; corner arrow; pill tabs with dark active state; thesis + photo triptych | Tilt limited to ±2.5°, plates ≤ −1.5° desktop only; metrics plates become status/label plates; energy alternates with calm chapters | Agency CTA language, growth numbers, oversized-everything, two-arrow decorative pair |
| Medallion | One decision per step; quiet rounded search/input; inline async validation (loading → success in one stable zone); large bottom pill CTA; 3–4 item bottom nav; preview-before-save media step | Recolored to warm light palette; sequential onboarding maps to SellerProfile/Product fields only | Dark theme, music/subscription/comments/follow semantics, verification badges |
| Avant Arte | Object gallery → quiet sticky transaction panel; progressive facts accordions/groups; artist banner→identity→works order | Sticky panel becomes `auction_panel` with BYN price + bid action; catalog grid used as media staging only | Luxury tone, price/deadline on discovery cards, draw mechanic, Get updates |
| Foundation | Permanently visible dark `Create` pill beside search/account; bid modal anatomy (summary card → amount → single action); archive row; bounded same-image atmosphere idea | Create pill becomes role-aware `Создать`; bid modal in BYN with server-owned minimum and rules acceptance | All NFT/wallet/ETH/mint/offer/feed semantics, full-page tinted atmosphere |
| Mobbin Awards | Portrait-first creator grid; lower mirrored/blurred caption strip bounded inside media; readable long bio measure | Effect assigned one owner: `creator_card` only, with opaque ink fallback and fixed veil | Awards/curator semantics, modal-only profiles, effect on every surface |
| COLORS | Oversized friendly welcome word; tiny choice set; legal copy quiet at bottom; split auth composition | Right field becomes approved accent surface + one work media card, not a gradient | COLORS branding, AI-gradient decoration |
| Stationhead | One clear identity per tile simplicity | Applied to Explore creators density | Dark default, celebrity verification |
| Pinterest (no local assets) | Progressive discovery, related trails as principle | Deterministic mixed-size grid instead of true masonry; related works rail on work detail | Endless feed, popularity bias |
| Concepts/auction | Split hero proportion: desire left, decision right | Re-skinned entirely into bidplace tokens | ETH/wallet, countdown-as-headline |

## 6. Selected visual territory and why it wins

- **Canvas:** warm vanilla `#FAF4EA`, deep ink-navy text `#1F2337` — cultural-print warmth, never beige-on-beige because accent surfaces and media carry saturation.
- **Six curated accent pairs** (periwinkle, teal, orange, yellow, pink, brown — each with a `strong` and `soft` value and locked foreground) are assigned deterministically per entity: stable id/slug → hash → modulo 6 (`design-system.yaml accent_selection`); never by list position, sort order, or date. This produces WePresent's "curated, not catalog" feeling and Get Hyped's confidence while staying scalable and AA-safe.
- **Two-voice typography:** Piazzolla (variable serif, optical size axis, full Cyrillic, OFL) for cultural statements, creator names, and chapter openings — warm and contemporary, not auction-house; Golos Text (Cyrillic-first grotesk by Paratype designers, OFL) for navigation, cards, forms, prices, and all transactional UI. Neither inherits Onest/Inter.
- **Media grammar:** rounded (radius 24) media cards; one stack component with tilted back layers; one corner-arrow gallery affordance (plus swipe/drag/keyboard); colored 2 px frames only on accent-filled cards.
- **Commerce grammar:** ink pills, white surfaces, hairlines; status chips are ink/soft neutrals with a single green live dot; success/error/focus are semantic-only colors that never decorate editorial surfaces.

Why it wins the rubric: creator primacy and work desire come from editorial hierarchy + media dominance; navigation and transaction clarity come from the untouched calm chrome; content resilience comes from defined collapse rules; mobile quality comes from Medallion grammar; originality comes from the specific combination (vanilla canvas + ink navy + Piazzolla/Golos + release scenes) that matches neither parent reference.

## 7. Typography rationale

- **Piazzolla** (Google Fonts, OFL; subsets verified in dataset: `cyrillic`, `cyrillic-ext`; variable `wght 100–900`, `opsz 8–30`). Used at high optical size it is sharp and editorial without Playfair's luxury coding. Static instances 500/600/700 are embedded for native.
- **Golos Text** (Google Fonts, OFL; subsets verified: `cyrillic`, `cyrillic-ext`; `wght 400–900`; designed by Alexandra Korolkova/Paratype — Cyrillic-first). Confident grotesk voice for UI and auction numerals. Static instances 400/500/600/700.
- Playfair Display (luxury-coded), Lora (bookish), Unbounded (crypto-adjacent display) were considered and rejected. `needs_verification`: Golos Text tabular-figure feature; layouts reserve fixed-width price slots so nothing breaks either way.
- Russian long-copy behavior: body 16/26 (max measure 640 px), no uppercase body text, kickers only at 13 px with +6 % tracking, hyphenation off, `Text` wrapping tested with fixtures including a 67-character title, a 39-character name, and a 152-character discipline (actual measured lengths in `content-fixtures.yaml`).

## 8. Color rationale

Mood image treated as atmosphere only; all values are new and tested for contrast intent (ratios listed per token in `design-system.yaml`, re-verified in QA). Key rules: ink-on-canvas ≈ 14:1; every accent `soft` carries ink text (≥ 9:1); every accent `strong` declares its only allowed foreground (white or ink); orange/yellow strongs never carry small white text; semantic success/error/focus are reserved and never used decoratively; live-dot green appears only inside the live status chip.

## 9. Page rhythm and media behavior

Rhythm unit: **scene → chapter → rail**. Scenes are energetic (accent fill, media stack, info plate). Chapters are calm (bounded 640 px reading column, one thesis, ≤3 images). Rails are horizontal card sequences with one visible rightward control. A page never repeats the same block type twice in a row on desktop; mobile keeps the same order as a single column. Media ratios are fixed per slot (3:4, 1:1, 4:3, 16:10); tilt ±2.5° max on back stack layers; overlap ≤32 px and never over interactive targets; the mirror/blur caption exists only inside `creator_card`.

## 10. Mobile transformation principle

Mobile is recomposed, not shrunk: single-column story order, full-width media cards, horizontal snap rails for secondary sets, floating bottom pill navigation (Главная / Обзор / Создать / Профиль) with the compact high-contrast plus as the third slot, sticky bid bar only during `LIVE` work detail, one decision per onboarding step with a stable inline feedback zone, keyboard and safe-area states designed as first-class 390 px frames.

## 11. Drift checks

- **Marketplace drift:** discovery cards carry no price/deadline/bid-count; Explore filters keep transactional narrowing in a secondary chip layer. ✔ blocked.
- **Magazine drift:** `Создать`, search, and the auction panel are fixed chrome; live state adds a persistent mobile bid bar. ✔ blocked.
- **Social drift:** no feed, counters, or likes anywhere; follow creator exists only as a designed post-MVP contract on labeled future boards, never on MVP frames; sharing is a quiet action. ✔ blocked.
- **Luxury drift:** warm palette, friendly welcome copy, Golos UI voice, no fashion-serif-only pages. ✔ blocked.
- **Maximalism drift:** tilt/overlap/accent quotas per screen (max 2 scenes per viewport height, one accent surface per viewport at 390). ✔ blocked.
- **Content dependency:** every scene defines a single-image, short-text collapse. ✔ blocked.
- **Manual art direction:** accents are entity-deterministic (hash of stable id, never position or date); no photo-derived colors. ✔ blocked.
- **Contract hallucination:** every visible fact traces to the audit; future concepts appear only in `content-fixtures.yaml` labels. ✔ blocked.

## 12. Explicit unknowns and required founder decisions

Recorded as `Missing input`; none block the system (safest contract-compatible default chosen):

1. **Logo wordmark.** Founder decision: navigation uses only the existing reversed-`b` symbol at 28 px. No wordmark slot, no empty placeholder, no typeset wordmark.
2. **Category taxonomy** for works (labels list) is server-owned and not enumerated in the audit. Fixtures are labeled invented; the category select renders server data.
3. **Slug authorship** during creator onboarding (user-chosen vs generated) is not stated. Default: designed as a user-editable step with async availability validation (Medallion pattern); if slugs are generated, the step is dropped without affecting anything else.
4. **`sellerType = influencer` onboarding variant** has no UI contract. Default: single creator path; no type selector shown.
5. **Rules version string/content** for first-bid acceptance is server-owned; fixture text labeled invented.
6. **Golos Text tabular numerals** — `needs_verification`; price slots reserve fixed width so the layout is safe either way.
7. **Pinterest mobile evidence** absent from packet; Explore mobile derives from Medallion + WePresent mobile patterns instead (allowed by manifest completion gate).
8. **Content limits for `fullName`, `shortDescription`, and work `title`** are not confirmed by the packet; no character counters are rendered for these fields (see `component-specs.yaml form_field.content_limits`). The confirmed `discipline` limit (160) is kept.

### Classification used across the packet

Defined once in `design-system.yaml classification` and applied per feature: `product_phase` (confirmed_mvp / designed_post_mvp / unresolved) and `implementation_status` (available_now / backend_required / product_decision_required). Statuses order development; they never limit design scope — Pen shows the whole future application, with post-MVP and unresolved concepts on labeled future boards only. Currently classified beyond confirmed MVP: `follow_creator`, `wishlist_saved_work`, `video_process_story` (designed_post_mvp, backend_required); fixed-price sale and editorial collections (unresolved, product_decision_required).

## 13. Definition-of-success restatement

> Молодой издательский дом авторов: работы показаны как культурные релизы и продаются через тихий, надёжный аукционный слой.

A first-time visitor should describe it as «красивый журнал про авторов, где можно купить их работы напрямую» — not "art marketplace," "magazine with no product," "social feed," or "luxury auction site."
