# bidplace — creator-first redesign brief

Date: 2026-08-13
Status: founder-approved exploration brief
Audience: design architect model, Pen builder, and visual QA reviewer

## 1. Assignment

Create a new web/native visual system for bidplace from first principles. Do not modernize, reskin, or adapt the current frontend. Preserve the product/data behavior in `00-PRODUCT-MVP-DESIGN-AUDIT.md` while replacing the visual hierarchy and presentation logic.

The experience must combine:

```text
the editorial confidence of WePresent
+ the media/card energy of Get Hyped
+ the creator centrality of Medallion
+ the work-story depth of Avant Arte
+ the restraint of Stationhead
+ the discovery usefulness of Pinterest
+ a clear, quiet auction action
```

## 2. North-star experience

On entry, a visitor should feel that they opened a contemporary cultural magazine with real creators and desirable works—not an e-commerce category page. Within seconds, they must still understand where to explore, who the creator is, what can be acquired, and how to act.

The target emotional sequence is:

```text
beauty and curiosity
→ recognition of a person
→ interest in a work
→ understanding of its value
→ confidence to bid
```

The platform should feel like a helpful friend to the creator: it provides presentation structure, scheduling, a shareable public URL, and a trustworthy transaction surface without asking the creator to art-direct a personal microsite.

## 3. Primary design equation

### Cultural Drop — visual layer

- Bright, youthful, image-led, and event-aware.
- Strong blocks, controlled overlap, vivid framing, and concise statements.
- Adult and readable; never noisy, childish, or dopamine-maximalist.

### Creator World — relationship layer

- Creator is the top-level human entity.
- Works belong to a continuing practice, not an anonymous inventory record.
- Public contacts and shareability matter more than public engagement counters.

### Editorial Auction — work/transaction layer

- One work deserves a deep, sequential story.
- Process, materials, authorship, provenance, and uniqueness establish value.
- Price and bid remain easy to find but do not dominate visual identity.

## 4. Reference roles

The reference manifest is `design/creator-first/REFERENCE-MANIFEST.yaml`. Apply references by role, not by averaging their appearance.

| Reference | Weight and role | Take | Do not take |
| --- | --- | --- | --- |
| WePresent | Equal primary, 50% of the synthesis; structural/editorial owner | Navigation clarity, first-screen statement, magazine pacing, varied story grids, color-filled cards, author context | Publisher-only IA, proprietary branding, literal copied layouts/assets |
| Get Hyped / Bullit | Equal primary, 50% of the synthesis; media/energy owner | Stacked and lightly rotated media, bold frames, short copy, playful controls, saturated confidence | Agency IA, oversized-everything, gratuitous hype, too many simultaneous accents |
| Medallion | Mobile controls and product philosophy | Creator as homebase, quiet search, large pill actions, clear iconography, one decision per step, loading/success validation, low-control-count mobile surfaces | Dark theme requirement, music integrations, subscription/comments/follow mechanics, rankings or verification badges |
| Avant Arte | Work page | Process, material, detail, edition/provenance storytelling | Conservative luxury tone, inaccessible curator language |
| Stationhead | Restraint and moment | Simple artist recognition, event immediacy, minimal actions | Dark entertainment default, celebrity verification/follower semantics |
| Pinterest | Explore architecture | Fast scanning, visual recommendations, related paths, progressive discovery | Endless engagement feed, popularity bias, clone-like masonry everywhere |
| Metalabel | Data model only | Release, edition, credits, collaboration thinking | Dense terminology, visual complexity, niche/cryptic interaction |
| JOOPITER | Transaction clarity only | Readable auction state and trust information | Auction-house luxury styling and lot-catalog dominance |
| COLORS | Auth welcome | Expressive `Hello` scale, light choice hierarchy, one calm auth decision area | Brand typography/assets, generic AI gradient as system decoration |
| Creator publishing flow | Creator activation | Visible `+ Новая работа`, clear sequence, preview, category and validation states | Social-post/reward language, invented category behavior |
| Foundation | Selected work/create patterns | Persistent `Create`, split work hero, media stack, compact bid dialog | NFT, wallet, ETH, minting, offers, packs, feed mechanics |
| Mobbin Awards | Creator presentation | Portrait-first cards, readable preview modal, bounded lower blur/mirror caption | Awards/curator semantics, effect on every card or full-page blur |

## 5. Founder visual decisions

### WePresent influence

- Use its calm global navigation and editorial composition as the main structural reference.
- Preserve generous breathing room and a clear centered or deliberately offset opening statement.
- Use heterogeneous story layouts instead of identical cards.
- Colored card fills may change across a page to create rhythm and distinction.
- The page may feel like a fashion/culture magazine, but controls must remain immediately understandable.

### Get Hyped influence

- Media may stack, overlap, and rotate within controlled bounds.
- A compact information card may sit beside/over a dominant image.
- Default card content is image, title, creator, and one short descriptor.
- A lower-right arrow may indicate gallery progression, but navigation to detail must use a distinct rightward/link affordance.
- Cards can be bright and youthful without turning the whole product into a social feed.
- For work/media progression, expose one clear rightward control and preserve swipe/drag plus keyboard access; do not copy a decorative two-arrow pair.

### Scalable creator identity

- Use one robust creator-profile template.
- Do not derive full-page backgrounds, palettes, or text colors from arbitrary user photos.
- Do not require manual page art direction for each creator.
- Variation comes from real media, controlled preset accent roles, composition, and content—not from an entirely new UI theme per profile.
- A bounded lower caption surface may mirror/blur a slice of the same public image inside a creator or work card. It needs an opaque fallback and verified contrast; the architect must assign it one primary use rather than spreading it across the whole system.

### Creator activation and publishing

- `Создать` is a primary global action, not a control hidden in a profile or overflow menu.
- Desktop uses a dark rounded action with a white plus and explicit role-aware label. Mobile may use a compact black-plus action, but it remains persistently discoverable and has an accessible text label.
- A guest/non-creator enters creator onboarding; an approved creator enters work creation; pending/restricted creators see their real status/cabinet destination. Do not visually grant unsupported capability.
- Creator-profile creation and work creation use one main task per step, a stable progress/feedback region, keyboard/safe-area states, and clear loading/error/disabled/retry behavior.
- Use bidplace vocabulary (`автор`, `работа`, `предмет`), not `post`, followers, rewards, or content-feed language.

### Light welcome/auth

- Auth should feel direct, friendly, and visually light: one expressive welcome heading, concise explanation, and a small number of obvious sign-in paths.
- A media/color field may support the composition, but it should come from the approved palette or creator/work atmosphere—not a mandatory free-form gradient effect.

## 6. Visual character

Desired qualities:

- creator-first;
- editorial and culturally aware;
- young, warm, confident, and lively;
- concise and fast to scan;
- inclusive across disciplines and career stages;
- visually desirable without luxury gatekeeping;
- straightforward under transaction pressure.

Avoid:

- marketplace grid as the dominant first impression;
- beige-on-beige quietness;
- generic SaaS/bento dashboards;
- glassmorphism and AI-gradient decoration;
- fashion-serif-only luxury language;
- NFT/crypto or gaming urgency;
- maximalist chaos, scroll-jacking, or hidden navigation;
- long uninterrupted editorial essays;
- ratings, follower counts, badges, and fake social proof;
- manually customized creator microsites.
- hidden or menu-only creator activation;
- full-page user-photo blur that can destroy text contrast;

## 7. Typography direction

Use a two-voice system with excellent Cyrillic:

1. An expressive editorial display face for cultural statements, creator names, and selected section openings. It may be serif or high-character display, but must not create an exclusive auction-house tone.
2. A confident grotesk for navigation, cards, labels, body UI, forms, auction numbers, and transactional clarity.

The design architect must choose exact licensed/available families and specify fallbacks, weights, optical use, line heights, and Russian long-copy behavior. Typography is not inherited from current Onest/Inter.

## 8. Color direction

The supplied mood image is atmosphere, not a palette contract. Explore a controlled system around:

- warm off-white/vanilla canvas;
- deep ink/navy rather than soft gray text;
- periwinkle, teal, muted brown, yellow, orange, and pink as curated accents;
- release/story surfaces that change rhythmically while preserving contrast.

Do not give every creator a generated palette. Define a small tested set of semantic accent pairs. Auction success/error/focus colors remain semantic and must not be confused with editorial decoration.

## 9. Composition and density

- Use large media selectively, not universally.
- Use asymmetric editorial grids with a clear reading order.
- Allow controlled overlap only where hit targets, focus rings, and reading flow stay obvious.
- Alternate high-impact scenes with calmer information chapters.
- Prefer one thought per block and concise copy.
- Avoid both dense marketplace walls and oversized landing-page sections that hide useful content below every fold.
- On mobile, transform the composition into a direct vertical story rather than shrinking desktop geometry.

### Mobile control grammar

- Use the Medallion screenshots for interaction density and sequencing, not for dark-theme styling or music/social product semantics.
- Prefer one main decision per onboarding/form step, one stable feedback region, and one clear primary action.
- Search and text input use quiet rounded surfaces with explicit focus, loading, success, error, disabled, and character-limit states.
- Inline async validation must not shift the primary layout or require a modal.
- Keep icon count low, use familiar symbols, and add text labels wherever an icon alone is ambiguous.
- Design keyboard-open, safe-area, short-content, long-error, slow-validation, media-permission-denied, and retry states as first-class 390 px frames.
- Large pill buttons are a compositional pattern, not a license to make every secondary action visually primary.

## 10. Screen direction

### Creator profile — design first

The profile should feel like a durable home, not a seller record.

Suggested hierarchy:

1. Creator identity and portrait.
2. Short statement and public contact links.
3. One current work/release.
4. Works in a visual mixed but systematic layout.
5. Short practice/biography chapter.
6. Process or studio material when available.
7. Ended/archive works.

The existing backend has only one `shortDescription`; do not invent a feed or multiple biography fields. The specification may show how the same field behaves at short and long lengths.

The profile and work-card system may test one bounded lower mirror/blur caption treatment. The exact owner—creator card, featured work, or neither—must be recommended once, with a solid fallback and long-name/contrast evidence.

### Work/release — design second

Suggested hierarchy:

1. Dominant work image or controlled gallery.
2. Title, creator, and one-line value statement.
3. Compact transaction action.
4. Story chapter.
5. Creation/process chapters.
6. Object details and provenance.
7. Delivery/practical information.
8. Bid history and rules.
9. More from the creator.

Use image, title, and short copy to create desire before exposing the full metadata set. Do not hide legally/transactionally relevant information once the visitor decides to bid.

### Home

- First screen presents one creator, one work, and one moment together.
- Navigation and search remain obvious.
- A role-aware creator action remains obvious from the global shell: creator onboarding for a visitor/non-creator, work creation for an approved creator, and honest cabinet/status routing for other creator states.
- Follow with a small number of curated creator/work/story entries.
- Use the current `topAuctions`, `creators`, and `newWorks` data projection honestly.

### Explore

- Support separate but connected paths for creators and works.
- Default visual cards omit price/deadline.
- Use mixed scale and related trails, but keep filters/search available in a secondary layer.
- Pinterest is a usability reference, not a license to create an infinite homogeneous feed.

### Auction

- On work detail, show current/start price plus one primary bid action.
- Make the deadline accessible but not the visual headline.
- Move bid history, rule explanation, increment hints, and confirmation into calm secondary blocks/dialogs.
- On mobile, use a compact safe-area-aware persistent action only while useful.
- Preserve all server-authoritative states from the audit.

## 11. Motion

Motion intensity: medium-low.

Allowed:

- short image crop/scale on hover/focus;
- stack/card settling;
- restrained crossfades between media;
- short section reveals;
- clear menu, carousel, tab, sticky-action, and error feedback.

Forbidden:

- scroll-jacking;
- required background video;
- continuous decorative loops;
- bounce-heavy motion;
- animation that delays price/status updates or bidding;
- hover-only meaning;
- layouts that fail under reduced motion.

## 12. Required initial frames

Produce the system in this order:

1. Creator Profile — desktop 1440 and mobile 390.
2. Work/Release scheduled — desktop and mobile.
3. Work/Release live — desktop and mobile.
4. Bid interaction states — focused state board.
5. Home — desktop and mobile.
6. Explore — desktop and mobile.
7. Tablet 1024 derivations after the direction is coherent.
8. Creator activation and work-creation entry states: desktop global action, mobile global action, guest/non-creator, approved creator, and pending/restricted creator.
9. Creator onboarding/work creation — the minimum 390 mobile state sequence needed to specify default, keyboard-open, validation, media permission failure, disabled, retry, and review/submit behavior.

Supporting flows and future fixed-price concepts come only after founder approval of this vertical slice.

## 13. Content scenarios

Use realistic Russian copy. The same system must show:

- a painter with rich process photography;
- a creator from another discipline to prove inclusivity;
- a new creator with minimal content;
- a long creator name and long work title;
- one-image and multi-image works;
- video-present and no-video future variants;
- scheduled, live, extended, ended, won, and no-bid states.

Temporary invented fixtures are allowed only for design stress-testing and must be labeled. Do not present invented metrics, awards, bids, or provenance as product facts.

## 14. Evaluation rubric

Score each 1–5. A recommended direction must score at least 4 in the first six dimensions and have no critical contract violation.

| Dimension | Test |
| --- | --- |
| Creator primacy | Can a visitor name the creator and understand their practice before thinking “marketplace”? |
| Work desire | Does the work look meaningful and desirable before commerce metadata? |
| Navigation clarity | Can a first-time visitor immediately find creators, works, search, and the next action? |
| Transaction clarity | In live state, can a buyer find price, end time, and bid action without hunting? |
| Content resilience | Does it still work with one image and short text? |
| Mobile quality | Does 390 px feel intentionally composed rather than compressed? |
| Originality | Is the result recognizably bidplace rather than a WePresent/Get Hyped clone? |
| Accessibility | Is contrast, focus, touch, semantics, and reduced motion credible? |
| Scalability | Can every approved creator use the same system without manual art direction? |
| Feasibility | Can Expo/React Native Web implement it without a web-only dependency or heavy 3D/video runtime? |

## 15. Definition of success

The final direction should be describable as:

> A young editorial creator home where works are presented like cultural releases and sold through a quiet, trustworthy auction layer.

It fails if a visitor's first description is “art marketplace,” “online magazine with no obvious product,” “social feed,” or “luxury auction site.”
