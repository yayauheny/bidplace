# bidplace creator-first — design direction V2.1

Date: 2026-08-15
Status: V2 art-direction kept. V2.1 is a focused process/geometry/accent/rhythm correction after review. Product/UX contracts are preserved.
Packet: `design/creator-first-v2/` (working copy). V1 remains at `design/creator-first/`.
Canon: production UI still reads `design/pen/bidplace-web-v2.pen`. This packet is not production canon.
Pen: do not build or modify any `.pen` file until golden explorations are selected.

## 0. What this correction is

V1 is a strong **product/UX specification**. Its visual direction is wrong.

V1 feels old, beige, overly editorial, literary, and template-like — closer to a cultural magazine for an older audience than to a young creator-first platform. It used WePresent for both structure **and** atmosphere, and reduced Get Hyped to tilted cards inside rounded colored containers.

V2 is an **art-direction correction**, not a product rewrite. V2.1 does not undo V2: WePresent = IA / whitespace / image-first; Get Hyped = attitude / scale / asymmetry / bold color; beige + literary serif + pastel rounded-card system stays gone; three golden screens remain the visual gate.

V2.1 only: pills are not forbidden; display type is provisional; assigned accent ≠ visible strong accent; `brown` is a deprecated alias of `red`; creator identity is not a chip by default; each golden screen needs three explorations before geometry locks; **human reading rhythm** — whitespace is compositional, one dominant event per viewport, density is local, chrome is removed before gaps are added.

Keep: creator-first hierarchy, auction contracts, role states, loading/error/empty/media-failure states, fixtures, responsive requirements, accessibility, MVP vs future separation.

## 1. Concept in one sentence

**«Площадка авторов, а не журнал»** — a young, image-led creator platform: WePresent’s clarity and whitespace carrying Get Hyped’s graphic attitude, with a quiet, always-findable auction layer.

A first-time visitor should describe it as «современная площадка авторов, где работы показаны крупно и их можно купить напрямую» — not "art magazine," "beige gallery," "SaaS marketplace," or "luxury auction house."

## 2. Product hierarchy and non-negotiables

Unchanged from V1:

```text
creator → creator story/practice → works → one work's story/value → scheduled auction → bid → off-platform handoff
```

1. Creator and work appear before any commerce metadata; discovery cards show media, title, creator, one descriptor — never price or deadline.
2. Work detail keeps price + bid action immediately findable in `LIVE`; deadline accessible but visually secondary.
3. One resilient creator template. Variation comes from real media, deterministic per-entity accent assignment, and composition — never manual art direction or photo-derived palettes.
4. `Создать` is persistent and role-aware in the global shell on every viewport.
5. Russian/Cyrillic is the primary stress test; BYN is the only currency; server owns identity, visibility, minimum bid, timing, winner, and contacts.
6. No followers, ratings, reviews, wishlist-as-MVP, fixed price, payments, chat, video requirement, or crypto semantics on MVP surfaces. `follow_creator`, `wishlist_saved_work`, and `video_process_story` remain designed_post_mvp, future boards only.
7. Feasible in Expo + React Native + React Native Web.

## 3. Reference split — do not average 50/50 visually

WePresent and Get Hyped remain the two primary references. They are **not** blended into a midpoint look.

| Reference | Owns | Does not own |
| --- | --- | --- |
| **WePresent** | Information architecture; editorial restraint; whitespace; image-first storytelling; curated presentation; navigation clarity | Visual atmosphere; beige/cream canvas; literary serif voice; “cultural magazine” mood |
| **Get Hyped** | Visual attitude; youthful energy; composition; typography scale and rhythm; bold color; asymmetric layouts; unexpected media placement; controlled overlap; modern digital feeling | Agency IA; hype copy; growth metrics; “rounded colored container + tilted stack” as a template |

Medallion, Avant Arte, Foundation, COLORS, Stationhead, Pinterest, Mobbin keep their V1 **product/interaction** roles. They do not set V2 atmosphere.

### Forbidden translation of Get Hyped

Do **not** implement Get Hyped as:

```text
rounded colored scene + tilted photo stack inside + pill CTA
```

That was the V1 mistake. Get Hyped’s actual principles are: intentional negative space, asymmetric balance, media that can float, independent text plates, variable image sizes, uneven vertical rhythm, occasional overlap, and large scale changes between sections.

## 4. How the new bidplace should feel

Must feel:

- young, current, creator-first;
- graphic rather than cozy;
- editorial but not literary;
- expressive but not chaotic;
- digital rather than print-like;
- image-led, confident, culturally relevant;
- slightly provocative;
- clean enough for real product usage.

Must not feel:

- beige, vintage, luxury gallery, auction house;
- lifestyle magazine, book publisher, cozy, handcrafted/cottage;
- generic SaaS or generic marketplace;
- pastel UI kit.

The creator and the work still dominate commerce. Auction UI stays quieter and highly usable.

## 5. Color — cleaner canvas, real accents

V1’s mandatory warm vanilla `#FAF4EA` plus pale yellow scene fills is the largest color error. It must not return as the default page background.

**Foundation**

- Primary canvas: near-white / very light neutral (`canvas` `#F5F5F3`).
- Typography: deep near-black / ink (`ink` `#111111`).
- White (`surface`) for floating plates, dialogs, auction panel.
- Optional warm neutral only where it is useful as a small supporting surface — never as the product’s visual identity.

**Accents**

Six entity-assigned accents remain. Token **ids** used by fixtures stay valid. Canonical names: periwinkle, teal, orange, yellow, pink, **red**. `brown` is a deprecated alias of `red` (see `design-system.yaml`).

Separate **assigned accent** from **visible strong accent**:

- Every creator/work still has a deterministic assigned accent.
- A composition is **not** required to display a large strong-colored element because of that assignment.
- Strong accent is optional at composition level (tag, slab, or plate — or none).
- Real media is the primary source of visual variety.
- One viewport should normally have at most one dominant strong-color gesture; small secondary details are allowed; competing unrelated slabs in the same viewport are not.
- Soft values remain chips/hover/tiny fills — **not** pastel entity cards or scene wrappers.
- Yellow is allowed only as graphic WePresent yellow. Never pale yellow + cream + serif.

Auction, forms, and chrome stay ink/white/hairline. Semantic success/error/focus remain reserved.

## 6. Typography — grotesk first, serif optional

V1 made Piazzolla the dominant display voice. That reads as a book, not a young digital platform. Removing it as the default display face stays correct. Do **not** return to a literary serif-led identity.

**Transactional / UI voice (locked for exploration):** Golos Text. Forms, auction values, nav, labels, body.

**Display voice (`provisional_until_golden_approval`):** Golos Text is the **safe starting candidate** for large statements, not the permanent bidplace display identity. `display_1` 88 / `display_2` 56, weights, and tracking are starting values. Golden explorations may test another modern Cyrillic-capable grotesk/display family if Golos feels too neutral or product-UI-like.

**Optional editorial contrast:** Piazzolla only as a pull quote / one aside — never default for creator names, work titles, or chapter headings.

Scale must work like Get Hyped: very large statements + small precise metadata. Cyrillic support remains mandatory. The golden screens determine the final display voice.

## 7. Shape — straighter than V1, not anti-pill

V1 overused radius 24 / 28 / 999 so that nearly every object became rounded container → rounded card → rounded control → rounded image. That language is gone.

V2.1 does **not** forbid pills. The problem was the all-rounded kit, not rounded geometry itself.

- Pills must not define the whole product language (`pill_not_default`).
- Large scenes, editorial composition, work cards, creator cards, and auction panels should not **default** to pill/capsule geometry.
- Tabs, filters, tags, and compact functional controls **may** use pill geometry when it improves the composition.
- Buttons and search may use moderate rounding if a golden exploration justifies it.
- Do not force radius 4/8 as a new ideology. Radius serves the composition.
- Keep the overall direction substantially straighter than V1.

## 8. Composition — the main correction

Reusable components remain. They must allow editorial composition. The page must not visually reveal its component system.

Do:

- intentional negative space;
- asymmetric balance;
- media that can visually float;
- independent text plates (not trapped inside a colored scene);
- variable image sizes;
- uneven vertical rhythm;
- occasional overlap that never covers interactive targets, focus rings, or required auction facts;
- large scale changes between sections;
- layouts that feel art-directed.

Avoid excessive:

- centered grids;
- 3×2 identical image matrices;
- repeated cards of equal size;
- identical section patterns;
- the V1 `scene → chapter → rail` rhythm as a mandatory page formula.

Only encode a visual rule as a global token after a golden candidate is selected. Do not freeze exact radius, display sizes, overlap, plate positions, decoration quotas, or a rigid scene/chapter/rail cadence before that gate.

### Human reading rhythm — critical

The design must not feel algorithmically filled. A common failure is treating the viewport as empty space that should be efficiently occupied by components. bidplace does the opposite. **Whitespace is an active compositional element.**

Do **not** optimize for maximum information per viewport, filling every grid column, showing every available metadata field, equal spacing between every section, or equal visual weight for every component.

Design for **human reading order**. Every viewport must answer:

1. What should I notice first?
2. What should I understand second?
3. What can I safely ignore until I choose to continue?

If those answers are unclear, the composition is too dense.

**One dominant event.** A viewport should normally contain one dominant visual event (one portrait + name, one work, one large statement, one auction decision, one curated group). Secondary information supports that event. Navigation + title + portrait + links + status + CTA + multiple cards + decorative color must not all compete at the same visual level.

**Macro whitespace.** Do not think only in component gaps of 16 / 24 / 32. Allow deliberate pauses of 80 / 120 / 160 / 240 or larger when composition benefits. An apparently empty area is valid if it creates hierarchy, separates chapters, focuses attention, or improves reading rhythm. Do not automatically place another component into unused space. Empty space is not a missing component.

**Density is local, not global.** Dense blocks are allowed (a work grid, compact bid history, a filter row). They must be surrounded by calmer space. Rhythm: `quiet → dense → quiet → focal → quiet`. Not `component → component → component`. A page must breathe at the macro level even when individual sections are dense.

**Remove UI chrome before adding space.** When a composition feels crowded, do not solve it only by increasing gaps. First ask whether a card background, border, chip, icon, or metadata field is needed now; whether an action can be plain text; whether information can appear later; whether two labels can become one line. Prefer content on canvas over content inside card inside section inside colored container.

**Content priority.** Not every available product field deserves visual presence. Do not surface information merely because the API provides it.

- Creator discovery: portrait → name → discipline.
- Work discovery: work → title → creator → one descriptor.
- Work detail: work → title/value → auction action → story.

Everything else is secondary or progressive disclosure.

**Human grouping.** Related information should feel like one thought. Do not distribute one conceptual group across multiple floating chips/cards. Better: `Полина Мирош ↗` then `Тихий берег` as one readable composition, with utility actions secondary.

**Avoid generated rhythm.** Do not repeat the same visual formula for consecutive sections (image + title + body, or card grid after card grid). Change scale and density intentionally. A long page should have visual sentences and paragraphs, not a continuous component stream.

**Reference lesson (judgment, not layout copy):** A24 and Brain Dead isolate objects and keep UI secondary; Stationhead lets few large objects carry the page; Layers treats extreme whitespace as valid; Bandcamp separates dense modules with chapter-level pauses; Case Studyo follows artwork → identity → text → supporting media and does not expose every action at once.

**AI-like design check** (required before approving each golden exploration): *If I removed all branding, would this look like an AI-generated UI kit?* If yes, revise. Look for too many containers, badges, equal-sized elements, complete grid filling, no large empty zones, every metadata field visible, uniform spacing everywhere, or decorative asymmetry without reading purpose. The page should look selected and composed, not generated and filled.

## 9. Component visual rewrite (data/behavior kept)

| Component | V1 visual problem | V2 visual anatomy |
| --- | --- | --- |
| `global_navigation` | Editorial masthead / SaaS pill cluster | Sparse chrome: symbol, tiny grotesk links, search, role-aware `Создать`. Nav is not a pill kit; moderate rounding on controls is allowed. |
| `creator_scene` | Text left / portrait right corporate split | One composition of name + portrait. Overlap and strong slab are optional per exploration, not required. Not a magazine masthead. |
| `work_scene` | One large `accent_soft` rounded rectangle | Media and information plate exist independently in shared space. Strong color optional as a field, not as a wrapping card. |
| `media_stack` | Every image a soft rounded card; tilt as decoration | Dominant straight-ish front image; back layers only when they read as a physical stack; overlap/rotation meaningful, not default garnish. |
| `work_card` | Pastel color frame around every photo | Image-led; caption independent; size varies by slot; no mandatory accent_soft frame. |
| `creator_card` | Identical pastel-framed portraits | Portrait-first on canvas; name/discipline as precise meta; home row may stagger sizes. |
| `story_chapter` | Same 640px article block, often in a rounded fill | Varied editorial compositions. 640 is max reading measure, not the chapter container. |
| `process_steps` | Uniform catalogue / filmstrip of equal rounded images | Large / small / text / detail sequences; irregular rhythm. |
| `section_header` / `rail` | Centered magazine titles, identical card tracks | Leading large grotesk; rails may mix sizes; one rightward control kept. |

Auction components (`auction_panel`, `bid_dialog`, `sticky_bid_bar`, `bid_history_row`) keep every semantic state. Visual change is quieter: no editorial decoration; geometry follows §7.

## 10. Three golden screens × three explorations

Visual source of truth — **only** these routes, desktop 1440, before any other screen is art-directed:

1. **Home**
2. **Creator Profile**
3. **Work Detail LIVE**

Each golden screen gets **three art-direction explorations** before any blueprint is locked. Same content, hierarchy, fixtures, routes, auction rules, and a11y. Different composition, scale, image placement, type/media relationship, negative space, and accent treatment. All nine must obey §8 human reading rhythm: one dominant event, obvious reading order, macro whitespace, local density, chrome last.

| Direction | Visual event | Role of the other voice |
| --- | --- | --- |
| **A — Type dominant** | Oversized typography is the graphic event | Media supports it; strong scale contrast; substantial negative space; closest to Get Hyped type confidence |
| **B — Media dominant** | Creator/work photography dominates the viewport | Type is precise but secondary; large or unexpected media; independent plates; WePresent image-first + Get Hyped composition |
| **C — Graphic interplay** | Media and type have roughly equal power | One optional strong color field may interact; controlled overlap; more graphic than A/B; still a usable platform, not an agency landing |

These are exploration categories, **not** three brands. All must remain recognizably bidplace.

### Screen-specific notes

**Home** — keep sparse navigation, image-first discovery, no catalogue-first opening, asymmetric composition, large whitespace. Create A/B/C rather than enforcing left statement + center-right media + lower-left plate.

- A: oversized manifesto is the event; featured media supports it.
- B: featured work photography dominates; type is precise and secondary.
- C: statement, media, and one optional color field share the viewport.

**Creator Profile** — keep creator identity before commerce, huge name / strong portrait relationship, no corporate 7/5 split, no pastel portrait backing card. Text/photo overlap is not required in every version.

- A: name dominates.
- B: portrait dominates.
- C: portrait + typography + optional color slab form one graphic composition.

**Work Detail LIVE** — work remains desirable and visually dominant; creator identity is visible; current price and bid action are immediately findable; auction panel stays calm and trustworthy. Do not wrap the hero inside one large decorative container.

- A: typography + transaction on one side, dominant media elsewhere.
- B: near-full-height media with transaction attached to the composition.
- C: shared-space composition with limited overlap / optional graphic field.

Do **not** lock exact golden geometry (portrait 480×640, overlap ≤48px, statement ~720, exact display sizes) before a candidate is selected. Distinguish:

- **Hard product constraints:** auction price + action visible in LIVE; no price/deadline on discovery cards; nav/actions reachable; text readable; overlaps never cover interactive controls or required facts; fixture stress cases still work.
- **Provisional art-direction values:** sizes, overlap, plate positions, display scale — starting ranges only.

Other screens keep V1 product structure, states, and accessibility. Their visual anatomy follows after a golden candidate is selected.

### Process (V2.1)

```text
V2.1 principles
→ 3 visual explorations × 3 golden screens
→ founder selects / combines a direction
→ update golden screen blueprints
→ lock final display typography / radius / accent usage
→ propagate design system
→ remaining states / viewports
→ only then Pen implementation
```

Do not solve 118 frames, and do not build component boards except what is required to render the nine explorations, before this gate.

## 11. Key tensions and how V2 resolves them

| Tension | Resolution |
| --- | --- |
| Magazine vs service | IA and whitespace from WePresent; atmosphere from Get Hyped. Service chrome stays calm, sparse, and untilted. |
| Story vs transaction | Work desire is media + type in shared space. `auction_panel` is an independent quiet rectangle, sticky/reachable in LIVE. |
| Energy vs clarity | Energy comes from scale, asymmetry, real media, and a few strong color fields — not from pastel fills or default tilt. |
| Expression vs templates | One creator template; accents still hash-assigned; composition slots allow irregular layout without per-creator art direction. |
| Web vs native | Mobile remains a recomposed vertical story with Medallion control grammar. Golden screens are specified at 1440 first. |

## 12. Rejected V1 visual rules

These caused the old/soft result and are removed as defaults:

- Warm vanilla canvas on every screen (`#FAF4EA` and similar cream).
- Pale yellow / pastel scene rectangles as the product’s color language.
- Piazzolla as the automatic display voice for names, titles, and chapters.
- Radius 24/28/999 as the default on media, scenes, cards, and buttons.
- “Rounded colored container + tilted stack” as the Get Hyped translation.
- Mandatory `scene → chapter → rail` page formula.
- Identical 640px chapter template.
- Uniform 3×2 / equal-card discovery matrices as the visual signature.
- Accent-soft frames on every work/creator card (WePresent color-pass overcorrection).

## 13. Drift checks

- **Marketplace drift:** discovery cards still carry no price/deadline/bid-count. ✔ kept.
- **Magazine drift:** `Создать`, search, and auction panel remain fixed chrome; V2 also blocks literary serif + cream atmosphere. ✔ strengthened.
- **Social drift:** no feed, counters, or likes on MVP. ✔ kept.
- **Luxury / cottage drift:** near-white + ink + grotesk + strong contemporary accents. ✔ rewritten.
- **SaaS-kit drift:** pills are not the default language; geometry stays substantially straighter than V1; radius serves composition. ✔ rewritten.
- **Maximalism drift:** no quota of tilted stacks; energy is compositional, not decorative. Tilt/overlap never cover auction facts or interactive targets. ✔ rewritten.
- **Generated-kit drift:** one dominant event per viewport; macro whitespace; chrome removed before gaps added; not every API field visible. ✔ added.
- **Content dependency / manual art direction / contract hallucination:** V1 rules kept.

## 14. Explicit unknowns (unchanged)

Same `Missing input` list as V1: logo wordmark (symbol only), category taxonomy, slug authorship, influencer onboarding variant, rules version string, Golos tabular numerals, Pinterest mobile evidence, unconfirmed content limits.

## 15. Definition of success

> Молодая цифровая площадка авторов: работы занимают пространство как в современном культурном медиа, продаются через тихий аукцион, и страница не выглядит как набор одинаковых карточек.

Gate before Pen: place the nine golden explorations next to WePresent and Get Hyped screenshots. Structure should rhyme with WePresent; attitude should rhyme with Get Hyped; neither site should be copied; beige literary V1 should be unrecognizable. Each candidate must pass the AI-like design check in §8. Founder selects or combines a direction before tokens and remaining screens lock.
