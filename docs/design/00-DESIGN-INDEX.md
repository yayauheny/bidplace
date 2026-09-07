# bidplace — индекс дизайн-документации

Последнее обновление: 2026-09-08

Статус: **Confirmed documentation baseline**

## Назначение

Этот раздел — единая документационная точка входа для UI bidplace. First MVP
переведён на portfolio-first product contract. Новый Figma-файл
`NM63j9lwRMqpo2HvAiYNll` является read-only target следующей реализации; текущий
Pen-based production и защищённый `.pen` сохраняются как historical runtime baseline
до формального cutover.

Старая Modern UI design system удалена. Её документы, внешние референсы и
cutover-план больше не являются источниками решений. Текущий production UI —
только исходное состояние для рефакторинга, а не визуальный эталон.

## Иерархия источников

При конфликте использовать такой порядок:

1. Product behavior, privacy and permissions — owner-документы в `../product/` и
   server contracts.
2. Для portfolio-first target — read-only Figma `NM63j9lwRMqpo2HvAiYNll` после
   versioned inspect/token/asset handoff.
3. Для текущего historical runtime — защищённый `../../design/pen/bidplace-web-v2.pen`.
4. Этот design-модуль — screen/behavior/state mapping.
5. Production-код — фактическое исходное состояние, а не новый visual target.

Для текущего historical runtime Pen описывает композицию и component anatomy. Для
portfolio target эту роль после versioned handoff выполняет read-only Figma. Ни один
визуальный источник не создаёт routes, API, поля, permissions или product rules.
Foundation/Gamma/Avant Arte не переопределяют Pen и не переносят в bidplace
wallet/NFT/crypto semantics; их разрешённая роль закреплена в `DEC-064`.

## Неприкосновенность Pen

`design/pen/bidplace-web-v2.pen` — канонический и защищённый дизайн-файл.

- Во время реализации, рефакторинга, тестирования и обновления документации
  его запрещено редактировать, удалять, переименовывать, перемещать,
  перезаписывать или автоматически форматировать.
- Разработчик читает Pen и адаптирует код под него; обратная синхронизация из
  кода в Pen запрещена.
- Изменение разрешено только в отдельно поставленной design-задаче с прямым
  указанием основателя или назначенного дизайнера.
- Даже design-задача не разрешает удаление файла. Новое направление создаётся
  как контролируемая версия с сохранением истории.
- Если Pen и продуктовый контракт конфликтуют, реализация останавливается на
  конфликтующей части и фиксирует требуемое решение; Pen не правится «для
  удобства кода».

## Структура

| Документ                                        | Владеет                                           |
| ----------------------------------------------- | ------------------------------------------------- |
| `00-DESIGN-INDEX.md`                            | источники, правила чтения и границы design-модуля |
| `01-DESIGN-FOUNDATION.md`                       | защищённые визуальные принципы                    |
| `02-USER-FLOWS-AND-SCREENS.md`                  | routes, роли, состояния и карта Pen screens       |
| `03-DESIGN-SYSTEM.md`                           | tokens, components, motion и responsive rules     |
| `04-DESIGN-STATUS.md`                           | фактическая готовность дизайна и реализации       |
| `05-DESIGN-HANDOFF.md`                          | обязательный процесс Pen → code → QA              |
| `06-ASSET-INVENTORY.md`                         | разрешённые assets, fonts, icons и ограничения    |
| `07-PEN-V2-UI-AUDIT-AND-IMPLEMENTATION-PLAN.md` | полный аудит, node registry и этапы реализации    |
| `08-IMPLEMENTATION-LOG.md`                      | этапы, commits, проверки и оставшийся scope       |

`bidplace-web-v2.pen` остаётся единственным каноном для текущего production UI.
Текущие blockers и порядок redesign находятся в
[`../audits/00-CURRENT-MVP-READINESS.md`](../audits/00-CURRENT-MVP-READINESS.md).

## Обязательное чтение

Перед любой UI-задачей:

1. прочитать product index, foundation и project status;
2. прочитать `00`–`04` этого раздела;
3. для portfolio target открыть `02`, `04`, `05`, `06` и versioned Figma handoff;
4. Pen README/nodes читать только при reconciliation текущего historical runtime;
5. проверить фактические routes, contracts, components и tests в коде;
6. для исторических задач направления creator-first — `design/creator-first/README.md` (V1) или `design/creator-first-v2/README.md` (V2 art-direction) и соответствующий `spec/`.

## Что не является источником дизайна

- удалённый `docs/modern-ui/`;
- старый `design/pen/bidplace-web.pen`;
- `design/pen/target-solution/bidplace-youthful.pen`;
- runtime `designTokens` и существующие компоненты сами по себе;
- исторические screenshots, prompts и audit snapshots;
- внешние сайты и изображения вне approved registry в `06`/`DEC-064`.

Исторические ссылки в замороженных audit-документах описывают прошлое и не
возвращают удалённым материалам канонический статус.
