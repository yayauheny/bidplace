# Login sheet Figma 7008:20543 — acceptance — 2026-10-16

Base: `a37ad983` (branch `fix/draft-restore`). Wave 11 of the draft-restore
corrected plan. Status: **Partial** — совпадение подтверждено по ZIP-снимку,
live-Figma сверка не выполнялась (см. «Источник»).

## Источник

- Figma-capture ZIP `01_·_Вход___email_и_пароль.figmacapture.zip`,
  capturedAt 2026-10-16T10:34Z, root node **7008:20543**, артборд 390×874.
- Это **dated fallback**: live Figma MCP в момент проверки недоступен, сверка
  выполнена против зафиксированного снимка `figma-reference-7008_20543.png`.
  Любые изменения макета после 16.10 в этот отчёт не входят.

## Mapping узел → компонент

| Figma (7008:…) | Компонент приложения |
| --- | --- |
| 20754 шторка входа (390×545 hug) | `AuthViewport` (bottom-sheet, radius 32 top) |
| Поля email / пароль | `TextField` / `FigmaTextField` (350×51, pad 13/12) |
| «Войти» / «Регистрация» | `FigmaButton` size `auth` (350×51, solid / ghost) |
| «Забыли пароль?» | ссылка 12px #565656, right-aligned |
| «или» + Telegram/Google | outline-кнопки под общим разделителем |
| Legal-копия | `AuthLegalText`, 12px center |

Layout-контракт: шторка hug по вертикали (контент 545px на 390×874), ширина
100% до `sheetMax`, вертикальный gap 14, pad 8/20/20/20, гибкая раскладка
без жёсткой высоты /874 — сжимается на 390×400 без overflow. Токены
(`designTokens.auth`, `figma-button.ts`) совпадают с макетом численно:
sheetRadius 32, loginGap 14, loginFormGap 10, handle 36×4, высота auth-кнопки
(12+0.5)×2+26 = 51.

## Расхождения (осознанно НЕ исправлялись)

| # | Что | Figma | Приложение | Решение |
| --- | --- | --- | --- | --- |
| 1 | Кнопка «×» в шапке шторки | нет | есть (dismissal/a11y-контракт) | оставить; NEEDS-FIGMA |
| 2 | «Показать пароль» (глаз) в поле | нет | есть (a11y) | оставить; NEEDS-FIGMA |
| 3 | Legal-копия | «Продолжая, вы принимаете политику…» | «Ознакомьтесь с политикой… и пользовательским соглашением» | копия принадлежит product/legal; NEEDS-FIGMA/product |
| 4 | Иконки в полях/кнопках | плейсхолдеры экспорта | у приложения иконок нет | совпадение |

Визуал приложения приёмки не менялся: экран уже построен под узел 7008:20543,
волна 11 — приёмка и фиксация расхождений, а не редизайн.

## Проверки

| Check | Actual result |
| --- | --- |
| Acceptance probe `apps/mobile/e2e/login-figma-acceptance.spec.ts`, Chromium + WebKit | 2 passed |
| Скриншоты #auth-sheet 390×874 + error-state, оба движка | 14 PNG в папке |
| Overflow-проверка 320/414/440 ×874 и 390×400 (short sheet) | нет вертикального overflow |
| Zoom 200% (a11y reflow) | шторка масштабируется без clipping |
| Полное сравнение со скриншотом reference (чтение кропов) | структура 1:1, посторонних глифов нет |

Команда: `cd apps/mobile && corepack pnpm exec playwright test
e2e/login-figma-acceptance.spec.ts` (стек API+web поднимается прогоном сам;
evidence пишется в `/tmp/bidplace-mobile-web-figma-evidence/2026-10-16-login-sheet/`,
скопировано сюда без изменений).

Все входные данные синтетические; реальные учётные записи не использовались.

## NEEDS-FIGMA

- Закрыть вопрос по «×» и «Показать пароль»: либо добавить в макет, либо
  подтвердить намеренное отклонение.
- Актуализировать legal-копию одним из владельцев (product/legal).
- Live-Figma сверка после появления доступа к MCP (ZIP-снимок dated).
- Desktop-композиция шторки (ширина > sheetMax) — отдельное решение дизайнера.

Maintenance: новая спека — приёмочная проба, не входит в обычный gate; код
приложения не изменён, owner-компоненты волну не трогали. No push, no merge.
