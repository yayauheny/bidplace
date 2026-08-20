# Creator-first redesign — founder decisions

Recorded: 2026-08-13
Scope: exploratory design direction and agent workflow
Canonical status: these decisions govern the creator-first design packet. They do not replace protected product documents or promote a new Pen file without a later explicit decision.

## Product hierarchy

1. The new visual system starts from zero. The current frontend is not a visual reference.
2. Backend contracts and confirmed MVP behavior are the source of product truth.
3. The primary hierarchy is creator → creator story/practice → works → one work's story/value → sale or bid.
4. Auction and release are organization mechanisms, not the brand's main subject.
5. The platform should feel like a helpful creator homebase: it packages identity and work professionally and makes publishing/sharing/scheduling easier.
6. Creators are not restricted to fine-art disciplines, established careers, or high follower counts.

## Visitor and discovery experience

7. Visitors come to discover meaningful, desirable things—not to perform commodity shopping.
8. The experience should be calm enough for gallery-like exploration and fast enough for familiar social/discovery scanning.
9. Information is concise and sequential. Design creates positioning; copy must not become a long wall.
10. Public work cards hide price and deadline by default. They prioritize image, title, creator, and a short descriptor.
11. Price, deadline, and bid action remain clearly accessible on work detail and before commitment.
12. Pinterest-like Explore and recommendations are strategically important, but recommendations are post-MVP behavior.

## Creator utilities

13. A creator/work public link must be quick to obtain and share.
14. Public contact and social links must be easy to find.
15. Wishlist/saved work and other small retention affordances may be designed as future extensions, not claimed as MVP.
16. Fixed-price sale screens may be considered after the creator/work public system, but implementation is post-MVP.
17. Process video is a valuable optional future format; the MVP must remain complete without it.
18. Creator activation is a primary product action, not a menu-only utility. The global shell must keep an obvious role-aware entry point to create a creator profile/cabinet or add a work.
19. On desktop, the creator action uses a dark rounded control with a white plus and explicit text. On mobile, a high-contrast plus action may be compact, but it must retain an accessible label and must not be hidden inside an overflow menu.
20. The exact label follows real capability: a visitor/non-creator enters creator onboarding; an approved creator adds a work; pending or restricted creators see their real status/cabinet path. The design must not imply permission the backend does not grant.
21. Creator onboarding and work creation should feel sequential and encouraging: one principal task per step, a visible progress/feedback area, clear disabled/loading/error states, and an obvious final submit/review action. Use `работа`/`предмет`, not social-post language.

## Reference weighting

22. WePresent and Get Hyped are equal primary references: the target is a 50/50 synthesis, not an 80/20 hierarchy.
23. WePresent owns editorial structure, navigation, homepage rhythm, author positioning, whitespace, and the cultural-magazine feeling. Get Hyped owns card/media composition, stacked and rotated images, vivid framing, bold typography, motion, and youthful energy.
24. Medallion supplies creator centrality and the mobile control language: quiet search fields, large pill actions, clear iconography, one decision per step, visible loading/success validation, and sequential onboarding without visual clutter.
25. Avant Arte supplies work/process/history presentation but not its conservative tone.
26. COLORS supplies the light, welcoming auth tone and expressive welcome-heading reference; its gradient is atmosphere only, not a palette or AI-gradient mandate.
27. Foundation references supply selected composition and interaction patterns only: a persistent `Create` action, split work detail, media stacks, and a clear bid dialog. NFT, wallet, minting, feed, offer, pack, ETH, and crypto semantics are excluded.
28. Mobbin Awards supplies author-card and author-preview anatomy: portrait-first grids, readable biography, and a bounded lower media caption effect.
29. Stationhead supplies simplicity and moment/event feeling.
30. Pinterest supplies visual discovery logic.
31. Metalabel is useful for release/credit/edition thinking but is visually too dense and niche to lead the system.
32. Reference influence means principle-level synthesis, not reuse of third-party branding, assets, or a pixel-for-pixel clone.

## Art-direction correction — 2026-08-14 (V2)

Recorded in `design/creator-first-v2/`. Does not rewrite the product decisions above. Revises the **visual interpretation** of decisions 22–23, 8 (gallery-calm as atmosphere), and 23’s “cultural-magazine feeling.”

A. WePresent and Get Hyped remain the two primary references, but they are **not** averaged 50/50 visually.

B. WePresent owns information architecture, editorial restraint, whitespace, image-first storytelling, curated presentation, and clarity. It does **not** own visual atmosphere, beige/cream canvas, or a literary magazine mood.

C. Get Hyped owns visual attitude, youthful energy, composition, typography scale and rhythm, bold color, asymmetric layouts, unexpected media placement, controlled overlap, and modern digital feeling. It must **not** be reduced to “rounded colored container + tilted stack.”

D. The V1 packet remains the product/UX source. V2 is an art-direction correction of that packet. Production canon remains `design/pen/bidplace-web-v2.pen` until an explicit later decision.

E. Three golden screens remain the visual gate: Home 1440, Creator Profile 1440, Work Detail LIVE 1440. They are not locked as one recipe.

## Process correction — 2026-08-15 (V2.1)

Recorded in `design/creator-first-v2/`. Does not rewrite product decisions 1–50 or V2 A–D. Amends the visual **process** and a few overcorrections in V2.

F. Pills must not define the product language, and they are not forbidden. Tabs, filters, tags, and compact controls may use pill geometry when it helps. Buttons/search may use moderate rounding. Radius serves composition; do not force 4/8 as ideology. Overall geometry stays substantially straighter than V1.

G. Golos Text remains the UI/transactional family and the **starting** display candidate. Large display (`display_1`/`display_2`) is `provisional_until_golden_approval`. Explorations may test another modern Cyrillic-capable grotesk/display family. Do not return to a literary serif-led identity.

H. Deterministic `accent_selection` stays. **Assigned accent** is not the same as **visible strong accent**. Strong color is optional at composition level. Real media is the primary variety. One viewport should normally have one dominant strong-color gesture.

I. Canonical tokens are `accent_red_strong` / `accent_red_soft`. `accent_brown_*` remain deprecated aliases so fixtures can keep `accent: brown`. A developer must not read `brown` and receive red without that alias contract.

J. Creator identity on Work Detail is a link (for example `Полина Мирош ↗`), not a chip/control.

K. Each golden screen requires three art-direction explorations (A type dominant / B media dominant / C graphic interplay) before a blueprint is locked. Exact geometry (portrait size, overlap, statement width, display sizes) is provisional.

L. Pipeline: V2.1 principles → 3 explorations × 3 golden screens → founder selects/combines → update golden blueprints → lock display type / radius / accent usage → propagate system → remaining states/viewports → only then Pen. Do not build 118 frames or component boards (except what the nine explorations need) before this gate.

M. Human reading rhythm. Whitespace is an active compositional element. A viewport has one dominant visual event and a clear first / second / ignore-until-continue order. Macro empty zones are valid. Density is local. When crowded, remove chrome before adding gaps. Do not surface a field merely because the API provides it. Related information is one thought. Consecutive sections must not repeat the same visual formula. Each golden exploration must pass: “If branding were removed, would this look like an AI-generated UI kit?” If yes, revise.

## Visual constraints

33. The system should be youthful and expressive without becoming a dopamine-heavy social feed.
34. Large/brash elements are used selectively so navigation and content never become confusing.
35. Creator profiles use one reliable template. No manual art direction per creator and no arbitrary full-page photo-derived palette or low-contrast blur.
36. A bounded lower caption surface inside a creator/work card may reuse a mirrored or blurred slice of that same public image. It must have an opaque fallback, tested text contrast, no extra asset, and no dependency on manual art direction. The design architect must choose one primary use and prevent the effect from becoming universal decoration.
37. The current name and existing reversed-`b` symbol remain. Logo redesign is out of scope.
38. The provided color image is a mood reference, not a final palette.
39. Web, iOS, and Android share one system; mobile is an intentional vertical composition, not a scaled desktop page.

## Auction presentation

40. The work page should not be visually cheapened by a dominant commerce panel.
41. The minimal primary transaction presentation is price plus a clear bid action; deadline is accessible but subordinate.
42. Bid history, increment hints, rule explanation, confirmations, and detailed statuses use secondary information blocks or dialogs.

## Agent workflow

43. The strongest model chooses and recommends the best synthesis rather than returning several equally complete systems for the founder to solve.
44. Its output must include exact tokens, component contracts, screen blueprints, fixtures, and a Pen build plan—not prose alone.
45. A lower-cost agent performs mechanical Pen construction from those contracts.
46. A fresh strong-model pass audits exported screenshots and returns exact deltas.
47. The design architect reads only the prepared packet and chosen references, not the repository or old Pen.
48. The `ui-ux-pro-max` skill is installed immediately project-local, pinned, and subordinate to product/founder/reference decisions.
49. On work carousels, use one visible rightward progression control plus swipe/drag and keyboard support; do not reproduce a decorative two-arrow control pair.
50. Medallion's dark palette, music integrations, subscription gates, comments, follower actions, ranking percentages, and verification badges are not bidplace product requirements and must not be inferred from the screenshots.

## Approved execution order

V2.1 inserts nine golden explorations (3 screens × A/B/C) after the design contract and before any Pen build. See L. Original order below is otherwise unchanged.

```text
product/data audit
→ reference manifest
→ strongest-model design contract
→ founder direction approval
→ lower-cost Pen build
→ strong-model visual QA
→ correction
→ founder vertical-slice approval
→ remaining screens
→ implementation decision
```
