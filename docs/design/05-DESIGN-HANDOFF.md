# bidplace — handoff Pen v2 → production code

Последнее обновление: 2026-08-10

Статус: **Approved runtime scope implemented; workflow remains mandatory**

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

- [x] canonical Pen file доступен и не изменён;
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
- [x] `git diff --name-only` не содержит `.pen`.

## 7. Текущий runtime handoff — 2026-08-11

- Canonical SHA-256 до и после реализации:
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
- Реализованы GlobalHeader с `Аукционы`/`Авторы`/`Создать`, Browse Works, Home,
  Browse Authors, Search, AuctionCard, Product About/Creation/Bids,
  AuctionPlayer, URL-backed ProductTabs, related creator works, Creator
  Profile, auth, seller editors, Activity, Order и moderation.
- `/api/discovery/home`, `/api/products` и `/api/sellers` используют отдельные
  server-owned query contracts. Catalog pagination/sort/filter выполняются в
  PostgreSQL до hydration, а catalog images выбираются без бинарного `data`;
  account popover переводит клавиатурный focus на первый пункт.
- Creation process data model и multiple structured social links реализованы;
  fake routes и controls не создавались. API contract/unit/PostgreSQL coverage,
  mobile unit/typecheck/lint и полный Wave C Chromium acceptance зелёные.
  Founder visual review и physical iOS/Android smoke остаются внешним release
  gate.

## 8. Runtime handoff addendum — 2026-08-11

- Production UI now targets the current Pen v2 FINAL registry. The creator
  route uses only `MqUMz` — `FINAL — Desktop Creator / Profile / MVP v1`;
  `HOXkZ` — `Editorial Refinement v1` is explicitly excluded.
- The isolated Wave C visual/route matrix passes `4/4` at 1440/1024/390:
  catalog loading/loaded/failed-media and role states, Product buyer/admin
  boundaries, author/seller/purchases/order/auth/admin routes, and bid
  confirmation.
- The functional acceptance subset passes `16/16`; mobile unit tests pass
  `115/115`; mobile typecheck, lint, E2E fence and Expo exports pass. Evidence
  captures are written under `/private/tmp/bidplace-wave-c-screenshots/<commit>`
  and are disposable runtime artifacts, not Pen sources.
- The route-matrix harness uses `waitUntil: 'domcontentloaded'` for the
  client-rendered screens and explicitly opens the admin account menu before
  focusing the moderation link. This changes test synchronization only; it
  does not change production behavior.
- The guarded local seed now exposes four public products (`SCHEDULED`, `LIVE`,
  `ENDED`, plus a second `SCHEDULED` vase) for the H5vf2 four-card catalog
  density, and eight approved creator profiles for the N4ebBk author density.
  The extra profiles intentionally have no public work yet, so the fixture
  closes the visual-density gap without inventing additional auction history.
- Remaining release gates are matched visual overlay review against the
  canonical Pen, founder approval and physical iOS/Android smoke. The
  canonical Pen file remains unchanged at SHA-256
  `03798831d76992080d4edebf53c4c264f8f9754e01bbe81965083f271148d2a9`.
