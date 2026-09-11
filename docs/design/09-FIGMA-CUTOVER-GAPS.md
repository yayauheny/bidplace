# Figma phone cutover — gaps journal

Date: 2026-09-09
Inspect copy: `uMo04w9bgrchWXXDgO4W62`
Runtime: Expo phone column ~390, tokens in `packages/design-tokens`

## Skipped Figma nodes

- Page `Структура` moodboards and competitor dumps.
- Home «Открытие недели» and «Активные торги».
- Catalog tabs `Аукционы` / `Анонсы` / `Архив` and price filter.
- Dock cart / `shopping-basket-01`.
- Search overlay (categories / authors / works). `/search` is a stub.
- Create-work sale status, sale time, price, and «Подробнее о статусах».
- Create-work photo-text history variant (`877:6164`); runtime uses plain text.
- Author application sale interstitial («Начните продавать…»).
- Author application achievement photo blocks; existing cabinet achievements stay.
- Figma contact copy «для покупателя»; handoff stays private (`05-MVP-RFC.md`).
- Google / Telegram OAuth on auth frames.
- Desktop/tablet compositions (1024 / 1440).

## Unused Figma variants still in code

- `FigmaButton` `muted` (screens use solid / outline / ghost).
- `FigmaTextField` extra interaction states not all wired on every form.
- `WorkCoverCard` commerce overlay (`price` / `timer` / `status`) hidden in
  `mode="portfolio"`.
- Icons `google`, `ai-magic`, `shopping-basket-01`.
- Geist named on some Figma frames; runtime keeps bundled Inter.
- Home first-fold split chrome: `Frame 46` 64×64 search FAB (`456:8265`) beside
  a 232×64 pill without search. Production uses one 232×64 capsule with search
  inside (`DEC-088`).
- Long Home five-icon pill `436:1366` (288×64, includes cart). Cart stays
  deferred; width stays 232.

## Local Metro / tokens

`@bidplace/design-tokens` `"main"` is `dist/index.js` (gitignored). Changing
`tokens.ts` does not reach Expo until `pnpm --filter @bidplace/design-tokens
build`. Use `pnpm --filter @bidplace/mobile web` or `start` (they build tokens)
plus `expo start --clear`. `exec expo start` skips the token build and can show
the previous glass/blur values.

## Deferred product questions

- When to restore `Открытие недели` with a real editorial pick.
- Search overlay API shape and filters.
- Whether create-work should collect `Тираж` as required once Figma labels it.
- Licensed Geist files.
- Commerce chrome if `COMMERCE_ENABLED` becomes true.

## 2026-09-11 — Product copy vs Figma works/authors intro

Figma works and authors catalog intros still use «Покупайте самые эксклюзивные…»
(handoff `design/figma-handoff/portfolio-phone-v1/screens/works/works__default__390x2350__node-526-13248/metadata/source-prompt.md`).

Runtime uses discovery copy from `apps/mobile/src/lib/portfolio-copy.ts`:

- Works: «Работы избранных авторов. Всё, что вы видите, создано вручную.»
- Authors: «Авторы, чьи работы опубликованы на bidplace.»

`DEC-087`, RFC §14, and the legal checklist win over the Figma string. Do not
edit the Figma file or `design/pen/bidplace-web-v2.pen` to match production
in a code task.
