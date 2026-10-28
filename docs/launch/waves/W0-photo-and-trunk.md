# W0 — Фото и история, основная ветка — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development`
> (рекомендуется) или `executing-plans`. Шаги — чекбоксы `- [ ]`. Общие правила —
> [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** один путь подготовки фото для галереи и истории, один набор серверных
лимитов, сервер — владелец холдов истории, редактор истории на токенах; затем
одна основная ветка `main`.

**Architecture:** клиент готовит любое фото работы через `prepareImageUpload` с
одним объектом опций; сервер пропускает фото истории через тот же `process()`,
что и галерею; неиспользованные холды истории снимаются в транзакции
сохранения истории под блокировкой работы. HTTP attach/remove остаются в
`ImagesService`, байты/stage/cleanup — в `MediaLifecycleService`.

**Spec:** решения этого файла (раздел Global Constraints) + `DEC-116` (лимиты
истории), `DEC-148` (photo workflow).

**Ветка:** `fix/photo-story-hardening` от `feature/photo-workflow`. Факты
проверены на `6720b7af`. Зависимости: нет.

## Global Constraints

- Клиент, галерея и история: `maxDimension 3840`, `maxBytes 10 MiB`,
  `maxSourceBytes 25 MiB`, `quality 0.85`, PNG остаётся PNG. Аватар не меняется
  (`profilePhotoOptions`, 1600 px / 2 MiB).
- Сервер, вход истории: ≤ 10 MiB, сторона ≤ 8192, пикселей ≤ 50 331 648. Вход
  галереи остаётся 25 MiB (`workImageMaxInputBytes`). Хранимый мастер — 5 MiB.
- `STORY_LIMITS`: 5 фото, 20 текстовых блоков, длины без изменений;
  `maxFileBytes = 10 MiB`; `maxStoryImageBytes` удалён.
- `WORK_PHOTO_LIMITS.maxPhotos = 10` в `packages/contracts`; литералов `10` нет.
- Idempotency-ключ заголовка и тела: `^[a-zA-Z0-9:_-]{1,100}$`.
- Ретраи медиа: потолок 20 попыток; `nextAttemptAt` не обнулять; без миграций.
- Клиентский SHA-256 и восстановление черновиков v1 удаляются (прод пуст).
- Не делать: повторное использование байтов галерея ↔ история (`DEC-112`), CDN
  для фото истории, нативную проверку, перенос `tick` на Cron (W2),
  объединение `ImagesService` и `MediaLifecycleService`.

## Review Focus

1. Автор удалил фото из истории и сохранил — объект в R2 должен уйти в cleanup,
   а фото галереи, вставленное в историю, — никогда. → Task 1, шаг 1.
2. Шестое фото истории при двух одновременных загрузках — второе отклоняется,
   даже если обе прошли предпроверку. → Task 1, шаг 4.
3. Фото 12 Мп с телефона (4032×3024, ~8 MB) в истории — принимается без ошибки
   «слишком большое». → Task 1, шаг 6; Task 3, шаг 1.
4. Автор печатает текст, пока фото истории ещё грузится — фокус и текст не
   пропадают. → Task 3, шаг 4.
5. Alt-текст из одних пробелов — сохраняется как пустой, сохранение не падает. → Task 3, шаг 3.

## Facts

- `apps/api/src/images/images.service.ts`: `addStoryImage` ~1194–1248 сначала
  `media.stage`, потом `holds >= 5` (~1217–1239); `removeStoryImage` ~1250–1293;
  idempotency заголовка ~1204 — 100 символов, тело (`packages/contracts/src/story.ts` ~49) — 80.
  Идемпотентность сервера: `sha256(productId:idempotencyKey)` + контрольная сумма
  загруженных байтов (~378–408) — клиентский хеш не нужен.
- `apps/api/src/core/media/media-pipeline.ts` ~30–44, `image-upload-policy.ts`:
  история 5 MiB / 4096 / 16 Мп; работа 25 MiB / 8192 / 50 331 648.
- `apps/api/src/products/product-story.ts` ~175–201 — сумма 20 MiB;
  `products.service.ts` ~727 вызывает `replaceProductStory` под `FOR UPDATE`.
- `packages/contracts/src/product.ts` ~52, ~122 — литерал `10`.
- `apps/api/src/core/media/media-lifecycle.service.ts`: `fail` ~777–791
  (+15 с), `tick` ~150–161 (FAILED и `nextAttemptAt <= now`, по 8), потолка нет;
  `nextAttemptAt` обязательный (`schema.prisma` ~882).
- `apps/mobile/src/features/sellers/product-draft-image-actions.ts`: история —
  сырой blob (~1141–1167); галерея — `preparePhotoEdit` + SHA-256 + «Фото уже
  добавлено» (~732–759).
- `apps/mobile/src/features/sellers/use-product-story-editor.ts`: `editAlt` ~743;
  «5 МиБ» ~784–787; `save` с `removeStoryImage` в проглатывающем `catch`
  ~884–918; `restoreLegacy`, `storyDraftLegacyKey`, `v: z.literal(2).optional()`
  ~51–52, ~428–474, ~532.
- `product-draft-screen.tsx` ~557 и `product-draft-story.tsx` ~158:
  `savePending = storyEditor.pending` блокирует ввод.
- `product-draft-story.tsx` (459 строк, 17 inline `style={{`),
  `product-block-actions.tsx` (367, свой SVG-меню) — восемь коммитов
  `6d51920d…6720b7af` правили только их.
- E2E `apps/mobile/e2e/work-media-lifecycle.spec.ts` ~1166 и ~1564 проверяют
  «Фото уже добавлено».
- Ветки: `feature/photo-workflow` = `feature/portfolio-mvp-release` + 21 коммит;
  `origin/main` на 860 коммитов позади и не предок. CI/деплой привязаны к
  `feature/portfolio-mvp-release`: `.github/workflows/verify.yml` ~14,
  `production-deploy.yml` ~41–44 и `WORKERS_CI_BRANCH` ~253.

## Бэкенд

### Task 1: Холды и лимиты истории на сервере

**Files:**
- Modify: `apps/api/src/products/product-story.ts`, `apps/api/src/images/images.service.ts`,
  `apps/api/src/images/image-upload-policy.ts`, `apps/api/src/core/media/media-pipeline.ts`,
  `packages/contracts/src/story.ts`, `packages/contracts/src/product.ts`
- Test: `apps/api/test/integration/author-story-catalog.integration.spec.ts`,
  `apps/api/src/images/images.service.spec.ts`,
  `apps/api/test/integration/work-media-http.integration.spec.ts`,
  `apps/api/src/core/media/media-pipeline.spec.ts`,
  `apps/api/test/integration/product-write-atomicity.integration.spec.ts`

**Reuse:** транзакция и `FOR UPDATE` сохранения истории; `media.enqueueCleanup(tx, ids)`;
существующий `process()`; `AppException`.

**Interfaces:**
- Produces: `WORK_PHOTO_LIMITS = { maxPhotos: 10 } as const` (`packages/contracts/src/product.ts`);
  `STORY_LIMITS.maxFileBytes = 10 * 1024 * 1024`; `STORY_LIMITS.maxStoryImageBytes` — удалён.

- [x] **Шаг 1: падающий тест снятия холдов.** В `author-story-catalog.integration.spec.ts`:
  история с 5 холдами, в блоках 3 фото → после PUT в БД 3 холда, 2 операции
  CLEANUP; после тика ассеты `FAILED`, объекты `DELETED`; повторный PUT без одного
  фото → 2 холда; ассет галереи в блоке сохраняет холд и не попадает в cleanup.
- [x] **Шаг 2:** прогнать — FAIL.
- [x] **Шаг 3:** в `replaceProductStory` после записи блоков в той же транзакции
  удалить холды ревизии с `purpose = 'STORY_IMAGE'` без ссылающегося блока и
  вызвать `enqueueCleanup`. Холды других назначений и ревизий не трогать.
- [x] **Шаг 4: падающий тест шестой загрузки.** `images.service.spec.ts`: при 5
  холдах `addStoryImage` отклоняет с 409 и `stage` spy не вызван; при гонке
  (предпроверка пропустила) отказ под блокировкой; лимит равен `STORY_LIMITS.maxImages`.
- [x] **Шаг 5:** дешёвый `count` до `media.stage` + проверка под блокировкой.
- [x] **Шаг 6: падающие тесты входа.** `work-media-http.integration.spec.ts`:
  10 MiB — 200, 10 MiB + 1 байт — 413/400 на multer, `DELETE` отсутствующего холда — 200.
  `media-pipeline.spec.ts`: кейс 48 Мп параметризовать — принят для `WORK_IMAGE`
  и `STORY_IMAGE`; потолок истории ~233 → 10 MiB; 4032×3024 принят; сторона 8193 —
  тот же текст ошибки, что у галереи.
- [x] **Шаг 7:** история в `process()` использует входные бюджеты работы; multer
  `/story-images` = `STORY_LIMITS.maxFileBytes`; цель `optimizeSource` для истории
  та же, что у галереи.
- [x] **Шаг 8:** удалить `maxStoryImageBytes` и проверку суммы; из
  `author-story-catalog` удалить только блок бюджета (~1069–1082, `byteLength: 4_194_305` × 5),
  не весь тест ~1031; добавить случай «5 × 9 MiB принимаются».
- [x] **Шаг 9:** `WORK_PHOTO_LIMITS` вместо двух `.max(10)` и `maxFiles`;
  единый regex idempotency.
- [x] **Шаг 10:** `product-write-atomicity.integration.spec.ts` ~412 (`{intro, steps}`)
  переписать на блоки или удалить, если дублирует `author-story-catalog`.
- [x] **Шаг 11:** прогнать спеки Task 1 — PASS;
  `rg "holds >= 5|\.max\(10\)|maxStoryImageBytes" apps packages` → пусто.
- [x] **Шаг 12:** коммит `fix: release unused story holds and unify photo limits`.

### Task 2: Потолок ретраев медиа

**Files:**
- Modify: `apps/api/src/core/media/media-lifecycle.service.ts`
- Test: `apps/api/src/core/media/media-lifecycle.recovery.spec.ts`

**Interfaces:**
- Produces: константа `MEDIA_OPERATION_MAX_ATTEMPTS = 20` рядом с `tick`.

- [x] **Шаг 1: падающий тест.** Операция, упавшая 20 раз, не берётся на 21-м
  тике; соседняя выполняется; warn с id и видом операции — ровно один раз; лимит
  8 за тик не меняется.
- [x] **Шаг 2:** прогнать — FAIL.
- [x] **Шаг 3:** `tick` исключает `attemptCount >= MEDIA_OPERATION_MAX_ATTEMPTS`;
  `fail` на потолке ставит `FAILED` без перепланирования и пишет один warn без
  ключей объектов и URL.
- [x] **Шаг 4:** PASS; `git diff --stat packages/database` → пусто.
- [x] **Шаг 5:** коммит `fix: cap media operation retries`.

## Фронтенд

### Task 3: Один путь подготовки фото и загрузка истории

**Files:**
- Modify: `apps/mobile/src/lib/media/prepare-image-upload.ts`,
  `apps/mobile/src/features/sellers/product-draft-image-actions.ts`,
  `apps/mobile/src/features/sellers/use-product-story-editor.ts`,
  `apps/mobile/src/features/sellers/product-draft-story.tsx`,
  `apps/mobile/src/features/sellers/product-draft-screen.tsx`,
  `packages/api-client/src/images.ts` (удалить `removeStoryImage`, если нет потребителей)
- Test: `apps/mobile/src/features/sellers/product-draft-submit-lifecycle.spec.ts`,
  `apps/mobile/src/features/sellers/use-product-story-editor.spec.ts`,
  `apps/mobile/e2e/work-media-lifecycle.spec.ts`

**Reuse:** `prepareImageUpload`; `preparePhotoEdit` из `src/lib/media/photo-edit.ts`
(кадрирование остаётся там).

**Interfaces:**
- Consumes: `STORY_LIMITS.maxFileBytes`, `WORK_PHOTO_LIMITS.maxPhotos` (Task 1).
- Produces: `export const WORK_PHOTO_PREPARE` в `prepare-image-upload.ts`
  (значения из Global Constraints); хук истории отдаёт `saving: boolean` и
  `uploading: boolean` вместо одного `pending`.

- [x] **Шаг 1: падающий тест подготовки.** JPEG 6000×4000 9 MB для истории →
  `addStoryImage` получает blob ≤ 10 MiB, `prepareImageUpload` вызван с
  `WORK_PHOTO_PREPARE`; галерея — тело ≤ 10 MiB; PNG остаётся `image/png`.
- [x] **Шаг 2:** FAIL.
- [x] **Шаг 3:** `chooseStoryImage` → `prepareImageUpload(asset, WORK_PHOTO_PREPARE)`,
  отправлять `.blob`, `blob:` URI пикера освобождать в `finally`; галерея после
  `preparePhotoEdit` → `prepareImageUpload` с теми же опциями. `editAlt` →
  `altText.trim() || null` (тест: `"   "` → `altText: null`, сохранение успешно).
- [x] **Шаг 4: падающий тест ввода.** `use-product-story-editor.spec.ts`: после
  сохранения `removeStoryImage` не вызывается; при `uploading = true` текст
  редактируется. E2E: пока POST фото истории задержан, ввод в абзац держит фокус и текст.
- [x] **Шаг 5:** удалить цикл `removedAssets` и refs `persistedAssets`/`uploaded`
  (если нет других читателей); хук отдаёт `saving`/`uploading`; текстовые поля
  выключаются только при `!editable || saving`, тулбар и «добавить» — при любом.
- [x] **Шаг 6:** удалить SHA-256 (`addSelection` ~732–748), `sourceChecksum`,
  ветку «Фото уже добавлено», импорт `expo-crypto` (если не нужен); удалить
  e2e-проверки ~1166 и ~1564; сообщение размера — «не больше 10 МиБ».
- [x] **Шаг 7:** PASS; `rg "digest\(|CryptoDigestAlgorithm|sourceChecksum|Фото уже добавлено|removeStoryImage" apps/mobile/src --glob '!*.spec.ts' --glob '!*.spec.tsx'` → пусто.
  Проверяется production-код; серверные fixtures и Metro cache checksum не являются клиентским дедупом.
- [x] **Шаг 8:** коммит `fix: prepare story and gallery photos through one pipeline`.

### Task 4: Упрощение черновика и редактор истории на токенах

**Files:**
- Create: `apps/mobile/src/features/sellers/story-local-draft.ts` (перенос чистых
  функций черновика), `apps/mobile/src/features/sellers/product-draft-story.spec.tsx`
  (owner-спек шага истории)
- Modify: `product-draft-images.tsx`, `use-product-story-editor.ts`,
  `product-block-actions.tsx`, `product-draft-story.tsx`, шаги `ProductDraftStoryStep`,
  `ProductDraftReviewStep`, `PrivateStoryImage`
- Test: `use-product-story-editor.spec.ts`, спеки старой сетки,
  `product-draft-screen.characterization.spec.ts`, `theme.spec.ts`

**Reuse:** токены `packages/design-tokens`; примитивы `src/components/ui`;
`StyleSheet.create`.

**Interfaces:**
- Produces: `story-local-draft.ts` экспортирует `storyDraftKey`,
  `storyDraftRecoveryKey`, `storedBlocksOf`, `draftTextOf`, `restoreV2`,
  `moveStoredDraft`, схему черновика с `v: z.literal(2)`;
  `ProductBlockActions` принимает `variant: 'story' | 'tile'`;
  проп `authEpoch` вместо `sessionEpoch`; хук отдаёт `canAddText`, `canAddImage`.

- [x] **Шаг 1: падающий owner-спек шага истории** (`product-draft-story.spec.tsx`):
  первый символ в виртуальном блоке создаёт абзац с тем же ключом и держит фокус;
  «добавить» выключено на лимитах; при загрузке ввод включён, тулбар выключен.
- [x] **Шаг 2:** FAIL (или PASS там, где Task 3 уже обеспечил — отметить).
- [x] **Шаг 3:** удалить старую сетку в `product-draft-images.tsx` (~581–736),
  `photoCards` обязательный, удалить `uploadFiles`/`UploadImageState`/`'queued'`;
  спеки старой сетки передают `photoCards`.
- [x] **Шаг 4:** перенести чистые функции в `story-local-draft.ts`; удалить
  `restoreLegacy`, `storyDraftLegacyKey`, ветку миграции ключа, `optional` у `v`;
  удалить legacy-случаи в `use-product-story-editor.spec.ts`, остальные не менять.
- [x] **Шаг 5:** `ProductBlockActions` → `variant`; геометрия внутри компонента.
- [x] **Шаг 6:** `product-draft-story.tsx`: inline-стили → `StyleSheet.create` с
  токенами; лимиты — из хука; дубли подсчёта удалить; переименовать `sessionEpoch`.
  Визуально ничего не меняется.
- [x] **Шаг 7:** литерал `10` → `WORK_PHOTO_LIMITS.maxPhotos` (пикер, `addSelection`, шаг).
- [x] **Шаг 8:** PASS; `rg "'queued'|uploadFiles|sessionEpoch|restoreLegacy|storyDraftLegacyKey|menuVisible|triggerFrame" apps/mobile/src` → пусто;
  `rg 'presentation=' apps/mobile/src/features/sellers/{product-block-actions,product-draft-images,product-draft-story}.tsx` → пусто;
  `rg -c "style=\{\{" apps/mobile/src/features/sellers/product-draft-story.tsx` → 0.
  `presentation` несвязанных sheets не входит в проверку API ProductBlockActions.
  Геометрия редактора390 сохранена; один кадр Chromium отличается46 краевыми пикселями на1 уровеньRGB (журнал). Дифф задачи отрицательный.
- [x] **Шаг 9:** удалить хвост проверок геометрии в `e2e/work-media-lifecycle.spec.ts`,
  которые дублируют скриншот (оставить один скриншот на состояние).
- [x] **Шаг 10:** коммит `refactor: simplify story draft and move editor styles to tokens`.

## Ветка и документы

### Task 5: Основная ветка `main`

**Files:** Modify: `.github/workflows/verify.yml`, `.github/workflows/production-deploy.yml`.
Test: `scripts/ops/lib/release-workflows.spec.mjs` (существующий owner-спек).

- [x] **Шаг 1:** `git log feature/photo-workflow..origin/main` — перечислить
  уникальные коммиты `origin/main` и подтвердить, что их содержимое уже в ветке.
- [x] **Шаг 2:** production guard/message и Workers CI перевести на `main`; Verify push — только `main` по явному решению основателя2026-10-29, PR/manual сохранить
  (Facts). `rg "portfolio-mvp-release" .github deploy` → пусто.
- [x] **Шаг 3:** записать в отчёт команды для основателя (агент их не выполняет):

```bash
git switch main && git reset --hard fix/photo-story-hardening   # после ревью W0
git push --force-with-lease origin main
# GitHub → Settings → Default branch: main; Cloudflare Workers CI branch: main
git branch --merged main | grep -v '^\*\|main' | xargs git branch -d
git push origin --delete feature/portfolio-mvp-release            # после зелёного деплоя с main
```

  Не удалять ветки с непомёрженными коммитами; `archive/commerce-v1` оставить
  (справочник для W3).
- [x] **Шаг 4:** коммит `ci: use main as the release branch`.

### Task 6: Документы и полная проверка

**Files:** Modify: `docs/product/12-DECISION-LOG.md`, `docs/product/11-PROJECT-STATUS.md`,
`docs/product/10-CODE-ARCHITECTURE.md`, `docs/design/04-DESIGN-STATUS.md`.

- [x] **Шаг 1:** журнал — запись «Story/Work photo limits unified», следующий
  свободный номер, `Revises: DEC-116` (вход истории 10 MiB, бюджет 20 MiB удалён).
- [x] **Шаг 2:** статус — одна запись, фото `Partial` (открыты `DEC-112`, CDN
  истории, native); архитектура — только инварианты лимитов и холдов; дизайн-статус —
  редактор истории на токенах.
- [x] **Шаг 3:** проверки (вывод в отчёт):
  `pnpm --filter @bidplace/contracts --filter @bidplace/api-client --filter @bidplace/api --filter @bidplace/mobile typecheck` и `lint`;
  API unit + интеграция (`author-story-catalog`, `work-media-http`, `media-lifecycle`,
  `product-write-atomicity`, `upload-safety`) на `bidplace_e2e`; mobile unit полностью;
  e2e `playwright.media.config.ts` (истории) + `product-story-revision.spec.ts` +
  `local-draft-restore.spec.ts`, Chromium и WebKit; `pnpm --filter @bidplace/mobile build:web`;
  `git diff --check`; `pnpm docs:link-check`.
- [x] **Шаг 4:** коммит `docs: record unified photo limits`.

Не трогать (регрессионные ворота): save-race, route-guard, browser-sentinel,
local-draft-restore e2e, `product-story-revision.spec.ts`, publish/revoke CDN e2e,
удаление EXIF, magic-byte policy, admission cap, `media-lifecycle.integration.spec.ts`.

Явное исключение основателя2026-10-29: в save-race разрешены только метаданные
picker-фикстур; в двух названных browser-specs — актуальные шаги/локаторы.
Проверки гонок, восстановления, записи, прав и ревизий не удалять/не ослаблять.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace. Создай ветку fix/photo-story-hardening
от feature/photo-workflow. Прочитай AGENTS.md, docs/launch/AGENT-RULES.md и целиком
docs/launch/waves/W0-photo-and-trunk.md — это план. Выполни его через
subagent-driven-development (или executing-plans), задачи Task 1 → Task 6 по
порядку, шаги TDD как написаны, один коммит на задачу. Перед каждой задачей
перепроверь Facts. Ничего сверх задач. Push/merge/deploy не делать. Отчёт по
AGENT-RULES §6.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7 и docs/launch/waves/W0-photo-and-trunk.md.
Ревью ветки fix/photo-story-hardening против feature/photo-workflow. Сам выполни
команды приёмки (rg, тесты) каждой задачи и проверь Review Focus. Вердикт по
AGENT-RULES §7.
```

Инварианты:
- один путь обработки фото на клиенте: `rg '\b(manipulateAsync|ImageManipulator|HTMLCanvasElement|OffscreenCanvas|CanvasRenderingContext2D)\b|\.getContext\(' apps/mobile/src --glob '!**/lib/media/**' --glob '!*.spec.ts' --glob '!*.spec.tsx'` → пусто; palette.canvas — цветовой токен, не Canvas API;
- одна таблица входных лимитов на сервере; история и галерея идут через один `process()`;
- холды истории снимает только сервер и только в транзакции сохранения;
- миграций нет, `nextAttemptAt` не обнуляется, аватар не изменён.

Красные флаги: новый сервис или слой загрузки; объединение `ImagesService` и
`MediaLifecycleService`; ослабленные или удалённые тесты из «не трогать»; `catch`
без обработки; изменения вне `apps/api`, `apps/mobile`, `packages/contracts`,
`packages/api-client`, `.github/workflows` и документов задачи 6; визуальная
разница редактора истории.


## Журнал исполнения 2026-10-28

**Partial.** База проверена: `feature/photo-workflow` =
`9a2bdf973d5e35ad7fafb3dc539edad38b28bc5e`; создана `fix/photo-story-hardening`.
Чужие launch-документы и `.cursor/` не включались в коммиты и не откатывались.
Task5 **отложена по прямому указанию**: main, CI, push, merge и deploy не выполнялись.

| Задача | Коммит | Изменение строк | Результат |
| --- | --- | --- | --- |
| Task1 | `ede2e16a` | +209/−49 | Холды, ранний/locked admission, входные лимиты и контракты; новые проверки pass; полный atomicity gate имеет baseline failures |
| Task2 | `8eef24fc` | +62/−3 | Потолок20, сохранённый nextAttemptAt, одно предупреждение;36 media unit pass |
| Task3 | `52e978bb` | +174/−171 | Общая подготовка, upload/saving, alt trim, удаление клиентского cleanup/hash;120 адресных unit и2 browser pass |
| Task4 | `689af0c0` | +609/−848 | v2 owner, StyleSheet, variants, удаление старой сетки;119 адресных проверок и2 browser pass; полный mobile gate требует решения по фикстурам |
| Task5 | — | — | Отложена; никакого cutover |
| Task6 | `566a63d1` | +232/−55 | Документы/проверки; общий статус Partial |

Facts перечитаны перед каждой задачей. Позиции строк с `6720b7af` устарели,
названные дефекты подтверждены на базе. TDD: 5 холдов вместо3; 5×9MiB давали409;
10MiB multipart давал413; admission/pipeline4 failures; retry22 вместо20;
текст при upload оставался прежним; UI игнорировал capacity из владельца.
После исправлений адресные проверки зелёные.

### Фактическая проверка

Node22.20.0; `.env` не загружались (`BIDPLACE_ENV_FILE` указывает на отсутствующий
тестовый файл; `EXPO_NO_DOTENV=1`). Интеграция — случайные `itest_*` схемы в
`bidplace_e2e`; браузеры — отдельная `e2e_photo_story_20261028` схема через
`migrate deploy`. Сброс БД/пользовательских данных не выполнялся. Только тестовые
Chromium/WebKit; пользовательский Chrome не использовался.

- `pnpm --filter @bidplace/contracts --filter @bidplace/api-client --filter @bidplace/api --filter @bidplace/mobile typecheck` — pass4 packages.
- Та же команда `lint` — pass для API/mobile (contracts/api-client не имеют lint script).
  Дополнительный ESLint через `packages/eslint-config/index.js` по contracts/client:
  fail2 `import/no-duplicates` в неизменённом contracts/admin.ts, уже есть на базе.
- `pnpm --filter @bidplace/api test` — **476/476 pass**. При полной проверке
  дополнена пустая `productRevisionStoryAsset.findMany` в существующем mock
  `products.service.spec.ts`, без изменения assertions.
- `INTEGRATION_DATABASE_URL=<local bidplace_e2e> pnpm --filter @bidplace/api exec vitest run --config vitest.integration.config.ts author-story-catalog.integration.spec.ts work-media-http.integration.spec.ts media-lifecycle.integration.spec.ts product-write-atomicity.integration.spec.ts upload-safety.integration.spec.ts`
  — **57 pass /2 fail**. `upload-safety` соответствует двум файлам. Оба сбоя —
  старые gallery-случаи atomicity: позиции ProductImage `[1,2]` вместо `[0,1]`,
  текст409 `Product images changed while saving order` вместо старого текста.
  На отдельном checkout базы — те же2 fail /9 pass. Assertions не менялись.
- Contracts48/48 и api-client51/51 unit — pass.
- Mobile owner/consumer suite — **119/119 pass**. Полный `pnpm --filter @bidplace/mobile test`:
  **1127 pass /4 fail**: четыре save-race фикстуры не содержат width/height/MIME; новая обязательная
  подготовка отклоняет их. На базе save-race26/26 pass. Основатель явно отказался менять
  фикстуры; защищённый файл не изменён и gate остаётся незакрытым.
- Playwright, media story cases + `product-story-revision.spec.ts` +
  `local-draft-restore.spec.ts`, оба движка — **6 pass /6 fail**. Отдельный прогон
  базового UI воспроизводит те же6 fail: старое поле имени в первом шаге заявки
  и `1/10 изображений` перед переходом к истории. Защищённые сценарии не менялись.
  Baseline checkout использует установленные workspace зависимости; его API/Metro
  отдельные,3029/8099. Основная проверка3028/8098.
- `pnpm --filter @bidplace/mobile build:web` с `EXPO_NO_DOTENV=1` — pass;
  `pnpm --filter @bidplace/api... build` — pass.
- `git diff --check` — pass. `pnpm docs:link-check` — pass99 files.
- Story polish (first character, focus, gutter hit points, menu/keyboard, resize,
  delayed upload) — Chromium/WebKit2/2 pass до и после Task4. Кадры390×874:
  `.superpowers/sdd/W0-photo-and-trunk/{before,after}/2026-10-28-story-editor-controls/`.
  Все состояния истории совпали попиксельно, кроме46 пикселей края тулбара
  в одном Chromium кадре (138 каналов, разница1 уровень RGB; геометрия совпадает). Gallery capture timing не используется как visual
  acceptance истории. Нативная проверка и точный wide Figma parity не заявляются.

### Rulings и ограничения

- Ruling: существующий cleanup вызывается отдельно для каждого освобождённого
  ассета в одной story TX — план требует две операции для двух холдов;
  стоимость — дополнительные строки очереди, без нового механизма.
- Ruling: helper интеграции допускает точное имя `bidplace_e2e`, сохраняя случайные
  схемы; ProductsService передаёт существующий media owner в story helper;
  controller меняет multer cap, хотя эти потребители пропущены в Files плана.
- Ruling: успешный POST возвращает существующий201, не указанный в плане200;
  Busboy считает fileSize эксклюзивным, поэтому interceptor10MiB+1 допускает
  ровно10MiB и отклоняет10MiB+1; process независимо проверяет inclusive cap.
- Ruling: retry cap применяется к claim и outstanding-work тоже — иначе ручной
  run обходит потолок, а scheduler продолжает пустые циклы. Схема не менялась.
- Ruling: изменены все потребители pending/checksum/authEpoch и Vitest include
  `.spec.tsx`; иначе новые интерфейсы и owner-тест недействительны. DnD не расширен.
- Ruling: v1/content-merge и применение unscoped копий удалены; оставлен только
  recovery-only перенос unscoped v2 — этого требует защищённый revision gate.
  Цена ошибки — потеря доступности старого текста, поэтому quarantine сохранён.
- Ruling: удалён только obsolete optional-photoCards branch; shared grid/row
  нужны review step. Из E2E убран только дублирующий toolbar/SVG geometry-report;
  интерактивные/focus/session/permission проверки сохранены.
- Ruling: RFC §10 и media security table обновлены узко вместе с обязательными
  четырьмя owner-документами — явный контракт W0/DEC-151 не должен противоречить
  текущим владельцам. DEC148 duplicate clause также явно пересмотрена.
- Ruling: grep-инварианты применяются к изменённым владельцам: SHA серверных
  fixtures/Metro cache и `presentation` несвязанных sheets необходимы и сохранены.

Не закрыты: обязательные baseline gates/два shared-lint дефекта, четыре save-race metadata fixtures,
которые основатель решил не менять; `DEC-112` shared bytes, story CDN, native.
Статус не повышать до Implemented. Полные логи и trace — в игнорируемом workspace
`.superpowers/sdd/W0-photo-and-trunk/`; файлы БД/миграций не менялись.


### Финальные замечания ревью

Независимый reviewer выполнил backend62/62 и frontend115pass/4fail и нашёл два
существенных дефекта. Полное ревью/вердикт не завершены: reviewer остановлен
лимитом использования. Оба замечания проверены по исходникам и воспроизведены
новыми тестами перед исправлением:

- `save()` после потерянного upload-ответа мог PUT-ом снять холд ещё невидимого
  клиенту ассета. Теперь до snapshot/PUT выполняется один существующий keyed
  replay; при отказе PUT не вызывается, текст/blob/key остаются. После await
  повторно проверяются identity/owner/change guards. Параллельный save и смена
  auth epoch не обходят защиту.
- `editAlt.trim()` на каждом символе удалял пробел между словами. Raw input
  сохраняется до serialization; `writeBlocks` trim-ит alt или отдаёт null.
  Случай whitespace-only→null сохранён; E2E вводит подпись посимвольно.

Ruling: нормализация alt перенесена из указанного в плане editAlt в writeBlocks
— иначе controlled input не позволяет естественный multiword-ввод; контракт API
не меняется. Ruling: перед save используется один явный retry существующей
pending-загрузки — иначе server cleanup уничтожает её после потерянного ответа;
нового слоя загрузки или бесконечного retry нет.

Финальный mobile unit: **1127 pass /4 fail**, все четыре — неизменённые save-race
metadata fixtures. Story polish с посимвольным alt: **2/2 pass**, mobile typecheck
и lint pass. Один промежуточный прогон поймал timing-сбой существующей gallery
reconciliation-проверки; без правок/таймаутов следующий адресный и полный прогон
прошли этот случай. Это не объявлено новой гарантией стабильности.
Основатель явно отказался разрешить metadata-изменения: статус Partial сохраняется.


## Продолжение исполнения 2026-10-29

Основатель явно согласовал все три решения: metadata-only изменения save-race,
актуализацию шагов/локаторов защищённых browser specs при сохранении инвариантов,
main-only push trigger. Отказ и отложенная Task5 из журнала2026-10-28 — история;
эта запись определяет текущий scope. Push/merge/deploy, переключение main,
перезапись веток и сброс БД не выполняются.

- `d701f87a` (+67/−20): исправлены неполные picker fixtures, явный upload перед
  story, отдельный author photo step; все assertions сохранены. Atomicity проверяет
  позиции `ProductRevisionImage`, соответствие backing image ids и точный409
  locked reorder. `ProductImage.position` не является порядком текущей ревизии.
  Duplicate enums import объединён; production behavior не изменён.
- `8f610267` (+15/−6): Task5 подготовлена локально. Verify push только main,
  PR/manual сохранены; production ref guard и Workers CI branch — main. Ops32/32.
  После успешного `git fetch --no-tags origin main` уникальный коммит origin/main
  по-прежнему `5a052ad1` — публикация manual production workflow. Его функциональность
  уже в текущем файле вместе с новыми release/security gates; cherry-pick старого
  workflow не нужен. Команды основателю — в Task5 выше, агент их не выполнял.

Ruling: update канонических revision-order assertions — сохранить проверку гонок
и целостности вместо принуждения физического storage index к UI-порядку.
Ruling: область grep уточнена до владельцев и API; palette.canvas, presentations
несвязанных sheets и серверные/Metro checksums не удаляются ради пустого поиска.
Все7 проверок инвариантов пусты. Дифф Task4 остаётся отрицательным.

### Итоговая проверка продолжения

Node22.20.0. `.env`/секреты не читались. Интеграция использует случайные `itest_*`
схемы в bidplace_e2e, браузеры — новую e2e_photo_story_20261029 через migrate deploy;
без reset. Только тестовые Chromium/WebKit, пользовательский Chrome не затронут.

- Четыре typecheck: pass. API/mobile lint: pass; supplemental shared lint: pass.
- API unit:476/476; mobile unit до исправления ревью:1131/1131; contracts48/48; api-client51/51: pass.
- API build и Expo build:web (`EXPO_NO_DOTENV=1`): pass.
- Локальные workflow/ops проверки:32/32 pass.
- Интеграция той же командой Task6: **59/59 pass** (6 файлов), serial16.18s.
- Story browser matrix той же выборкой Task6: **12/12 pass**, Chromium/WebKit,
  serial2.0m. Конфигурация media с `webServer: []`, чтобы исключить default reset.
- `git diff --check`: pass; `pnpm docs:link-check`: pass99 files.
- Финальные кадры390×874 сняты/просмотрены в
  `.superpowers/sdd/W0-photo-and-trunk/20261029-final/`; меню и текст без сдвига
  согласованной геометрии.

### Закрытие ревью 2026-10-29

Ревью `9a2bdf97..8f610267`: Critical0, Important1 (два эффекта), Minor0.
Первая загрузка фото не помечала черновик dirty, поэтому владельцы перехода
пропускали save; keyed replay шёл через публичный `addImage` и блокировался
собственным transition lock.

Исправление `8a5de85a`: тот же owner помечает pending intent dirty при staging;
публичный `addImage` проверяет пользовательский lock, save вызывает внутренний
`uploadImage`. Identity, owner и session guards сохранены. RED7/7 на
Continue/close/submit (с текстом и без) и failed replay, затем GREEN7/7.
Адресный повтор decode и новых случаев:9/9. Один известный intermittent gallery
decode в первом двухфайловом прогоне прошёл повторно без изменения assertions,
таймаутов и retries.

Фактическая приёмка после исправления: mobile **1138/1138**, API **476/476**,
интеграция **59/59**, contracts **48/48**, api-client **51/51**, Chromium/WebKit
**12/12**, ops **32/32**. Typecheck, lint и сборки API/web прошли. Mobile,
typecheck, lint, web build и browser matrix повторены после `8a5de85a`; API,
интеграция, contracts, api-client и ops — serial-приёмка до этого мобильного
исправления, код API не менялся. Логи:
`.superpowers/sdd/W0-photo-and-trunk/review-mobile-full.log`,
`review-browser.log`, `review-types.log`, `review-lint.log`,
`review-web-build.log`, `accept-*-serial.log`.

`git diff --check` и `pnpm docs:link-check` этой ветки: 99 файлов. Результат 105
относится к `fix/launch-docs-review`, не к этой ветке.

Общий статус фото остаётся **Partial**: `DEC-112`, CDN истории и native вне W0.
Task5 подготовлена локально (`8f610267`); фактический cutover `main` отложен.
`DEC-150` на `fix/launch-docs-review` (`54925364`) — решение по сделкам; фото —
`DEC-151`. Эту ветку документов учитывать при объединении после ревью W0, до W1.
Ветки не сливались. Логи и кадры390×874 сохранены в
`.superpowers/sdd/W0-photo-and-trunk/`.

Первый перегруженный параллельный прогон не скрыт: API Turnstile50ms local HTTP
fixture не успела получить headers, интеграционные beforeAll10000ms истекли;
один WebKit story locator устарел во время пересборки workspace-зависимостей,
которые смотрит Metro. Проверки повторены последовательно после сборок,
без изменения assertions, таймаутов и retries. API serial476/476 уже pass.
Логи: `.superpowers/sdd/W0-photo-and-trunk/accept-*`; окончательные network/DB
логи имеют суффикс `-serial`. Точные manual founder actions сохраняются в Task5.

### Привязка истории и очистка подготовки 2026-10-29

`8a6e3620` требует `X-Photo-Revision` для загрузки истории. Клиент запоминает
редакцию при выборе фото и передаёт её при повторе. Сервер проверяет её до
staging и после блокировки Product. Повтор для другой редакции возвращает 409
и не создаёт холд. Повтор потерянного ответа той же редакции и лимит пяти фото
сохранены. Идентификатор редакции не входит в hash операции.

`080bc7c6` проверяет один `mediaAssetId` на двух редакциях. Сохранение первой
снимает только её холд. После cleanup вторая ссылка, состояние `READY` и байты
остаются. Продакшен-код cleanup не менялся: дефект не воспроизвёлся.

`ec860de9` удаляет отклонённый результат `prepareImageUpload` через существующий
`deleteGeneratedImage`: превышение размера и ошибка чтения. Исходный файл и
успешно возвращённый URI сохраняются. `b4af2da2` задаёт тип этого spy; до него
typecheck mobile падал на пустом кортеже вызовов. Verify на `9252cee8` затем
отклонил неиспользованный параметр; `8b578f2d` использует аргумент spy.

Адресные проверки: API images 34/34, api-client images 4/4, mobile
prepare/editor/submit 131/131, интеграция `work-media-http` и
`author-story-catalog` 18/18. Typecheck четырёх пакетов, lint API/mobile, сборка
API и web export — pass. Story browser matrix той же выборкой: **12/12**,
Chromium/WebKit, 2.1m, схема `e2e_photo_story_20261029` через `migrate deploy`
без reset, серверы 3028/8098 остановлены. Пользовательские 3001/8081 не
трогались. Общий статус фото остаётся **Partial**: `DEC-112`, CDN истории и
native вне W0.


### Дополнительное ревью частичного staging 2026-10-29

На `bf570ebf` GitHub Verify и GitGuardian завершились SUCCESS. Независимый
адресный прогон: images API34/34, mobile prepare/editor/submit131/131.
Три замечания внешнего ревью реализованы, но найден оставшийся край первого:
`stage()` создавал upload-операцию и мог упасть на private put до привязки
revision в ImagesService. Повтор ключа с текущей R2 принимался.

TDD: существующий HTTP owner-spec расширен отказом private put в R1,
переключением на R2 и повтором того же ключа. RED:201 вместо409. Durable fix:
`MediaLifecycleService.stage` записывает revision в транзакции создания операции
до object writes; существующая непривязанная операция связывается условно.
Проверка после Product lock сохранена, запись после успешного stage удалена
из ImagesService. Тот же ключ в R2 отклоняется, исходная R1 восстанавливается.
Схема, клиент, UI, лимиты, DnD и таймауты не менялись.

Ruling: revision binding принадлежит созданию существующей upload-операции —
поздняя запись после stage не переживает частичную ошибку; цена ошибки была
перенос фото между редакциями. Это один дополнительный аргумент существующего
stage, без нового сервиса или upload-слоя.

Проверки этого исправления: HTTP race RED201→GREEN409 с успешным повтором в R1;
шесть интеграционных owner-файлов61/61 (`--maxWorkers=1`,37.28s), API unit478/478,
API typecheck/lint и API dependency build pass. Первый прогон с параллельными
миграциями:39pass/22skip, один beforeAll превысил прежние10s; последовательный
повтор прошёл без изменения hookTimeout/assertions. Первый typecheck выявил
exactOptionalPropertyTypes для optional revision; запись отсутствующей revision
исправлена на null без подавлений. Mobile131/131 проверены при ревью до этого
API-only исправления; UI/browser повторно не запускались, клиент не менялся.
Полный `pnpm verify` на новом HEAD не заявляется: full Verify на bf570ebf был
зелёный, новая CI-проверка относится к следующему push. Общий статус Partial.
