# W0 — Фото и история, основная ветка, чистка

## 0. Шапка

- Статус: не начато. Зависит от: —. Факты проверены на `6720b7af`
  (`feature/photo-workflow`).
- Ветка: `fix/photo-story-hardening` от `feature/photo-workflow`.
- Источник: план Fable 2026-10-28 + независимая проверка (четыре поправки ниже
  уже внесены).

## 1. Зачем

Загрузка фото в историю и галерею идёт двумя разными путями с разными лимитами;
сервер оставляет неиспользованные «холды» фото истории; клиент удаляет их сам
после сохранения; ввод текста блокируется во время загрузки. Последние восемь
коммитов правят вёрстку редактора истории в одних и тех же файлах. После волны:
один путь подготовки фото, один набор серверных лимитов, сервер — владелец
холдов, редактор истории на токенах. Затем — одна основная ветка `main`.

## 2. Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace. Создай ветку fix/photo-story-hardening
от feature/photo-workflow. Прочитай AGENTS.md, docs/launch/AGENT-RULES.md и целиком
docs/launch/waves/W0-photo-and-trunk.md — это ТЗ. Выполни пакеты строго по порядку
B1 → B2 → F1 → F2 → T1 → R1 → D1, один коммит на пакет. Перед каждым пакетом
перепроверь факты §5. Ничего сверх пакетов. Критерии приёмки обязательны; если
недостижим — остановись и опиши. Финальный отчёт по AGENT-RULES §5.
```

## 3. Решения (не перерешивать)

| Тема | Решение |
| --- | --- |
| Подготовка на клиенте | Галерея и история идут через `lib/media/prepare-image-upload.ts`. Других путей ресайза нет. Аватар остаётся на своих опциях (`profilePhotoOptions`, 1600 px / 2 MiB). |
| Выход клиента | `maxDimension 3840`, `maxBytes 10 MiB`, `maxSourceBytes 25 MiB`, `quality 0.85`, PNG остаётся PNG. Одинаково для галереи и истории. |
| Вход сервера | История: файл ≤ 10 MiB, сторона ≤ 8192, пикселей ≤ 50 331 648 — через тот же `process()`, что галерея. Вход галереи остаётся 25 MiB (`workImageMaxInputBytes`). Хранимый мастер — 5 MiB для обоих, как сейчас. |
| Бюджет истории | `STORY_LIMITS.maxStoryImageBytes` (20 MiB) и проверка удаляются. |
| Лимиты истории | 5 фото, 20 текстовых блоков, длины — без изменений (`DEC-116`). |
| Галерея | Константа `WORK_PHOTO_LIMITS.maxPhotos = 10` в `packages/contracts`; литералы заменить. |
| Холды | Владелец — сервер: `replaceProductStory` снимает неиспользованные холды `STORY_IMAGE` в той же транзакции. Клиент не вызывает `removeStoryImage` после сохранения. |
| SHA-256 на клиенте | Удаляется. Это была только подсказка «фото уже добавлено»; идемпотентность сервера на нём не держится (`images.service.ts` ~378–408 использует `sha256(productId:idempotencyKey)` и контрольную сумму загруженных байтов). |
| Старые черновики v1 | Удаляются: ветка не развёрнута, прод пуст. |
| Ретраи медиа | Потолок 20 попыток. `nextAttemptAt` обязательное поле — не обнулять; исключить из `tick` по `attemptCount`, в `fail` не перепланировать. Без миграции. |
| Будущее | Новые потребители фото добавляют значение `MediaPurpose` и ссылаются на `MediaAsset.id`; новых путей подготовки и таблиц размеров не создают. |

## 4. Скоуп

Входит: пакеты ниже. Не входит: повторное использование байтов галерея ↔ история
(`DEC-112`), CDN вместо прокси для фото истории, нативная проверка, zoom 200 %,
паритет 1024/1440, механизм `gcTime: Infinity` у photo-session, перенос `tick` на
Cron (это W2), объединение `ImagesService` и `MediaLifecycleService` (не делать:
HTTP attach/remove остаётся в `ImagesService`, байты/stage/cleanup — в
`MediaLifecycleService`).

## 5. Факты из кода

- `apps/api/src/images/images.service.ts`: `addStoryImage` ~1194–1248 сначала
  `media.stage`, потом проверяет `holds >= 5` (~1217–1239) — неверный порядок;
  `removeStoryImage` ~1250–1293; заголовок idempotency ~1204 допускает 100
  символов, а `packages/contracts/src/story.ts` ~49 — 80.
- `apps/api/src/core/media/media-pipeline.ts` ~30–44 и `image-upload-policy.ts`:
  история — 5 MiB / 4096 px / 16 Мп; работа — 25 MiB / 8192 px / 50 331 648 px.
- `packages/contracts/src/story.ts`: `STORY_LIMITS` 5 фото / 20 блоков /
  5 MiB / 20 MiB сумма; сумма проверяется в `apps/api/src/products/product-story.ts` ~175–201.
- `packages/contracts/src/product.ts` ~52, ~122: литерал `10`.
- `apps/mobile/src/features/sellers/product-draft-image-actions.ts`: история берёт
  сырой blob (~1141–1167); галерея — `preparePhotoEdit` + SHA-256 и «Фото уже
  добавлено» (~732–759).
- `apps/mobile/src/features/sellers/use-product-story-editor.ts`: `editAlt` не
  обрезает пробелы (~743); `addImage` пишет «5 МиБ» (~784–787); `save` вызывает
  `removeStoryImage` в проглатывающем `catch` (~884–918); `restoreLegacy`,
  `storyDraftLegacyKey`, `v: z.literal(2).optional()` (~51–52, ~428–474, ~532).
- `apps/mobile/src/features/sellers/product-draft-screen.tsx` ~557 и
  `product-draft-story.tsx` ~158: `savePending = storyEditor.pending` блокирует ввод.
- `product-draft-story.tsx` (459 строк, 17 inline `style={{`) и
  `product-block-actions.tsx` (367, свой SVG-меню) — менялись восемью коммитами
  `6d51920d…6720b7af`.
- `apps/api/src/core/media/media-lifecycle.service.ts`: `fail` ~777–791
  перепланирует на +15 с; `tick` ~150–161 берёт FAILED с `nextAttemptAt <= now`,
  по 8; потолка попыток нет. `nextAttemptAt` в схеме обязательный (~882).

## 6. Бэкенд

### B1 — Холды, лимиты, литералы (`apps/api`, `packages/contracts`)

Переиспользовать: блокировку продукта `FOR UPDATE` в транзакции сохранения
истории (`products.service.ts` ~727 вызывает `replaceProductStory`),
`media.enqueueCleanup(tx, ids)`, существующий `process()` пайплайна.
Создавать: только константу `WORK_PHOTO_LIMITS` в `packages/contracts/src/product.ts`.

1. `replaceProductStory`: после записи блоков в той же транзакции найти холды
   ревизии с `mediaAsset.purpose = 'STORY_IMAGE'`, на которые не ссылается ни один
   блок этой ревизии → `deleteMany` + `enqueueCleanup`. Холды других назначений и
   других ревизий не трогать.
2. Удалить сумму `maxStoryImageBytes` и константу. Проверки ассета (существует,
   владелец, READY, из галереи ревизии или холд ревизии) оставить.
3. `addStoryImage`: дешёвый `count` до `media.stage` (409, тот же текст) +
   проверка под блокировкой; лимит из `STORY_LIMITS.maxImages`.
4. История в `process()` использует бюджеты работы (байты/пиксели входа).
   Multer `/story-images` = `STORY_LIMITS.maxFileBytes` (10 MiB). Цель
   `optimizeSource` для истории — та же, что у галереи.
5. `WORK_PHOTO_LIMITS = { maxPhotos: 10 } as const`; два `.max(10)` и `maxFiles`
   читают её.
6. Idempotency: один regex `^[a-zA-Z0-9:_-]{1,100}$` для заголовка и тела.

Приёмка:
- интеграция `author-story-catalog.integration.spec.ts`: история из 5 холдов, в
  блоках 3 фото → после PUT 3 холда, 2 операции CLEANUP, после тика ассеты
  `FAILED`, объекты `DELETED`; повторный PUT без одного фото → 2 холда; ассет
  галереи в блоке никогда не теряет холд и не попадает в cleanup;
- шестая загрузка отклоняется до `media.stage` (spy не вызван) и под блокировкой;
- JPEG 4032×3024 ≤ 10 MiB принят для истории; 10 MiB + 1 байт → 413/400 на
  multer; сторона 8193 → тот же текст ошибки, что у галереи;
- `rg "holds >= 5|\.max\(10\)|maxStoryImageBytes" apps packages` → пусто;
- `product-write-atomicity.integration.spec.ts` ~412 (`{intro, steps}`)
  переписан на блоки или удалён как дубль.

### B2 — Потолок ретраев (`media-lifecycle.service.ts`)

1. `tick` не берёт операции с `attemptCount >= 20`.
2. `fail` при достижении потолка ставит `FAILED` без перепланирования и пишет
   один warn с id и видом операции (без ключей объектов и URL).

Приёмка: `media-lifecycle.recovery.spec.ts` — операция, упавшая 20 раз, не берётся
на 21-м тике; соседняя выполняется; warn ровно один. Лимит 8 за тик и таймер
не меняются. Без миграции.

## 7. Фронтенд (`apps/mobile`)

### F1 — Один путь подготовки, исправление загрузки истории

Переиспользовать: `prepareImageUpload` из `src/lib/media/prepare-image-upload.ts`,
`preparePhotoEdit` из `src/lib/media/photo-edit.ts` (кадрирование остаётся там).
Создавать: только экспорт `WORK_PHOTO_PREPARE` рядом с `prepareImageUpload`.

1. `chooseStoryImage`: ассет пикера → `prepareImageUpload(asset,
   WORK_PHOTO_PREPARE)`, отправлять `.blob`; `blob:` URI пикера освобождать в
   `finally`.
2. Галерея: после `preparePhotoEdit` — `prepareImageUpload` с теми же опциями
   (неотредактированные оригиналы больше не уходят сырыми). Удалить SHA-256
   (`addSelection` ~732–748), `sourceChecksum`, ветку «Фото уже добавлено»,
   импорт `expo-crypto`, если он больше нигде не нужен.
3. `use-product-story-editor.ts`: `editAlt` → `altText.trim() || null`;
   сообщение «не больше 10 МиБ» из `STORY_LIMITS.maxFileBytes`; удалить цикл
   `removedAssets` и refs `persistedAssets`/`uploaded`, если других читателей нет.
4. Ввод текста не блокируется во время загрузки фото: хук отдаёт `saving` и
   `uploading` (или `pending` + `uploading`, третьего флага нет); текстовые поля
   выключаются только при `!editable || saving`; тулбар и «добавить» — при любом.

Приёмка:
- юнит (`product-draft-submit-lifecycle.spec.ts`): JPEG 6000×4000 9 MB для
  истории → `addStoryImage` получает blob ≤ 10 MiB, `prepareImageUpload` вызван с
  `WORK_PHOTO_PREPARE`; галерея — тело ≤ 10 MiB; PNG остаётся `image/png`;
- `rg "digest\(|CryptoDigestAlgorithm|sourceChecksum|Фото уже добавлено" apps/mobile` → пусто
  (включая `e2e/work-media-lifecycle.spec.ts` ~1166 и ~1564 — эти проверки
  удалить или заменить);
- `rg "removeStoryImage" apps/mobile/src` → пусто; метод в
  `packages/api-client/src/images.ts` удалить, если других потребителей нет;
- alt `"   "` → `altText: null`, сохранение успешно;
- e2e: пока POST фото истории задержан, ввод в абзац сохраняет фокус и текст.

### F2 — Упрощение и редактор истории на токенах

Переиспользовать: токены `packages/design-tokens`, существующие примитивы
`src/components/ui` (кнопки, меню/листы), `StyleSheet.create`.
Создавать: `src/features/sellers/story-local-draft.ts` — чистые функции
черновика истории (перенос, не новый код).

1. Удалить старую сетку загрузки в `product-draft-images.tsx` (~581–736, ветка
   без `photoCards`), сделать `photoCards` обязательным, удалить
   `uploadFiles`/`UploadImageState`/статус `'queued'`, если других читателей нет.
2. Переименовать проп `sessionEpoch` → `authEpoch` в `ProductDraftStoryStep`,
   `ProductDraftReviewStep`, `PrivateStoryImage`.
3. Чистые функции черновика (`storyDraftKey`, `storyDraftRecoveryKey`,
   `storedBlocksOf`, `draftTextOf`, `restoreV2`, `moveStoredDraft`, схема) — в
   `story-local-draft.ts`; удалить `restoreLegacy`, `storyDraftLegacyKey`, ветку
   миграции ключа; `v: z.literal(2)` без `optional`. Хук — только состояние и эффекты.
4. `product-block-actions.tsx`: вместо `presentation` + `menuVisible` +
   `triggerFrame` + `triggerStrokeWidthPx` — `variant: 'story' | 'tile'`;
   геометрия внутри компонента.
5. `product-draft-story.tsx`: все inline `style={{…}}` → `StyleSheet.create` с
   токенами; лимиты `canAddText`/`canAddImage` берутся из хука (один владелец),
   дубли подсчёта в шаге удалить. Визуально ничего не меняется.
6. Литерал `10` галереи → `WORK_PHOTO_LIMITS.maxPhotos` (пикер, `addSelection`, шаг).

Приёмка:
- чистый дифф F2 отрицательный (удалено больше, чем добавлено) — цифры в отчёте;
- `rg "'queued'|uploadFiles|sessionEpoch|restoreLegacy|storyDraftLegacyKey|presentation=|menuVisible|triggerFrame" apps/mobile/src` → пусто;
- `rg -c "style=\{\{" apps/mobile/src/features/sellers/product-draft-story.tsx` → 0;
- `use-product-story-editor.spec.ts`: legacy-случаи удалены, остальные проходят
  без правки утверждений;
- скриншоты редактора истории до/после на 390 px совпадают (e2e media-конфиг).

## 8. Тесты, основная ветка, документы

### T1 — Тесты

Добавить (в существующие спеки):

| Спек | Случай |
| --- | --- |
| `apps/api/test/integration/author-story-catalog.integration.spec.ts` | снятие холдов при PUT; ассет галереи не чистится; 5 × 9 MiB принимаются |
| `apps/api/src/images/images.service.spec.ts` | шестая загрузка до `stage`; лимит равен `STORY_LIMITS.maxImages` |
| `apps/api/test/integration/work-media-http.integration.spec.ts` | 10 MiB ок / 10 MiB+1 отказ; `DELETE` отсутствующего холда → 200 |
| `apps/api/src/core/media/media-pipeline.spec.ts` | история и работа делят входные бюджеты (параметризовать кейс 48 Мп: оба приняты) |
| `apps/api/src/core/media/media-lifecycle.recovery.spec.ts` | потолок ретраев |
| `apps/mobile/src/features/sellers/product-draft-submit-lifecycle.spec.ts` | prepare для галереи и истории; PNG; trim alt |
| `apps/mobile/src/features/sellers/use-product-story-editor.spec.ts` | нет `removeStoryImage` после сохранения; ввод при `uploading` |
| новый `apps/mobile/src/features/sellers/product-draft-story.spec.tsx` (один owner-спек) | первый символ в виртуальном блоке создаёт абзац и держит фокус; «добавить» выключено на лимитах; ввод включён при загрузке, тулбар выключен |
| `apps/mobile/e2e/work-media-lifecycle.spec.ts` (тест истории) | фокус переживает задержку загрузки |

Удалить / переписать:

| Спек | Действие |
| --- | --- |
| `author-story-catalog.integration.spec.ts` блок бюджета 20 MiB (~1069–1082, `byteLength: 4_194_305` × 5) | удалить только этот блок, не весь тест ~1031 |
| `media-pipeline.spec.ts` ~117 «48 Мп отклонено для STORY_IMAGE» | инвертировать/параметризовать |
| `media-pipeline.spec.ts` ~233 потолок 5 MiB истории | обновить до 10 MiB |
| `use-product-story-editor.spec.ts` legacy v1 и без revision | удалить |
| `product-draft-submit-lifecycle.spec.ts` случаи дубля по checksum | удалить |
| спеки старой сетки без `photoCards` | передать `photoCards` |
| хвост `e2e/work-media-lifecycle.spec.ts` с проверками геометрии, дублирующими скриншот | удалить, оставить один скриншот на состояние |

Не трогать (регрессионные ворота): save-race, route-guard, browser-sentinel,
local-draft-restore e2e, `product-story-revision.spec.ts`, publish/revoke CDN e2e,
удаление EXIF, magic-byte policy, admission cap, `media-lifecycle.integration.spec.ts`.

### R1 — Основная ветка `main` (готовит агент, выполняет основатель)

Факт: `feature/photo-workflow` = `feature/portfolio-mvp-release` + 21 коммит;
`origin/main` отстаёт на 860 коммитов и не является предком. Деплой и CI
привязаны к `feature/portfolio-mvp-release`: `.github/workflows/verify.yml` ~14,
`production-deploy.yml` ~41–44 и `WORKERS_CI_BRANCH` ~253.

Агент:
1. Проверяет, что уникальные коммиты `origin/main` (`git log feature/photo-workflow..origin/main`)
   уже по содержанию есть в ветке (workflow-файлы); перечисляет в отчёте.
2. Меняет в трёх местах workflow `feature/portfolio-mvp-release` → `main`.
3. Пишет в отчёт точные команды для основателя (не выполняет):

```bash
git switch main && git reset --hard fix/photo-story-hardening   # после ревью W0
git push --force-with-lease origin main
# GitHub → Settings → Default branch: main; Cloudflare Workers CI branch: main
git branch --merged main | grep -v '^\*\|main' | xargs git branch -d
git push origin --delete feature/portfolio-mvp-release            # после первого зелёного деплоя с main
```

Не удалять ветки с непомёрженными коммитами (`archive/commerce-v1` — справочник
для W3). Список удаляемых — в отчёт.

### D1 — Документы и проверки

1. `docs/product/12-DECISION-LOG.md`: одна запись «Story/Work photo limits
   unified» со следующим свободным номером, явно `Revises: DEC-116` (5 MiB → 10 MiB
   вход истории, бюджет 20 MiB удалён).
2. `11-PROJECT-STATUS.md`: одна датированная запись (фото — `Partial`: открыты
   DEC-112, CDN истории, native).
3. `10-CODE-ARCHITECTURE.md`: только изменённые инварианты лимитов и холдов.
4. `docs/design/04-DESIGN-STATUS.md`: редактор истории переведён на токены.

Обязательные проверки (фактический вывод в отчёт):

- `pnpm --filter @bidplace/contracts --filter @bidplace/api-client --filter @bidplace/api --filter @bidplace/mobile typecheck` и `lint` (без autofix);
- API unit + интеграция (`author-story-catalog`, `work-media-http`,
  `media-lifecycle`, `product-write-atomicity`, `upload-safety`) на `bidplace_e2e`;
- mobile unit полностью; e2e `playwright.media.config.ts` (истории) +
  `product-story-revision.spec.ts` + `local-draft-restore.spec.ts`, Chromium и WebKit;
- `pnpm --filter @bidplace/mobile build:web`; `git diff --check`; `pnpm docs:link-check`.

## 9. Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §6 и этот файл. Ревью ветки
fix/photo-story-hardening против feature/photo-workflow. Проверь сам каждый критерий
приёмки B1–D1 (команды rg, тесты). Вердикт по AGENT-RULES §6.
```

Инварианты:
- один путь подготовки фото на клиенте (поиск `canvas`, `ImageManipulator`,
  `manipulateAsync` вне `lib/media` → пусто);
- одна таблица входных лимитов на сервере; история и галерея идут через один `process()`;
- холды истории снимает только сервер и только в транзакции сохранения;
- `nextAttemptAt` не обнулялся, миграций нет;
- аватар не изменён.

Красные флаги: новый сервис или слой загрузки; объединение `ImagesService` и
`MediaLifecycleService`; ослабленные или удалённые тесты из списка «не трогать»;
`catch` без обработки; изменения вне `apps/api`, `apps/mobile`,
`packages/contracts`, `packages/api-client`, workflow и документов волны;
визуальная разница редактора истории.
