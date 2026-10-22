# Оптимизация документации — 2026-10-23

База: `origin/feature/portfolio-mvp-release` @ `872f22fc`. Ветка: `fix/docs-context`.
PR #57 повторно не переносился. Scope: только Markdown/текстовые инструкции;
production/API/UI/миграции/deploy config и зависимости не менялись.

## Что изменено

- `AGENTS.md` хранит правила, `AGENT-MAP` выбирает owner по задаче; product index
  больше не требует roadmap/security/историю для нерелевантной работы.
- Project/design/release status показывают текущий срез и открытые gates.
  Полные три журнала сохранены в архиве, включая rationale/исторические ограничения.
- Active backlog явно сохраняет Not implemented удаления Work по DEC-123 и
  незакрытый transaction/moderation/security/HTTP план. Author Story/client cutover
  больше не помечен «B6 не начат»; stale architecture warning и старый draft вопрос
  сверены с `use-product-story-editor`, `ProductsController`, `SellersService.create`.
- Release summary учитывает поздние revisions: DEC-096 Search restore, DEC-105
  fullscreen/User.slug, DEC-109 abuse ledger, DEC-114–116 city/catalogs/story,
  DEC-123 delete, DEC-125 consent, DEC-131/132 normalized media. DEC-101 отменяет
  жёсткий five-minute deadline; deletion/purge/retry/recovery и live gates сохранены.
- Старые исторические ссылки ведут на точный Git blob; текущие entrypoints ведут
  в active backlog, не в готовые промпты прошлых волн.

## Измерение контекста

UTF-8 bytes и строки измерены по tracked `872f22fc` и финальным файлам.
Это размер текста, не точный tokenizer/API bill. Архив не входит в routine reads.

| Набор | Строки до → после | Bytes до → после | Сокращение bytes |
| --- | --- | --- | --- |
| AGENTS + map (обычный вход) | 233 → 89 | 14,286 → 11,167 | 21.8% |
| Вход + product index | 535 → 146 | 33,532 → 16,666 | 50.3% |
| Три текущих status/audit файла | 3852 → 156 | 304,514 → 19,201 | 93.7% |

Docs Markdown (включая сохранённую историю): 181 → 178 файлов; 3,716,788 → 3,681,789 bytes.
Всё tracked-дерево docs: 297 → 293 файлов; 12,921,136 → 12,885,174 bytes.
Архивирование уменьшает routine context, а не физический размер истории.
Git history/clone size этой очисткой не уменьшаются.

## Удалённые файлы и восстановление

Все восемь файлов доступны по базовому SHA; отдельный новый тег не нужен.
Восстановление одного файла: `git restore --source=872f22fc -- <path>`.
Это таблица удалений, а не сертификат завершения старых F01–F15 scopes.

| Удалённый файл | Причина | Источник восстановления |
| --- | --- | --- |
| `docs/archive/tasks/2026-09-08-first-mvp/00-EXECUTION-ORDER.md` | Устаревший порядок восьми пакетов и команды интеграции в main; текущая очередь и workflow в active backlog / AGENTS. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/archive/tasks/2026-09-08-first-mvp/00-EXECUTION-ORDER.md) |
| `docs/archive/tasks/2026-09-08-first-mvp/01-COMMERCE-CAPABILITY-GATE.md` | Первичная инструкция capability gate выполнена; актуальная portfolio-only граница в RFC/architecture, повторное включение commerce не разрешено. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/archive/tasks/2026-09-08-first-mvp/01-COMMERCE-CAPABILITY-GATE.md) |
| `docs/archive/tasks/2026-09-08-first-mvp/02-PORTFOLIO-WORK-LIFECYCLE.md` | Первичный implementation prompt superseded реализованными revision guards; отдельный WORK-LIFECYCLE-TECHNICAL-CONTRACT сохранён. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/archive/tasks/2026-09-08-first-mvp/02-PORTFOLIO-WORK-LIFECYCLE.md) |
| `docs/archive/tasks/2026-09-08-first-mvp/03-OBJECT-STORAGE-MEDIA.md` | Первичный S3 implementation prompt superseded media lifecycle и DEC-131/132; live/restore gates сохранены у ops/release owners. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/archive/tasks/2026-09-08-first-mvp/03-OBJECT-STORAGE-MEDIA.md) |
| `docs/archive/tasks/2026-09-08-first-mvp/05-PORTFOLIO-CONTRACTS-AND-API.md` | Первичный contracts/API prompt superseded RFC, текущими контрактами и client cutover; не объявляет весь MVP завершённым. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/archive/tasks/2026-09-08-first-mvp/05-PORTFOLIO-CONTRACTS-AND-API.md) |
| `docs/archive/tasks/2026-09-08-first-mvp/07-FIGMA-STACK-AND-UI.md` | Широкий старый Figma/stack/UI prompt superseded live-source workflow и экранными audits; native/desktop gaps сохранены в design status. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/archive/tasks/2026-09-08-first-mvp/07-FIGMA-STACK-AND-UI.md) |
| `docs/archive/tasks/2026-09-08-first-mvp/10-EXECUTION-STATE.md` | Застывший checkpoint b3ff19e с опасным для текущей задачи next action/merge в main; история восстанавливается по SHA. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/archive/tasks/2026-09-08-first-mvp/10-EXECUTION-STATE.md) |
| `docs/CLEANUP-METRICS.txt` | Устаревшие phase1/2 метрики не описывают текущий release; новые воспроизводимые измерения находятся в CLEANUP-REPORT. | [872f22fc](https://github.com/yayauheny/bidplace/blob/872f22fc/docs/CLEANUP-METRICS.txt) |

Сохранены: технический Work lifecycle contract, security/data preflight, legal
handoff, public-pilot review и external blockers, account delete plan и deferred
commerce/research tasks. Их открытые требования не удалялись под видом completed.

## Полные журналы

| Прежний owner | Полная история |
| --- | --- |
| `docs/design/04-DESIGN-STATUS.md` | [04-DESIGN-STATUS-through-2026-10-23.md](archive/design/04-DESIGN-STATUS-through-2026-10-23.md) |
| `docs/product/11-PROJECT-STATUS.md` | [11-PROJECT-STATUS-2026-10-20-23.md](archive/product/11-PROJECT-STATUS-2026-10-20-23.md) |
| `docs/audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md` | [12-PORTFOLIO-MVP-RELEASE-through-2026-10-07.md](archive/audits/12-PORTFOLIO-MVP-RELEASE-through-2026-10-07.md) |

Менялись только относительные Markdown-ссылки и явная историческая маркировка;
остальной текст журналов сравнен с базой. Текущие ограничения (iOS/Android,
Safe Area, live Turnstile/R2/CDN, zoom/text enlargement, desktop NEEDS-FIGMA,
settings geometry, optional integration skips) остались видимыми в сводках.

## Правка после review PR #60

Исходная очередь `06-NEXT-REVIEWS.md` из `872f22fc` сохранена целиком в
[архиве](archive/audits/06-NEXT-REVIEWS-before-2026-10-23.md), включая query/cache,
frontend dependencies, backend boundaries и их acceptance criteria. В короткой
навигации добавлена одна ссылка; статус этих направлений не переопределён.

## Проверки и границы доказательства

- `pnpm docs:link-check` — pass (181 Markdown-файл, включая архивы и entrypoints).
- `git diff --check` — pass; changed paths ограничены `docs/**` и `AGENTS.md`.
- `12-DECISION-LOG.md` целиком byte-identical относительно `872f22fc`: **132 уникальных
  DEC-001…132** (в приложенном задании указано131), включая все поздние revisions,
  rationale, alternatives, Revises/Supersedes и DEC-131/132. Сокращения DEC не было.
- 165 protected/legal/raw/evidence/security/RFC файлов byte-identical; никаких
  screenshots/videos не удалено. Старое удаление PNG остаётся отдельным
  [recovery record](archive/AUDIT-EVIDENCE-RECOVERY.md).
- Три полных журнала сравнены с исходниками после нормализации relocation links
  и исторической маркировки; содержательных потерь нет. Новый runtime не заявлен.
- RFC/architecture сверены для описанного среза; продуктовых решений не добавлялось.
  Maintenance: один текущий owner на claim, история по запросу, без новых скриптов
  или зависимостей. При новых изменениях обновлять строку и ссылку на evidence,
  не накапливать копии audit logs в entrypoints.
- Runtime typecheck/lint/tests/build, CI/live проверки не повторялись: runtime
  не менялся. Link checker прошёл на Node24.17.0/pnpm11.7.0 с engine warning
  (проект требует Node22); checker использует Node built-ins.
- Обновление codebase-memory остановлено по просьбе пользователя после ошибки
  daemon coordination; актуализация индекса не заявляется.
