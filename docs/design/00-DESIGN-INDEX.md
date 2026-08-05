# bidplace — индекс дизайн-документации

Последнее обновление: 2026-08-05

Статус: Confirmed как структура документации

## Назначение

Раздел связывает продуктовый контракт, пользовательские маршруты, визуальные принципы и фактический UI. Он не заменяет `docs/product/05-MVP-RFC.md` и не превращает существующий код или макет в продуктовое решение.

## Владельцы

| Файл                           | Единственная зона ответственности                     |
| ------------------------------ | ----------------------------------------------------- |
| `00-DESIGN-INDEX.md`           | Навигация, владельцы и правила обновления             |
| `01-DESIGN-FOUNDATION.md`      | Защищённые визуальные и UX-принципы                   |
| `02-USER-FLOWS-AND-SCREENS.md` | Product flows, карта экранов и обязательные состояния |
| `03-DESIGN-SYSTEM.md`          | Реализованные и целевые tokens/components/patterns    |
| `04-DESIGN-STATUS.md`          | Часто меняющийся фактический статус UI и дизайн-долг  |
| `05-DESIGN-HANDOFF.md`         | Передача макета в разработку и design QA              |
| `06-ASSET-INVENTORY.md`        | Фактическая карта брендовых, фото-, icon- и UI-исходников |
| `../../design/pen/README.md`   | Версионируемое Pen-пространство и текущий scope       |
| `../../design/pen/01-SCREEN-PROMPTS.md` | Нумерованные prompts актуальных MVP-экранов |

## Что читать

### Дизайнеру

1. `01-DESIGN-FOUNDATION.md`.
2. Нужный flow в `02-USER-FLOWS-AND-SCREENS.md`.
3. `03-DESIGN-SYSTEM.md`.
4. `04-DESIGN-STATUS.md`.
5. `05-DESIGN-HANDOFF.md` перед передачей макета.
6. `../../design/pen/README.md` и нужный prompt перед работой в Pen.
7. `06-ASSET-INVENTORY.md` перед использованием логотипа, фотографии, шрифта,
   иконки или кнопочного паттерна.

### Разработчику UI

1. `docs/product/05-MVP-RFC.md` для поведения.
2. `01-DESIGN-FOUNDATION.md` для границ подачи.
3. Нужный flow из `02`.
4. Существующие primitives из `03`.
5. Текущий статус из `04`.

### Агенту

Для любой UI-задачи обязательны `00`, `01`, `02`, `03`, `04` вместе с базовым пакетом из `docs/product/00-PROJECT-INDEX.md`. Для чистого документирования handoff дополнительно читать `05`. Для Pen-прототипирования дополнительно читать `../../design/pen/README.md` и использовать соответствующий prompt из `01-SCREEN-PROMPTS.md`.

## Связь с продуктом

- ценность и границы продукта: `../product/01-PRODUCT-FOUNDATION.md`;
- точное MVP-поведение: `../product/05-MVP-RFC.md`;
- развитие после MVP: `../product/06-ROADMAP-24-MONTHS.md`;
- seller/item policy: `../product/08-SELLER-AND-ITEM-POLICY.md`;
- доверие и приватность: `../product/09-TRUST-AND-AUCTION-INTEGRITY.md`;
- фактический статус: `../product/11-PROJECT-STATUS.md`.

При конфликте макета или кода с продуктовым owner-документом действует продуктовый документ. Flow нельзя молча менять через дизайн.

## Связь с кодом

- routes: `apps/mobile/src/app`;
- screens/features: `apps/mobile/src/features`;
- shared UI: `apps/mobile/src/components`;
- mobile final theme: `apps/mobile/src/providers/theme-provider.tsx`;
- общие tokens: `packages/design-tokens/src/modern.ts`;
- API data shapes: `packages/contracts`.

Наличие компонента в коде не означает наличия утверждённого дизайна. Наличие макета не означает реализованное поведение.

## Правила отсутствия дублирования

- Принцип описывается в `01`, flow — в `02`, reusable pattern — в `03`, текущая готовность — в `04`, handoff конкретной версии — в `05` или связанной задаче.
- В других файлах оставляется вывод и ссылка, а не копия owner-раздела.
- Product statuses (`Confirmed`, `Hypothesis`, `Planned`, `Rejected`) не смешиваются с design/code statuses.
- Ни Figma, ни Pen не являются владельцами бизнес-правил. Pen — только
  versioned visual-agreement layer; tokens и Expo-компоненты остаются source of
  truth для реализации.

## Обновление

- После изменения route, состояния или перехода обновить `02` и `04`.
- После изменения shared component/token обновить `03` и `04`.
- После design QA обновить `04` и handoff-запись.
- Новую ссылку на Figma добавлять только после фактического получения.
- После Pen-итерации коммитить `.pen` source, approved exports и handoff;
  не считать canvas реализацией или утверждением product flow.
- Не назначать цвета, шрифты, motion или брендовые assets как утверждённые без решения дизайнера/основателя.
- `01-DESIGN-FOUNDATION.md` защищён и меняется только по прямому решению основателя или назначенного дизайнера.
