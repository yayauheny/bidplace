# bidplace — handoff Pen v2 → production code

Последнее обновление: 2026-08-10

Статус: **Required workflow**

## 1. Главный запрет

Canonical source: `design/pen/bidplace-web-v2.pen`.

Во время разработки файл открывается только для чтения. Запрещены save,
auto-layout fixes, rename, move, delete, replace, format, node cleanup,
component detachment и обратная синхронизация из кода. Если code tooling не
гарантирует read-only режим, работать по verified exports и node measurements,
а сам файл не открывать этим tooling.

Изменить Pen можно только в отдельно поставленной design-задаче. Несовпадение
с кодом исправляется в коде; конфликт с продуктом поднимается как решение.

## 2. Входной пакет на экран

До coding должны быть доступны:

- canonical root node и reusable masters;
- verified 1440 export и измерения;
- согласованные 1024 и 390 compositions;
- список real data fields и API endpoints;
- role/permission matrix;
- loading, empty, error, missing media и interaction states;
- motion contract for default/hover/focus/open/pressed/sticky/reduced-motion;
- asset provenance и права;
- список deliberate differences от Pen с владельцем решения.

Если canonical Pen отсутствует, экран не переходит в implementation.

## 3. Рабочий процесс

### A. Reconcile

1. Прочитать product owners, `00`–`07` design docs и текущий status.
2. Найти route, feature screen, shared components, tokens, API client и tests.
3. Составить CURRENT → TARGET diff по layout, content, states и behavior.
4. Разделить gaps на visual-only, existing-contract, product decision и backend
   dependency.
5. Зафиксировать, какие части Pen пока blocked; Pen при этом не менять.

### B. Extract

1. Считать точные цвета, type styles, spacing, radii и layout constraints.
2. Проверить master/instance relationship по canonical IDs.
3. Сопоставить каждый visual field с реальным contract field.
4. Записать responsive derivation и accessibility semantics.
5. Сопоставить статические nodes с motion/atmosphere rules из `03` и
   founder-reference index из `06`.
6. Получить approval handoff-пакета до edits в shared system.

### C. Implement

1. Менять shared tokens/primitives раньше route-local styles.
2. Реализовать canonical component из реальных данных и состояний.
3. Подключить его на одном reference screen.
4. Проверить behavior regression и visual comparison.
5. Расширить на остальные consumers без копирования component logic.

### D. Verify

1. Typecheck и lint affected graph без auto-fix.
2. Unit tests для новой component/state logic.
3. Integration/E2E для navigation, permissions и аукционных действий.
4. Screenshots 1440, 1024, 390 для default и критических states.
5. Для cards/controls: default, hover, focus-visible, pressed, menu-open,
   sticky и reduced-motion captures без layout shift.
6. Keyboard, screen reader semantics, zoom, reduced motion и contrast.
7. `git diff` подтверждает отсутствие изменений любых `.pen` files и совпадение
   canonical checksum.

### E. Close

Обновить `03-DESIGN-SYSTEM.md`, `04-DESIGN-STATUS.md`, этот handoff при новых
инвариантах и `11-PROJECT-STATUS.md` при фактическом code/behavior change.
Приложить exact checks, screenshots, deliberate differences и remaining gaps.

## 4. Handoff card

Для каждого экрана pull request или task note содержит:

```text
Screen / route:
Canonical Pen root:
Shared Pen masters:
Production entry files:
Contracts used:
Roles:
States covered:
Motion states covered:
1440 / 1024 / 390 evidence:
Accessibility evidence:
Deliberate differences:
Blocked Pen concepts:
Checks run:
Pen diff: none
```

## 5. Правила расхождений

| Ситуация                                   | Действие                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Pen отличается от текущего CSS             | изменить code/tokens                                                   |
| Pen требует неподдержанное поле            | остановить поле; открыть product/API decision                          |
| Pen показывает новый route                 | не создавать route без IA decision                                     |
| Pen не содержит error/loading state        | вывести состояние из foundation и текущего behavior; согласовать       |
| Current code лучше покрывает accessibility | сохранить поведение и адаптировать visual implementation               |
| Asset отсутствует или права неясны         | использовать честный placeholder; не подменять случайным stock asset   |
| Pen node повреждён/не найден               | заблокировать экран; не ремонтировать canonical file в code task       |
| Interaction отсутствует в static frame     | использовать `03`/`06`; не выдумывать локальную motion и не менять Pen |
| Reference содержит wallet/NFT/crypto flow  | брать только visual/motion pattern; не переносить product semantics    |

## 6. Acceptance checklist

- [ ] canonical Pen file доступен и не изменён;
- [ ] node IDs совпадают с реестром;
- [ ] нет новых неподтверждённых product behaviors;
- [ ] shared component не продублирован по routes;
- [ ] server-authoritative auction state сохранён;
- [ ] public/private data boundary сохранена;
- [ ] required states и roles покрыты;
- [ ] card media zoom не меняет bounds/grid и имеет focus/reduced-motion state;
- [ ] buttons, menus, tabs, toast и sticky player используют shared motion tokens;
- [ ] blur/atmosphere сохраняет sharp artwork, contrast и bounded performance;
- [ ] responsive evidence приложено;
- [ ] accessibility evidence приложено;
- [ ] relevant checks зелёные;
- [ ] design/project statuses обновлены;
- [ ] `git diff --name-only` не содержит `.pen`.
