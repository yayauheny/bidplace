# bidplace — статус дизайна

Текущее состояние production UI на 2026-10-20. Подневной журнал реализации
(включая Pen-эпоху) — `git show d0efc03b:docs/design/04-DESIGN-STATUS.md`.

Визуальный источник: живая Figma `pAPQo6cADmG5XzVmBX76EE`. Локальный
`design/figma-handoff` вторичен и может устареть. Правила компонентов —
`03-DESIGN-SYSTEM.md`. Pen снят (DEC-119).

## Сейчас в коде (web)

| Тема | Статус | Ограничение |
| --- | --- | --- |
| Focus | Implemented, DEC-127: #121212 light / #FFFFFF black | Black-палитра provisional; пользовательского переключателя темы нет |
| Календарь дат | Implemented: общий `DateField`, React Aria на web | Native picker — DEC-126; физический iPhone не проверялся |
| Регистрация | Fullscreen-последовательность, один consent, слот никнейма, документы не внутри шага | Сверка с live Figma при расхождении handoff |
| Account | Shared-ширина шторок и финальная web-приёмка 2026-10-20 | Сверка с Figma account nodes — Needs verification |
| Загрузка фото | Partial: локальные превью, подготовка, пофайловый результат и retry; обработка портрета видима | Chromium/WebKit: 7 МиБ, частичный сбой/retry, ширины 390/1024/1440 проверены; Expo iOS/Android export прошёл; физические устройства и Figma-паритет новых состояний — Needs verification |
| Dock | Домик в общем floating dock; DEC-088 — четыре пункта | |
| Шторки auth | Поверх текущей страницы, dismiss из шапки (DEC-122); dimmer не сбрасывается на forgot-password | |
| Поиск | Fullscreen overlay (DEC-096) | Последняя revision: один history entry `overlay=search`; Back восстанавливает сессию. Раннее «Back не пушит history» отменено |

## Needs verification

- Физический iPhone и native runtime, реальный browser zoom, увеличенный системный текст.
- Native Safe Area. Поздний web-срез её не закрывал.
- Desktop 1024/1440 там, где в Figma есть только 390 (`NEEDS-FIGMA`).
- Live Turnstile и Cloudflare site key: production fail-closed, не local dummy token.
- Keyboard focus, reduced motion и состояния loading/empty/error остаются правилами `03-DESIGN-SYSTEM.md`. На физическом устройстве они не приняты.
- Home Opening visual mismatch (V01) — post-MVP, порог 0.12 не ослаблять.

Не закрывайте эти пункты по старым записям журнала без новой проверки.
