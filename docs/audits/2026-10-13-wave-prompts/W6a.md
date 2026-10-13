# WAVE W6a — Public author profile as the reference screen

Model: terra, effort high. Base: the accepted result of W5 (branch `ds/w6a-profile`). If this wave fails review twice for the same reason the coordinator will escalate; do not pre-escalate.

## Why

The public author profile is the first screen built on the new foundation and becomes the reference for later screens. Before W2 it was the only screen with its own 1280 width, plus a local halo, a manual horizontal gutter and a per-screen grid. After W2 (container), W1 (sheets) and W5 (Tabs, grid) it must be assembled from the shared parts only.

## Figma facts (live file `pAPQo6cADmG5XzVmBX76EE`, section "07 · Страница автора · Mobile", node `7008:12974`; 390-wide frames only)

- `01 · Автор / витрина работ` (`7008:12975`): top control row of 42 px buttons (gap 2); identity block: avatar 100x100 at x = 12, name / city / handle, social icon buttons 43x43 with a 22 px icon; tabs row (three equal 122 px columns in Figma — «Работы 4», «Архив 8», «Об авторе»); filter and sort buttons (height 43); work cards in **one column**, 366x488, gap 20; floating dock.
- `02 · Автор / об авторе` (`7008:13208`): two text blocks «Биография» and «Практика и подход» (title 21, body 140), then «Выставки и достижения»: a **horizontal scroll** of cards 266 wide with a 16 px gap; each card has a date label on top (for example «Апрель 2026») with a 14x14 marker and a 1 px line, then the image (266x354) and caption.
- `04..06` filters, selected values, share sheet.
- There are **no** desktop/tablet frames: 1024/1440 are `NEEDS-FIGMA`.
- **Product guard (do not implement):** the «Архив» tab and any sale/auction/favorites/bidding element (`DEC-083`, `DEC-087`). The profile has two tabs: «Работы» and «Об авторе».

## Do

1. `features/sellers/public-seller-screen.tsx` (and the files it composes) is built from shared parts only: **one** `AppShell` (loading / empty / error / owner / visitor states render inside it, not around it); horizontal spacing comes from the container (12), not from per-component margins; `Tabs` (two tabs, equal columns in `fill` mode); `WorkCoverCardGrid`; the filter/sort/share sheets through `AppDialog`; the author atmosphere layer outside the content column.
2. Remove the profile-only patches that the foundation now makes redundant: manual left/right offsets (`x4`-style gutters), the local halo/clipping workaround, any `useWindowDimensions`, any size/color literal. Vertical gaps that are specific to this composition become local named constants with the Figma node id in a comment (even numbers).
3. `features/sellers/AuthorAbout.tsx`: compare the layout numbers with the «Об авторе» facts above (card width 266, gap 16, date marker, text block sizes). Fix numbers that differ; do **not** change content or the exhibitions data contract (it is defined in `docs/product/05-MVP-RFC.md`).
4. States: loading, empty works, error, owner view, long author name, missing avatar, missing cover — each has a visible, accessible state. Reuse existing state components; no fake data.
5. Docs: `docs/design/04-DESIGN-STATUS.md` (<= 10 lines): public author profile status with evidence; desktop marked `NEEDS-FIGMA`, **not** `Implemented`. `docs/design/02-USER-FLOWS-AND-SCREENS.md`: only if a flow changed.

## Boundaries

- No new component unless it is the single owner of a role that already appears on this screen; a wrapper around `AppShell` is not allowed.
- Do not touch other screens, tokens (beyond what is needed to remove a literal by using an existing token), or product behavior.

## Done when

- `rg -c "<AppShell" apps/mobile/src/features/sellers/public-seller-screen.tsx` = 1.
- `rg -n "useWindowDimensions|#[0-9a-fA-F]{3,8}\b" apps/mobile/src/features/sellers/public-seller-screen.tsx` -> empty; no numeric style literal other than named local constants.
- The screen's composition is about 200 lines or less; anything bigger is logic moved into a hook (not into a wrapper component).
- Typecheck, lint, vitest green. Playwright chromium: `creator-profile`, `author-static-header`, `tab-switch-reveal`, `figma-cover-frost` (or "not run: reason").
- If you can run the web app: screenshots at 390 saved **outside** the repo (for example `/tmp/w6a-390.png`), listed in the report, next to the Figma frames `7008:12975` and `7008:13208`.
- Report: which profile-only patches were removed, which numbers in `AuthorAbout` changed.

## Stop

A Figma element that conflicts with `DEC-083`/`DEC-087`; an element the shared parts cannot express without a new prop (describe it, do not add a local workaround).
