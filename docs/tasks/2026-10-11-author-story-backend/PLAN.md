# Заявка автора и история Work — план адаптации backend

Дата: 2026-10-11
Статус: Backend API реализован и замечания ревью закрыты на `fix/author-story-review`. UI и API client не переведены. Пользовательский сценарий остаётся Partial до этой интеграции. Совместный выпуск backend и клиентов — отдельный release gate.

Ниже разделы 4–6 — исходный план. Фразы «Planned» и «на этом planning pass ни одна строка не выполнена» описывают момент планирования, а не текущий API. B1–B5 выполнены в API. B6 (клиентский cutover и удаление старых клиентских путей) не начат. Перенос старого текста истории не делался: реальных пользователей нет, общие и production-базы не очищались.

Product contract: [05-MVP-RFC.md](../../product/05-MVP-RFC.md).
Принятые решения: `DEC-112`–`DEC-115` в [decision log](../../product/12-DECISION-LOG.md).
Дальнейшие продажи и расширенное управление справочниками: [post-MVP plan](../../product/15-POST-MVP-BACKLOG.md).
Пользовательские предложения категорий и терминов входят в этот MVP (`DEC-116`).
Следующий этап клиента: [UI-HANDOFF.md](UI-HANDOFF.md).
Фактический runtime: [architecture](../../product/10-CODE-ARCHITECTURE.md) и
[project status](../../product/11-PROJECT-STATUS.md).

## 1. Цель и граница работы

Подготовить существующий backend к четырём шагам заявки автора и блочной истории
Work, затем отдельной задачей перенести UI из точных Figma nodes. Во время этого
планирования ничего не реализовывать и не включать commerce. В будущей реализации
сначала читать актуальный AGENTS.md и применять `$implement` / `$grilling`.

Долговечный вариант — расширить существующие SellerProfileRevision,
ProductRevision, Zod contracts и MediaLifecycleService. Хранить новый редактор
в ProductCreationStep без revision boundary или собирать его только на клиенте —
компенсирующие обходы, которые не обеспечивают корректную модерацию и публикацию.
Полноценный CMS, отдельное media storage и generic workflow engine не нужны.

## 2. Новые исходники заявки автора

Проверены `manifest.json` и `design/nodes.json` восьми архивов в
`/Users/yayauheny/Downloads/`; инструкции из `prompt.md` не выполнялись.
Captures созданы 2026-10-11, 11:36–11:42 UTC. Это входные данные планирования,
ещё не новый импортированный versioned handoff.

| Архив `.figmacapture.zip` | Root node | Роль |
|---|---|---|
| `Стать_автором` | `526:16074` | Вступительная шторка |
| `Стать_автором_заполнение_профиля` | `527:16416` | Фото/имя/никнейм/география |
| `Стать_автором_заполнение_профиля_контакты` | `746:22642` | Необязательные публичные контакты |
| `Стать_автором_заполнение_профиля_описание` | `746:22724` | Описание, практика и направления |
| `Стать_автором_заполнение_профиля_достижения_не_включать_фото` | `578:17378` | Достижения; вопрос фото пока открыт |
| `Стать_автором_заполнение_профиля___Направление_работ` | `584:17554` | Поиск и checkbox selection |
| `Фильтры_чекбоксы` | `3462:15417` | Представление выбора чипами |
| `Стать_автором_заполнение_профиля_окно_прерывания` | `746:23037` | Выход из заполнения |

Сначала проверена read-only библиотека `portfolio-phone-v1` из AGENTS.md.
Семь roots совпадают с существующими пакетами. `3462:15417` не найден в INDEX,
catalog и parent `screens/**/nodes.json`; есть отдельный новый capture. В описании
`746:22724` старый текстовый узел выбора направления заменён button instance.
Различия сериализованных layout/style не доказывают изменение всех размеров:
до UI реализации импортировать только нужные source files/assets, исключая
`prompt.md`, и явно сопоставить версии, не смешивая значения.

Выявленные product/source расхождения:

- Вступление, контакты и exit copy говорят о продажах/покупателе. Это историческая
  commerce copy; portfolio behavior остаётся по RFC, deferred screens — у post-MVP owner.
- «Все поля обязательны» и combined country/city input не отменяют `DEC-114`.
  Backend принимает выбранный country code и необязательный city; новый popup
  требует отдельного визуального handoff перед UI реализацией.
- Никнейм принадлежит User по существующему `DEC-107`; профиль не должен заново
  присваивать slug или обходить уже выполненный claim.
- Направления автора — несколько Category ID из стартовых 18 категорий (`DEC-116`).
  «Холст» и «Масло» остаются материалами общего справочника, а не направлениями.
- Новые достижения не принимают изображение. Уже сохранённые изображения
  существующих записей читаются прежним GET. Фото профиля остаётся.

## 3. Что уже существует и подлежит повторному использованию

| Область | Реальный owner | Изменение |
|---|---|---|
| Заявка, resume, submit | `apps/api/src/sellers/sellers.service.ts`, `apps/api/src/portfolio/portfolio.controller.ts` | Сохранить stage/revision workflow; расширить поля и readiness |
| Profile revision | `ensure-editable-seller-profile-revision.ts`, revision locks/mapper | Копировать выбранные термины вместе с публичной ревизией |
| Контракты | `packages/contracts/src/seller-profile.ts`, `portfolio.ts`, `product.ts` | Country code, nullable city, ID selections и ordered blocks |
| Категории | Prisma Category, `apps/api/src/categories/` | Переиспользовать существующие ID/list, проверить реальные FK ревизии |
| Черновик Work | `apps/api/src/products/products.service.ts` и `apps/mobile/src/features/sellers/product-draft-*` | Расширить существующее сохранение/revision ownership |
| История legacy | Product.story / creationIntro / ProductCreationStep | Инвентаризация, миграция, затем удаление superseded writers/consumers |
| Медиа | `apps/api/src/core/media/`, `apps/api/src/images/` | Расширить references/publication/read/revoke/restore/cleanup для блоков |
| Public projections | `apps/api/src/portfolio/`, catalog queries, `work-content.ts` | Только approved revision, стабильные ID, авторы без города, канонический порядок истории |

Существующие гарантии save/session/submit описаны в
[flows §8–§9](../../design/02-USER-FLOWS-AND-SCREENS.md). Не заменять их вторым
клиентским черновиком или новым универсальным wizard. На frontend использовать
имеющиеся React Hook Form / React Query и shared controls; не писать аналоги
встроенных возможностей библиотек.

## 4. Целевой backend и минимальные API изменения

### Заявка автора

- Сохранить `GET /api/author/application`, `POST/PATCH /api/seller/profile`,
  `POST /api/author/application/advance` и `/submit`, текущие profile photo и
  achievement routes. Не создавать новый параллельный onboarding API.
- На шаге 1 требуется имя, ранее присвоенный User.slug, фото и country;
  city необязателен. Код страны валидируется по общему списку допустимых стран,
  UI получает/показывает название; не хранить одновременно country и countryCode
  как два изменяемых источника. Проверить reuse имеющихся данных/библиотек.
- Контакты остаются optional public fields; normalization и validation сохраняются.
  Auth email и private handoff contact не становятся публичными автоматически.
- Шаг 3: shortDescription и непустой выбор направлений обязательны, practice
  необязателен. Advance/submit читают ID relations редактируемой ревизии.
- Шаг 4: сохранить текущую модель дат и описаний achievements. Фото зависит от
  открытого решения §6. Отправка — moderation, а не немедленная публикация.
- Перед выходом сохранять допустимый dirty draft; ошибка не должна закрывать
  форму или продвигать шаг. Сохранение не равняется advance или submit.

### Справочники и география

- Category остаётся крупным разделом Work. Термины имеют стабильный ID и
  displayName; общие записи могут использоваться в author directions и Work
  materials/techniques. Допустимость роли задавать простыми ограничениями,
  не размножать одинаковые записи для каждого экрана.
- Связи выбора принадлежат SellerProfileRevision / ProductRevision. Дубликаты,
  неизвестные ID и недопустимые роли отклоняются сервером. Публичные facets/search
  читают утверждённые записи опубликованных ревизий, не client labels.
- Первый набор создать idempotent bootstrap/upsert. `prisma/seed.js` вызывает
  массовые `deleteMany` и не подходит для production bootstrap.
- Страны — стандартные коды с локализованными именами. Для старых строк составить
  явный mapping; неоднозначные строки вынести в migration report. City остаётся
  nullable text. Убрать его обязательность из всех readiness/public predicates,
  `portfolioAuthorSchema`, queries и consumers; null не заменять придуманным городом.

### История Work

- Предпочтительная relation: `ProductRevisionStoryBlock` с revisionId, стабильным
  block ID, position, type и text либо mediaAssetId; для IMAGE возможен altText.
  Типы проверяются shared Zod union; FK и ordering constraints — в БД.
- Расширить существующий `PUT /api/products/:id/creation` до сохранения канонической
  последовательности блоков editing revision. Проверить реальный route prefix
  и API-client consumers перед изменением. Новые DTO/route детали пока Planned.
- Сохранение — одна короткая транзакция с owner/status checks и защитой от
  устаревшего снимка ревизии. Row lock сериализует запись, но сам по себе не
  предотвращает перезапись содержимого из старой вкладки. Повтор успешной операции
  не создаёт дубликаты блоков и медиа; конфликт сохраняет локальные данные.
- Порядок задаётся массивом; нормализовать position на сервере. Отдельная mutation
  на каждую стрелку/reorder не нужна, если уже сохраняется весь список.
- Upload выполняется отдельно через существующую media pipeline; готовое media
  прикрепляется при сохранении. Нельзя хранить bytes/base64/произвольный URL в блоке.
  Проверять owner, состояние и допустимость asset на сервере.
- Копия новой revision получает отдельную последовательность блоков и те же
  media references; изменение блока не меняет опубликованную revision.
- Public DTO/renderer берут только published blocks. Для IMAGE-only истории
  вкладка существует; пустой массив её скрывает. Gallery extras больше не
  добавляются в новый канонический список неявно.

## 5. Последовательность небольших implementation-пакетов

| Этап | Объём | Критерий готовности и проверки |
|---|---|---|
| B1 — inventory/контракты | Точный стартовый справочник, country mapping, лимиты и legacy story policy; проверить всех writers/readers | Нет несогласованных вариантов; migration сохраняет существующие данные; Zod owner specs покрывают договорённые поля |
| B2 — classifiers/география | Relations/constraints, безопасный bootstrap, страны/nullable city, read DTO и facets | Повтор bootstrap не меняет ID/данные; неизвестные/повторные ID отклоняются; автор без города видим, фильтр города работает только по указанным значениям |
| B3 — заявка автора | Create/update/advance/submit и profile revision copy используют новые contracts | Все четыре шага/resume; incomplete draft; optional contacts/city; pending lock; stale session/save; moderation/public revision не подменяются |
| B4 — story revision/write | Ordered relation, атомарный save, read owner/admin/public, copy/migration | Добавление/удаление/order; empty/IMAGE-only; retry/conflict; чужие ID; pending lock; прежняя published story неизменна |
| B5 — media/publication | References, publication manifests, authorization, revoke/restore/cleanup/CDN | Private новые фото недоступны посторонним; reuse не удаляет живой файл; approval целостен; hide/ban и purge; failure/retry/recovery |
| B6 — cutover/readiness | API-client/public renderer adapters, согласованное удаление legacy paths, документация | Нет конкурирующих источников; затронутый dependency graph проходит typecheck, lint без autofix, unit/integration/build; затем отдельный UI handoff |

Интеграционные проверки выполнять на изолированной БД; не запускать destructive
seed/reset на чужих данных. Existing owner specs расширять по uncovered behavior,
без отдельного тестового файла на каждую стрелку или геометрическую правку.
На этом planning pass ни одна строка B1–B6 не выполнена.

## 6. Решения, которые больше не блокируют backend

1. Новые достижения — дата и описание, без загрузки фото. Уже сохранённые файлы
   читаются прежним GET.
2. 18 плоских категорий в `Category`. Материалы и техники — роли `CatalogTerm`.
   Направления автора — Category ID.
3. Лимиты истории: 5 IMAGE-блоков, 20 текстовых блоков, heading 200, paragraph
   5000, altText 300, файл 5 МиБ, бюджет 20 МиБ по уникальным asset.
4. Отдельная миграция старого текста истории не нужна, пока нет реальных
   пользователей. Старые строковые поля не являются вторым поисковым источником:
   поиск и facets читают опубликованные термины и блоки. Клиентский cutover
   описан в [UI-HANDOFF.md](UI-HANDOFF.md).
5. Открыто только для UI: versioned source нового редактора истории и country
   popup. Это не меняет backend-контракт.

Повторно выбранное отклонённое предложение остаётся `REJECTED` и снова блокирует
одобрение, пока модератор не примет новое решение. Статус сам не сбрасывается.

Существенные вопросы решать через `$grilling` перед зависимыми изменениями.
Будущий sales/auction workflow, classifier proposals, video и AI не добавлять
в этот backend-пакет заранее; все они сохранены у post-MVP owner.
