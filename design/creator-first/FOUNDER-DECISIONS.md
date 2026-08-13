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
