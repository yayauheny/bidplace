# Task 10 — read-only inventory Figma и gap map

## Кому дать

- Исполнитель: Grok 4.6 High с доступом к Figma.
- Независимая проверка: GPT-5.6 Sol или сильный UI reviewer.
- Приоритет: P1; audit-only, редизайн не начинать.

## Prompt исполнителю

```text
Repository: bidplace. Design audit only. Original Figma is immutable: запрещено edit,
comment, rename, move, duplicate-with-writeback, publish, component replacement или
изменение permissions. Не меняй app code и любые .pen files.

Прочитай AGENTS.md; docs/product/00, 01, 05, 11, 12; docs/design/00–04;
docs/audits/2026-09-06-IMPLEMENTATION-STACK-REVIEW.md; DEC-075; этот task.
Используй UI/design review discipline, но не реализуй UI.

Read-only Figma sources:
- home: https://www.figma.com/design/6WWy0IkFqsajKxErNsH3bQ/Bidplace?node-id=436-1136&t=ZRHr6nfY9DaVHNsG-0
- components: same file, node-id=143-147
- catalog: node-id=117-72
- author: node-id=1-3
- work: node-id=1-4
- auth: node-id=1-5

Перед чтением зафиксируй success criteria и способ доказать, что файл не менялся.
Если Figma недоступна, верни blocked/partial и не восстанавливай measurements по screenshots,
Pen или догадкам. Hugeicons reference: Stroke Rounded from hugeicons.com; инвентаризируй
semantic icon roles, но не скачивай/не коммить assets и не заключай license без источника.

Создай:
docs/audits/2026-09-XX-FIGMA-READONLY-GAP-MAP.md

Обязательное содержание:
1. page/frame/node inventory: route, viewport, component/state and node ID;
2. design tokens actually observed: colors, typography, spacing/radius/elevation;
3. shared component matrix and variants, including icons;
4. per-screen loading/empty/error/long-content/keyboard/focus/accessibility/responsive states:
   observed / missing / not verifiable;
5. map Figma → current mobile routes/components → API fields/contracts;
6. conflicts with current owner docs and DEC-075, without choosing product behavior;
7. explicit gap list for Work-first creation, final sale-format step, portfolio-only Work,
   auction, fixed sale, buyer offer, `Покупки / Продажи`, cancelled history, complaints,
   in-app notifications, legal footer/action copy and consent surfaces;
8. asset/export manifest needed later, without exporting now;
9. screen readiness classification: usable as-is / needs product completion / missing;
10. exact questions for designer/founder, deduplicated and ordered P0–P2;
11. implementation dependency order, with redesign explicitly last;
12. evidence that original Figma and all .pen files were untouched.

Do not call a static frame complete when required interaction states are absent. Distinguish
visual source from product/API truth. Do not import current Pen assumptions into Figma audit.
Designer reportedly completed most prototypes; basket/product-management/purchases logic
may still be missing—verify instead of assuming.

No app tests needed. Run link/path checks and `git diff --check`; verify the only changed
file is the audit. Create branch fix/figma-readonly-audit and one commit:
fix issue:

* added read-only figma inventory
* mapped design and product gaps
* documented redesign dependencies

Верни ровно:
1. Outcome complete/partial/blocked.
2. Branch, base SHA, commit SHA.
3. Figma pages/nodes successfully inspected and inaccessible items.
4. Ten highest-priority gaps.
5. Founder/designer questions.
6. Changed files and diff stat.
7. Static checks.
8. Explicit evidence original Figma and every .pen file are unchanged.
```

## Критерии готовности

- Все доступные frames привязаны к route, component/state и node ID.
- Missing interaction/responsive/accessibility states не замаскированы догадками.
- Work-first, три MVP sale mechanics, кабинет, legal UX и complaints отражены как gaps.
- Есть практический dependency order для будущего handoff, но нет реализации.
- Original Figma и `.pen` доказуемо не изменены.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь Task 10 по
docs/tasks/2026-09-06-reconciliation/10-FIGMA-READONLY-INVENTORY.md. Не меняй Figma,
code или .pen. Повтори read-only выборочную сверку node IDs, measurements/states,
сопоставь с owner docs, API/routes и DEC-075. Найди выдуманные states и пропущенные
product conflicts. Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3; unverifiable
claims; missing nodes/screens; correction prompt; доказательство immutable source.
```
