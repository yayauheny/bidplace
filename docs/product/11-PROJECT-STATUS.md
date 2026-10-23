# bidplace — текущий статус проекта

Срез документации: 2026-10-23, база `872f22fc`. Portfolio-only контракт:
[05-MVP-RFC](05-MVP-RFC.md). Открытая работа — [active backlog](16-PORTFOLIO-ACTIVE-BACKLOG.md),
релизные gates и последние результаты — [release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
Здесь только текущая сводка; старые checkpoints не являются новым green.

| Область | Статус и основание |
| --- | --- |
| Portfolio discovery, author/Work lifecycle и moderation | Implemented для проверенного локального среза: `portfolio`, `products`, `sellers`, `admin-moderation` в `apps/api/src`; revision/public guards и HTTP/media tests. Live acceptance остаётся отдельной. |
| Auth и согласие | Partial (PR #58 синхронизируется и проверяется): серверные сессии, email-code/OIDC и proof до создания пользователя добавлены локально; полная CI-приёмка текущего merge ещё не завершена. Сохранены: одно явное подтверждение (DEC-124/125), атомарный User+evidence, lazy legal GET не блокирует регистрацию; [приёмка](../audits/2026-10-20-REGISTRATION-DOCUMENT-ACCESS.md). Это не юридическая готовность пакета. |
| Author Story / каталоги / история Work | Implemented для проверенного client/API cutover: `use-product-story-editor.ts` вызывает `api.products.replaceCreation`, `ProductsController` → `ProductsService.replaceCreationStory`, revision-owned blocks; [UI completion](../audits/current/2026-10-21-UI-COMPLETION.md), [review](../audits/current/2026-10-21-INDEPENDENT-UI-REVIEW.md). Архивное «B6 не начат» — исторический checkpoint. |
| Responsive UI, account/settings, author/header/footer | Partial: реализация и browser evidence есть; настройки имеют исключённое смещение заголовка, физические устройства/zoom и точный desktop parity не закрыты. [Design status](../design/04-DESIGN-STATUS.md). |
| Фото Work и автора (DEC-131/132) | Partial: `ImageProcessor`/Sharp и пофайловый upload объединены с release wizard; local verify/media E2E прошли. Live R2/CDN, устройства и Figma новых статусов — Needs verification. |
| Удаление своей Work (DEC-123) | Not implemented: в `ProductsController` нет DELETE Work, в `Product` нет tombstone. Hide/unhide не удаляет работу. [Backlog и незакрытый backend/security-план](16-PORTFOLIO-ACTIVE-BACKLOG.md). |
| Legal / операции / live abuse protection | Partial / Needs verification: [legal owner](../legal/00-FINAL-LEGAL-AUDIT.md), [operations](../ops/00-RELEASE-AND-BACKUP.md), [release gates](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md). Локальные tests не доказывают SMTP delivery, production Turnstile или CDN purge. |
| Commerce, избранное/подписки, смена email/password из settings | Not implemented в launch scope / post-MVP; [следующая волна](15-POST-MVP-BACKLOG.md). Старый commerce runtime не разрешает включать продажи. |

## 2026-10-23 — Оптимизация документации

**Implemented (docs only).** Сокращены `AGENTS.md`, карта чтения и product index;
текущие design/project/release сводки отделены от полных исторических журналов.
Убраны устаревшие execution-промпты с восстановлением из Git; DEC, security,
legal, raw research и evidence сохранены. Изменений API/UI/БД/deploy нет.
Измерения, список удалений и проверки — [cleanup report](../CLEANUP-REPORT.md).

## 2026-10-23 — Фото в объединённом MVP

**Partial (local verification passed).** SOURCE — приватный нормализованный
мастер до 5 МиБ (портрет до 2 МиБ); галерея принимает до 25 МиБ/8192 px/50M,
мастер до 4096 px; JPEG/PNG/WebP, EXIF-поворот, compact 16-bit PNG,
удаление metadata из публичных производных. Сохраняются partial success,
abort/timeout/idempotency и совместимость p1/p2.

До выпуска API обязательны миграции `20261022120000_normalized_media_source`
и `20261022180000_legacy_image_upload_identity`. Production migrations/deploy
не выполнены этим проходом. Результаты объединённого дерева: `pnpm verify`
(479 API unit, 1023 mobile, 159 integration, 28 прежних skips, web/iOS/Android
exports), 6 media E2E Chromium/WebKit и production web build прошли по записи
PR #59. CI точного merge SHA в этой документационной задаче не перепроверялся.

## История и обновление

- [Полный журнал 20–23 октября](../archive/product/11-PROJECT-STATUS-2026-10-20-23.md).
- [Журнал до 19 октября](../archive/product/11-PROJECT-STATUS-historical.md).

После изменения поведения обновить нужную строку и добавить одну короткую запись
со статусом, owner-модулями и фактически выполненными проверками. Детали приёмки
оставлять по ссылке в owner audit; не копировать его целиком сюда.


## 2026-10-23 — PR #58: auth + фото на актуальной MVP

**Partial (local verification passed; production gates remain).** База `7d0dc179`
объединена с auth `2e6fc2d1` в `feature/web-auth`. Сохранены SessionService,
EmailProofService/AuthAbuseService, normalized SOURCE/ImageProcessor, upload API
и новые auth/media migrations. Upgrade с MVP проверен с сохранением пользователя
и SOURCE; существующие security/media owners прошли полный `pnpm verify`; 32/32
Chromium/WebKit auth/media browser checks прошли. E2E API-транспорт получил
обязательные Origin/CSRF headers без изменения assertions/timeouts.
CI startup Expo воспроизвёл ошибку React Native из-за `NODE_ENV=test`:
только dev server получает development-окружение; workflow очищает группы
Expo/Vitest/Playwright при завершении и показывает Expo log при сбое.
Auth DEC-133–135 не перекрывают фото DEC-131/132. DEC-136 фиксирует синхронный
SMTP и открытый request timing; verify оценивается отдельно.

[Проверки, измерения, причины выбора SMTP и оставшиеся gates](../audits/current/2026-10-23-PR58-MERGE-VERIFICATION.md).
Ready — только после полного зелёного CI итогового SHA; merge/deploy не выполняются.
