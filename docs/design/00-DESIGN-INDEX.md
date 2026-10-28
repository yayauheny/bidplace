# bidplace — индекс дизайн-документации

Последнее обновление: 2026-10-07

Статус: **Confirmed documentation baseline**

## Назначение

Этот раздел — единая документационная точка входа для UI bidplace. First MVP
переведён на portfolio-first product contract. Production visual source for
mobile-web 390 is the live Figma file `pAPQo6cADmG5XzVmBX76EE` (`DEC-119`). Native iOS
and Android and 1024/1440 compositions are outside the current UI claim.

Старая Modern UI design system удалена. Её документы, внешние референсы и
cutover-план больше не являются источниками решений. Текущий production UI —
только исходное состояние для рефакторинга, а не визуальный эталон.

## Иерархия источников

При конфликте использовать такой порядок:

1. Product behavior, privacy and permissions — owner-документы в `../product/` и
   server contracts.
2. Для portfolio-first target — live Figma `pAPQo6cADmG5XzVmBX76EE`.
3. Этот design-модуль — screen/behavior/state mapping.
4. Production-код — фактическое исходное состояние, а не новый visual target.

Live Figma описывает композицию и component anatomy. Ни один визуальный источник
не создаёт routes, API, поля, permissions или product rules. Foundation/Gamma/Avant Arte не переопределяют Figma и не переносят в bidplace
wallet/NFT/crypto semantics; их разрешённая роль закреплена в `DEC-064`.

### Scoped auth source — 2026-10-07

Для следующей auth UI-волны актуален founder-provided пакет
[`auth/2026-10-07-auth-dialogs`](../../design/figma-handoff/auth/2026-10-07-auth-dialogs/README.md)
(`DEC-105`). Он переопределяет только перечисленные там auth/exit nodes из
`portfolio-phone-v1`, включая радиус шторок `32` вместо `20`. Исходная
библиотека остаётся read-only, остальные её экраны не переопределяются.
Общие состояния полей принадлежат
[`fields/2026-10-06-text-fields`](../../design/figma-handoff/fields/2026-10-06-text-fields/README.md).
Общая матрица текстовых кнопок (`292:5058`) —
[`buttons/2026-10-10-buttons`](../../design/figma-handoff/buttons/2026-10-10-buttons/README.md)
(`DEC-110`); заменяет auth/Home special button parameters в runtime.
Chrome поиска (`456:8298`) —
[`search/2026-10-10-search-popup`](../../design/figma-handoff/search/2026-10-10-search-popup/README.md).
Его градиент `#D1D1D1 → #EBEBEB` заменяет только stroke этого popup; остальные
glass-компоненты сохраняют свои материалы.
Node map, style measurements, source discrepancies и execution handoff находятся
в новом пакете. Статус — импорт/план, не runtime parity. Эти архивы имеют приоритет
в своей зафиксированной волне; отличающиеся live Inspect значения не смешиваются
с ними. Missing ranges/assets и производные recovery/desktop states явно отмечены.

## Структура

| Документ                                        | Владеет                                           |
| ----------------------------------------------- | ------------------------------------------------- |
| `00-DESIGN-INDEX.md`                            | источники, правила чтения и границы design-модуля |
| `01-DESIGN-FOUNDATION.md`                       | защищённые визуальные принципы                    |
| `02-USER-FLOWS-AND-SCREENS.md`                  | routes, роли, состояния и карта экранов           |
| `03-DESIGN-SYSTEM.md`                           | tokens, components, motion и responsive rules     |
| `04-DESIGN-STATUS.md`                           | фактическая готовность дизайна и реализации       |
| `05-DESIGN-HANDOFF.md`                          | обязательный процесс Figma → code → QA            |
| `06-ASSET-INVENTORY.md`                         | разрешённые assets, fonts, icons и ограничения    |
| `07-PEN-V2-UI-AUDIT-AND-IMPLEMENTATION-PLAN.md` | исторический Pen-аудит (не текущий visual source)    |
| `08-IMPLEMENTATION-LOG.md`                      | исторический Pen-журнал (не очередь задач)       |

Live Figma `pAPQo6cADmG5XzVmBX76EE` — единственный visual source для текущего production UI.
Текущие blockers: [`../launch/README.md`](../launch/README.md)
и [`../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md`](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
Срез `../audits/00-CURRENT-MVP-READINESS.md` — сентябрь 2026, не очередь работ.

## Обязательное чтение

Перед UI-задачей в `apps/mobile`:

1. skill `bidplace-ui` и [`../AGENT-MAP.md`](../AGENT-MAP.md);
2. `03-DESIGN-SYSTEM.md` и нужный поток из `02`;
3. live Figma для затронутого экрана;
4. фактические routes, contracts, components и tests в коде.

`04-DESIGN-STATUS.md` открывать поиском по экрану. `00`–`01` и `05`–`06` — когда
задача про карту документов, принципы, handoff или assets.

## Что не является источником дизайна

- удалённый `docs/modern-ui/`;
- runtime `designTokens` и существующие компоненты сами по себе;
- исторические screenshots, prompts и audit snapshots;
- внешние сайты и изображения вне approved registry в `06`/`DEC-064`.

Исторические ссылки в замороженных audit-документах описывают прошлое и не
возвращают удалённым материалам канонический статус.
