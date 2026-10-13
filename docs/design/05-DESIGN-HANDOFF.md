# bidplace — handoff Figma → production code

Последнее обновление: 2026-08-12

Статус: **Approved runtime scope implemented; workflow remains mandatory**

## 0. Portfolio-first addendum — 2026-09-08

Для First MVP visual source — live Figma `pAPQo6cADmG5XzVmBX76EE`. Figma запрещено
модифицировать любым tool; production адаптируется к нему. Product behavior определяется
`05-MVP-RFC.md`, а commerce-композиции Figma не реализуются в First MVP.

## 1. Главный запрет

Canonical source: live Figma `pAPQo6cADmG5XzVmBX76EE`.

Во время разработки Figma открывается только для чтения. Запрещена обратная
синхронизация из кода. Несовпадение с кодом исправляется в коде; конфликт с
продуктом поднимается как решение.

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
- список deliberate differences от Figma с владельцем решения.

Если canonical Figma node отсутствует, экран не переходит в implementation.

## 3. Рабочий процесс

### A. Reconcile

1. Прочитать product owners, `00`–`07` design docs и текущий status.
2. Найти route, feature screen, shared components, tokens, API client и tests.
3. Составить CURRENT → TARGET diff по layout, content, states и behavior.
4. Разделить gaps на visual-only, existing-contract, product decision и backend
   dependency.
5. Зафиксировать, какие части Figma пока blocked; Figma при этом не менять.

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

### E. Close

Обновить `03-DESIGN-SYSTEM.md`, `04-DESIGN-STATUS.md`, этот handoff при новых
инвариантах и `11-PROJECT-STATUS.md` при фактическом code/behavior change.
Приложить exact checks, screenshots, deliberate differences и remaining gaps.

## 4. Handoff card

Для каждого экрана pull request или task note содержит:

```text
Screen / route:
Figma root:
Shared Figma masters:
Production entry files:
Contracts used:
Roles:
States covered:
Motion states covered:
1440 / 1024 / 390 evidence:
Accessibility evidence:
Deliberate differences:
Blocked Figma concepts:
Checks run:
```

## 5. Правила расхождений

| Ситуация                                   | Действие                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| Figma отличается от текущего CSS           | изменить code/tokens                                                     |
| Figma требует неподдержанное поле          | остановить поле; открыть product/API decision                            |
| Figma показывает новый route               | не создавать route без IA decision                                       |
| Figma не содержит error/loading state      | вывести состояние из foundation и текущего behavior; согласовать         |
| Current code лучше покрывает accessibility | сохранить поведение и адаптировать visual implementation                 |
| Asset отсутствует или права неясны         | использовать честный placeholder; не подменять случайным stock asset     |
| Figma node повреждён/не найден             | заблокировать экран; не ремонтировать Figma в code task                  |
| Interaction отсутствует в static frame     | использовать `03`/`06`; не выдумывать локальную motion и не менять Figma |
| Reference содержит wallet/NFT/crypto flow  | брать только visual/motion pattern; не переносить product semantics      |

## 6. Acceptance checklist

- [x] canonical Figma node доступен и не изменён;
- [x] node IDs совпадают с реестром;
- [x] нет новых неподтверждённых product behaviors;
- [x] shared component не продублирован по routes;
- [x] server-authoritative auction state сохранён;
- [x] public/private data boundary сохранена;
- [x] required states и roles покрыты;
- [x] card media zoom не меняет bounds/grid и имеет focus/reduced-motion state;
- [x] buttons, menus, tabs, toast и sticky player используют shared motion tokens;
- [x] blur/atmosphere сохраняет sharp artwork, contrast и bounded performance;
- [x] responsive automated evidence приложено для текущего discovery среза;
- [x] accessibility automated evidence приложено для текущего discovery среза;
- [x] relevant checks зелёные;
- [x] design/project statuses обновлены;
