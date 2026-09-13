# Figma stabilization — final regression pass

Date: 2026-09-13  
Branch: `fix/figma-stabilization`  
Stand: Expo `http://localhost:8093`, API `:3003`, DB `bidplace_e2e` (reused,
not reset). Chromium + WebKit. Viewport 390 unless a spec sets another size.

## Checks run

| Check | Result |
|---|---|
| `pnpm verify` | pass — typecheck 7/7, lint 2/2, API unit 282, contracts 25, client 3, integration 78, build 7/7 |
| `pnpm --filter @bidplace/mobile test` | 248/248 |
| `expo export --platform web` | pass (`apps/mobile/dist`) |
| Playwright matrix | **38 passed / 0 failed** — one clean Chromium + WebKit run (3.5m) |

## Failure classification (before this pass)

None of the five remaining failures were product regressions.

| Failure | Class | Why |
|---|---|---|
| `discovery-launch` Works 12→15 (Chromium + WebKit) | Stale expectation | Catalog page size is 12; e2e DB has 18 Works. The leftover remainder of 3 is not a server or UI contract. |
| `auth-layout` intro copy (Chromium + WebKit) | Stale expectation | S4 and RFC §16.7 removed the desktop marketing intro. Register is a stacked phone-column form. |
| WebKit frost PNG equality | Incorrect / non-deterministic check | WebKit does not composite `backdrop-filter` into element screenshots. CSS geometry, mask, gradient and blur were already correct. |

## Playwright

Passed on **both** Chromium and WebKit in one run (19 × 2 = 38):

- Home selected/null/empty/loading/error/broken media/zoom/reduced/keyboard/1024/1440 (`home-figma.spec.ts`)
- Author full→compact→full, 0/2/3 socials, delayed binding, reduced snap (`author-header-motion.spec.ts`)
- Works filters + URL + Back + pagination from live `/api/works` metadata, list growth, no duplicate ids (`discovery-launch.spec.ts`)
- Authors filters/name sort/URL (`discovery-launch.spec.ts`)
- Search result/empty/partial retry (`discovery-launch.spec.ts` + `figma-stabilization.spec.ts`)
- Works sort newest/oldest, URL, Back (`figma-stabilization.spec.ts`)
- Authors «По дате добавления» / not «По активности», URL, Back (`figma-stabilization.spec.ts`)
- Work page portfolio composition (`product-layout.spec.ts`)
- Work ShareSheet focus, download event, Escape, focus return (`figma-stabilization.spec.ts`)
- Auth login/register/forgot at 390 (`figma-stabilization.spec.ts`)
- S4 register: no removed intro, stacked Имя/Email/Телефон/Пароль, centered 390 column at 1440 and 390 (`auth-layout.spec.ts`)
- Card hover/focus geometry on `/works` (`figma-stabilization.spec.ts`)
- Home + Works at zoom 200% (`figma-stabilization.spec.ts` + `home-figma.spec.ts`)
- Cover frost: size, position, mask/gradient/blur, no inner plate; PNG evidence; Chromium-only blur raster inequality (`figma-cover-frost.spec.ts`)

## Screenshots from this pass

`chromium-*` and `webkit-*` in this directory: works sort, authors sort,
search partial, share work, login, card hover, home zoom 200%, register
1440/390, cover frost 390.
