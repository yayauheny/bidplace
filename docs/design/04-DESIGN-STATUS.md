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
| Dock | Домик в общем floating dock; DEC-088 — четыре пункта | |
| Шторки auth | Поверх текущей страницы, dismiss из шапки (DEC-122); dimmer не сбрасывается на forgot-password | |
| Поиск | Fullscreen overlay (DEC-096) | |

## Needs verification

- Физический iPhone, реальный browser zoom, увеличенный системный текст.
- Desktop 1024/1440 там, где в Figma есть только 390 (`NEEDS-FIGMA`).
- Home Opening visual mismatch (V01 в release audit) — post-MVP, порог 0.12 не ослаблять.

Не закрывайте эти пункты по старым записям журнала без новой проверки.
