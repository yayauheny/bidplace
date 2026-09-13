# Figma stabilization — final regression pass

Date: 2026-09-13  
Branch: `fix/figma-stabilization`  
Base: `70c5fd5` + cherry-picks of `67f6824` (author header) and `04289fe` (Home).  
Stand: Expo `http://localhost:8093`, API `:3003`, DB `bidplace_e2e` (reused,
not reset). Chromium + WebKit. Viewport 390 unless a spec sets another size.

## Checks run

| Check | Result |
|---|---|
| `pnpm verify` | pass — typecheck 7/7, lint 2/2, API unit 282, contracts 25, client 3, integration 78, build 7/7 |
| `pnpm --filter @bidplace/mobile test` | 248/248 |
| `expo export --platform web` | pass (`apps/mobile/dist`) |
| Playwright matrix (38 then 8 re-run) | see below |

## Playwright

Passed on **both** Chromium and WebKit:

- Home selected/null/empty/loading/error/broken media/zoom/reduced/keyboard/1024/1440 (`home-figma.spec.ts`)
- Author full→compact→full, 0/2/3 socials, delayed binding, reduced snap (`author-header-motion.spec.ts`)
- Authors filters/name sort/URL (`discovery-launch.spec.ts`)
- Search result/empty/partial retry (`discovery-launch.spec.ts` + `figma-stabilization.spec.ts`)
- Works sort newest/oldest, URL, Back, pagination without a hardcoded remainder (`figma-stabilization.spec.ts`)
- Authors «По дате добавления» / not «По активности», URL, Back (`figma-stabilization.spec.ts`)
- Work page portfolio composition (`product-layout.spec.ts`)
- Work ShareSheet focus, download event, Escape, focus return (`figma-stabilization.spec.ts`)
- Auth login/register/forgot at 390 (`figma-stabilization.spec.ts`)
- Card hover/focus geometry on `/works` (`figma-stabilization.spec.ts`);
  missing-media geometry is Home broken-media (`home-figma.spec.ts`), not
  this card test
- Home + Works at zoom 200% (`figma-stabilization.spec.ts` + `home-figma.spec.ts`)
- Cover frost Chromium (`figma-cover-frost.spec.ts`)

Not treated as product regressions:

- `discovery-launch` Works 12→15 — leftover remainder vs 18-work e2e DB (12 then 17/19).
- `auth-layout.spec.ts` still looks for the removed desktop introduction
  «Искусство встречает своего следующего владельца.» S4 register no longer
  renders that line; the form itself rendered (screenshot).
- WebKit frost PNG equality (`withBlur.equals(withoutBlur)` true) — Chromium
  still differs. Not an S8 revert.

## Screenshots from this pass

`chromium-*` and `webkit-*` in this directory: works sort, authors sort,
search partial, share work, login, card hover, home zoom 200%.
