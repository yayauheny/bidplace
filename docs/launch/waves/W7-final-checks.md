# W7 — Финальные проверки: 4 замера, сквозной сценарий, чистка тестов — план

> **Для агентов:** выполнять через superpowers `executing-plans`. Шаги — чекбоксы.
> Общие правила — [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** перед запуском доказать четыре вещи, которые реально ударят по
пользователям, прогнать один сквозной сценарий продажи и убрать дублирующие
тесты, не трогая ворота качества.

**Architecture:** замеры — скрипты и ручные шаги без новых зависимостей
(Node `fetch`, Chrome DevTools/Lighthouse из браузера, `EXPLAIN`); результаты —
таблица в отчёте и в `11-PROJECT-STATUS.md`. Правки по итогам — только если
нарушен порог, у владельца проблемы, отдельным коммитом.

**Spec:** [PERFORMANCE-AUDIT.md](../PERFORMANCE-AUDIT.md) (как искать),
[COMMERCE.md](../COMMERCE.md) §11 (гонки).

**Ветка:** `fix/launch-checks` от `main`. Зависит от: W0–W6 влиты; есть
развёрнутая среда или ветка Neon, похожая на production.

## Global Constraints

- Только 4 замера ниже. Бенчмарки функций, `memo` «на всякий случай», нагрузка
  в тысячи пользователей, кэш-слои — не делать.
- Порог нарушен → сначала причина (профиль, запрос, `EXPLAIN`), потом правка у
  владельца. Не поднимать пороги и таймауты.
- Тесты удаляются только из списка Task 3; ворота из списка «не трогать» остаются.
- Task 3 запуск не блокирует: начинается после PASS Tasks 1–2 и не смешивается с
  правками по замерам; не успели до запуска — остаток переносится в
  [AFTER-WAVES.md](../AFTER-WAVES.md).
- Замер на production — только чтение и тестовый лот на тестовом аккаунте
  основателя, после его разрешения; по умолчанию — ветка Neon + локальный образ.

## Review Focus

1. Посетитель по QR ждёт больше 5 секунд первый экран. → Task 1, замер 1.
2. При 50 одновременных ставках — 5xx или неверная итоговая цена. → Task 1, замер 2.
3. Главная/работа/автор на телефоне грузят мегабайты лишних картинок. → Task 1, замер 3.
4. Список работ делает запрос на каждую карточку. → Task 1, замер 4.
5. После чистки тестов пропал тест, который ловил реальную регрессию. → Task 3.

## Task 1: Четыре замера

| # | Что | Как | Порог «ок» | «Чинить до запуска» |
| --- | --- | --- | --- | --- |
| 1 | Холодный старт | остановить контейнер (`/_release/stop` основателем или рестарт образа локально), засечь время до первого ответа `GET /api/works/:publicId` и до первой отрисовки работы; 3 раза | ≤ 5 с до ответа API | > 8 с |
| 2 | 50 ставок одновременно | `scripts/perf/parallel-bids.mjs`: 50 тестовых покупателей, `Promise.all` HTTP-ставок по возрастающим суммам на один лот | 0 ответов 5xx; цена = максимум принятых; `bidCount` = строкам `bids`; p95 ≤ 1,5 с | любой 5xx или расхождение |
| 3 | Вес картинок и Lighthouse mobile | Chrome Lighthouse, режим Mobile (Slow 4G, CPU ×4), production-сборка (`pnpm build:web`), страницы: главная, работа, автор | LCP ≤ 2,5 с; Performance ≥ 70; картинки первого экрана ≤ 1,5 МБ | LCP > 4 с или картинка карточки > 2× отрисованного размера × DPR и > 300 КБ |
| 4 | N+1 и индексы | включить логирование запросов Prisma локально (временно, через `log: ['query']` в ветке замера, не коммитить), посчитать запросы на `GET /api/works`, `/api/authors`, `/api/portfolio/home`, `/api/works/:publicId`, `/api/works/:publicId/lot`, `/api/me/orders`, `/api/me/attention`; `EXPLAIN ANALYZE` для 3 самых медленных | число запросов не растёт с размером страницы; ≤ 10 на запрос; индексы используются | рост с размером страницы или `Seq Scan` по таблице > 10 000 строк в горячем запросе |

Повторяемые проверки commerce (без W6): Node 22, `pnpm build:api`;
для браузеров — `EXPO_NO_DOTENV=1 EXPO_PUBLIC_API_URL=http://127.0.0.1:13001
EXPO_PUBLIC_TURNSTILE_SITE_KEY=<публичный тестовый sitekey>` при
`pnpm --filter @bidplace/mobile build:web`. Затем с безопасно переданным
`INTEGRATION_DATABASE_URL` только для `127.0.0.1:55434/bidplace_integration`:
`pnpm --filter @bidplace/mobile test:e2e:commerce-live` (Chromium/WebKit) и,
отдельно от сборок/браузеров, `pnpm --filter @bidplace/api test:performance`.
Обычный `test:e2e` с reset для этого не используется. Нужны права создать/удалить
собственную схему; секреты в команды/документы не вставлять. API должен быть
собран; браузеры Playwright установлены. Никаких файлов из прежнего `/private/tmp`
harness не требуется. Торговые действия — реальный API/БД; только Turnstile-script
использует существующую test fixture. Контакты/жалобы/admin decision остаются у
`contacts`, `commerce-orders`, `commerce-reports` integration owners.

Performance-команда сохраняет условия до запросов и все три результата в
`apps/mobile/test-results/commerce-load/<run-id>/`: свежая схема, API-процесс
и 50 покупателей на прогон; setup/login/lot-read вне измерения, bid route cold,
конкурентность 50, время до полного тела ответа. `correctness` и `latency`
раздельны; p95 ≤1500 мс проверяется без округления, превышение даёт exit 1.
Все три прогона должны пройти; локальный PASS не является production evidence.
Live E2E и скриншоты — `apps/mobile/e2e/commerce-live.spec.ts` и
`apps/mobile/test-results/commerce-live/`; каждая схема удаляется в finally,
включая ошибку инициализации. Изменения времени/совместимости/восстановления
не входят в эту проверочную задачу (`DEC-153`).

### Latency: контролируемый стенд и следующий диагностический шаг

Перед новым приёмочным набором — три ресурсных среза с интервалом 15 с:
`uptime`, `iostat -c 2`, `vm_stat`, `sysctl vm.swapusage`, `memory_pressure -Q`;
только имена/CPU процессов, не argv/env. Нужны стабильная доступная память и
отсутствие активного paging/конкурирующих builds/tests/browser suites. Ненулевой
накопленный swap сам по себе не запрещает измерение; важны дельты swap-in/out и
компрессора. Чужие процессы не останавливать, настройки не менять. При активном
paging/неконтролируемом фоне — **ENVIRONMENT BLOCKED**, новые run 1–3 `NOT RUN`,
а не PASS/новый FAIL API. Не повторять шумный набор до смены условий.

Сохранить SHA и fingerprint скрипта, Node 22.20.0/pnpm 11.7.0/PostgreSQL 16.14,
режим сборки, host/VM CPU/RAM, container CPU/memory/I/O limits, фактическую ёмкость
Prisma pool и отсутствие URL overrides. Текущий default-capacity probe Prisma
6.19.3 объявил 17; это ёмкость, не число занятых соединений и не pool wait.
При ином стенде/пуле явно записать разницу, не подбирать параметры ради PASS.
Предыдущий стенд: host 8 CPU/16 GiB, Docker 8 CPU/12529836032 bytes, лимиты
контейнера 0 (не заданы). Новая среда должна быть выделена под измерение;
локальный PASS всё равно не production evidence.

Точная команда из чистого checkout без env/credential-файлов, после активации
Node 22.20.0/pnpm 11.7.0 и безопасной передачи `INTEGRATION_DATABASE_URL` только
для `127.0.0.1:55434/bidplace_integration` (CONNECT/CREATE своей схемы):

```sh
node --version
pnpm --version
pnpm build:api
# Дождаться завершения сборки и успешного ресурсного preflight.
pnpm --filter @bidplace/api test:performance
```

Прогрев/dataset/конкурентность сохраняются из существующего теста выше. Не
усреднять p95 и не заменять старый evidence новым. Каждый из трёх run должен
пройти correctness и p95 ≤1500 мс; неполный набор остаётся неполным.

Если превышение повторяется на пригодном стенде, отдельно от приёмки временно
инструментировать существующие `core/database/transaction.ts`,
`products/product-write-guard.ts` и `commerce/bids.service.ts` (без второго
framework и без изменения поведения):

| Интервал/метрика | Точная граница и ограничение вывода |
| --- | --- |
| Transaction startup | Перед `$transaction` → вход callback, по каждой попытке. Включает pool/BEGIN/driver scheduling; не называть чистым pool wait без отдельной engine-метрики. |
| Product-lock RTT | До/после именно `SELECT FOR UPDATE`. Весь `lockProductRowForUpdate` ещё сохраняет/восстанавливает lock_timeout: время helper не равно lock wait. |
| Транзакция/удержание | Вход/выход callback и settlement `$transaction`, по каждой попытке/outcome. Только для подтверждённого успешного commit: callback после lock-ack даёт нижнюю границу удержания, settlement минус начало lock-call — верхнюю. Для errors/timeouts/disconnect — только клиентские интервалы, без DB hold bounds. |
| Queries/round trips | По каждому transaction attempt: только проверенно привязанные count/duration и статические operation labels (eligibility/write/outbox/antifraud/present). Глобальный `PrismaService.queryCount` под 50 запросами не является счётчиком отдельной транзакции. |
| CPU/I/O | API CPU/event-loop, host paging/CPU, DB I/O и state/wait_event только собственных synthetic backend-процессов; cumulative BlockIO не является latency. |

PostgreSQL может освободить locks при abort до последующего завершения клиентского
callback/ROLLBACK; поэтому error-path не даёт таких границ ([PostgreSQL 16,
transaction abort](https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/access/transam/README)).
Монотонные интервалы считать внутри одного процесса; часы разных процессов не
вычитать. Не выводить SQL/params, cookies, контакты или credentials. `present`
вызван под транзакцией после записи и дополнительно читает participant label и
viewer eligibility; стоимость этих чтений пока не измерена. До controller также
есть session/rate-limit работа. Очередь одного product ожидаема и не доказывает
дефект. Если чистый pool wait либо per-transaction attribution недоступны,
сохранить ограничение, не подменять их оценкой по числу backend-процессов.

- [ ] **Шаг 1:** подготовить данные: сид + 200 работ и 20 лотов (скрипт в
  `scripts/perf/`, удаляется в конце, или флаг сида — `Ruling:`).
- [ ] **Шаг 2:** выполнить 4 замера, заполнить таблицу фактами (числа, скриншоты
  Lighthouse).
- [ ] **Шаг 3:** нарушенный порог → найти причину по PERFORMANCE-AUDIT §3, исправить
  у владельца, повторить замер. Каждая правка — отдельный коммит с числами до/после.
- [ ] **Шаг 4:** `scripts/perf/parallel-bids.mjs` оставить (повторяемая проверка),
  остальное удалить. Коммит `test: launch performance checks`.

## Task 2: Сквозной сценарий

**Files:** Modify: `apps/mobile/e2e/launch-smoke.spec.ts` (создан в W4 Task 11;
здесь — дополнить согласием с правилами W6 и чеком из W5, затем прогнать).

- [ ] Один тест, Chromium и WebKit, на 390: автор выставляет аукцион на 1 день →
  покупатель А ставит → покупатель Б без контактов попадает в форму контактов,
  заполняет и перебивает → время лота сдвигается в
  прошлое (фикстура) и вызывается тик → Б видит заказ, код и контакты автора →
  автор отмечает «Сделка состоялась» → на работе «Продано», у Б кнопка «Чек»;
  плюс фикс-цена: покупка → «Забронировано» → автор «Не состоялась» → работа
  снова в продаже. PASS 3 раза подряд → коммит `test: launch smoke scenario`.
- [ ] Тот же сценарий вручную на развёрнутой среде: Safari на реальном iPhone и
  Chrome на реальном Android (вход по коду, ставка, покупка, форма контактов с
  клавиатурой, ссылки `tel:`/`t.me`, «Поделиться»). Результат по устройствам — в
  отчёт; без устройства — `Needs verification`, не «готово».
- [ ] Репетиция для основателя на локальном стенде с сидом: пройти
  [OPERATIONS.md](../OPERATIONS.md) §3.1–§3.4 (жалоба, снятие страйка, тик
  остановлен и снова запущен, письмо `FAILED` → «Повторить»). Что не сработало
  как написано — исправить инструкцию или код, записать в отчёт.

## Task 3: Чистка тестов

Удалять/сжимать (каждый пункт — отдельный коммит, перед удалением убедиться,
что поведение проверено в оставшемся тесте; список «что чем покрыто» — в отчёт):

1. Визуальные e2e (`playwright.stabilization.config.ts` и figma/motion/chrome/header
   спеки, ~6 тыс. строк, 411 проверок геометрии): оставить по одному скриншоту
   на состояние экрана, удалить построчные проверки координат, дублирующие скриншот.
2. Characterization-спеки (`*.characterization.spec.ts`, ~1,3 тыс. строк) —
   там, где lifecycle-спеки того же экрана покрывают поведение.
3. `seller-profile-submit.spec.ts` (3,1 тыс. строк, 56 случаев) — `it.each` по
   полю/статусу; цель — минус половина строк при том же наборе случаев.
4. `product-draft-submit-lifecycle.spec.ts` — общие шаги в хелперы теста, случаи
   не удалять.
5. Auth-abuse в e2e (613 строк) — один браузерный тест; интеграция остаётся.
6. Playwright-конфиги: объединить те, что отличаются только портом/набором
   файлов, если скрипты CI не ломаются (`Ruling:` по каждому). Конфиги
   stabilization, motion, field-focus, sheet-local и reuse повторяют файлы
   основного набора; на них не ссылается ни один скрипт, кроме stabilization.
7. CI: после чистки — один невизуальный e2e-шард на `pull_request` (сейчас
   браузерные наборы только ручные: `browser-e2e.yml` 5, `portfolio-release-gate.yml` 3).
8. Мёртвое: шаги `verify.yml` для веток `feat/portfolio-mvp-legal-ux` и
   `feature/web-auth` (94, 122); `apps/mobile/e2e/run-close.mjs` (импортирует
   несуществующие модули); дубль `test:e2e:all`. Два известных глубоких импорта
   `usePreventRemove` (`AuthViewport.tsx` 3, `product-draft-navigation.ts` 3) свести в
   одну обёртку `src/lib/use-prevent-remove.ts`; запрет ESLint расширить на
   `expo-router/build/*` с исключением только этого файла через `overrides`
   (без `eslint-disable`).
9. Списки исключений `apps/mobile/.eslintrc.cjs`: убрать файлы, где нарушения уже
   нет (hex: `FilterSheet.tsx`, `AuthorShare.tsx`, `product-draft-story.tsx`;
   импорты: несуществующий `search-overlay-surface.tsx`, `product-draft-screen.tsx`,
   спеки без запрещённых импортов) и запрет `lucide-react-native` (зависимости
   нет). Удалить компоненты без потребителей — `OverlayDimmer`, `CreatorCard`,
   `AuthorAtmosphere`, `AuthorIdentity` (имена остались только в типе
   `ResilientRemoteImage.tsx` 30–39) — вместе с их style-файлами и спеками;
   перед удалением `rg` по `src` и `e2e`. Описание `CreatorCard` в
   `03-DESIGN-SYSTEM.md` остаётся — это макет, не код.

Не трогать: `auth-abuse.integration.spec.ts`, `social-auth.integration.spec.ts`,
`registration-consent.spec.ts`, `admin-moderation-pagination.integration.spec.ts`,
`products.service.spec.ts`, `sellers.service.spec.ts`, `images.service.spec.ts`,
`media-lifecycle.integration.spec.ts`, `commerce-races.integration.spec.ts`,
`launch-smoke.spec.ts`, save-race, route-guard, local-draft-restore.

- [ ] После каждого пункта: полный unit + затронутые e2e — PASS; в отчёт — строки до/после.

## Документы и проверки

### Task 4

- [ ] `11-PROJECT-STATUS.md`: таблица 4 замеров с числами и датой; тесты до/после.
  `12-PORTFOLIO-MVP-RELEASE-AUDIT.md`: строки gates по факту.
- [ ] Проверки: `pnpm verify` (или полный набор typecheck/lint/unit/integration/
  build); e2e основной конфиг; `git diff --check`; `pnpm docs:link-check`.
- [ ] Коммит `docs: record launch checks`.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка fix/launch-checks от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, docs/launch/PERFORMANCE-AUDIT.md и
целиком docs/launch/waves/W7-final-checks.md. Скиллы: implement, superpowers
executing-plans, verification-before-completion. Task 1 → Task 4. Только 4
замера; чинить только нарушенные пороги, у владельца, с числами до/после. На
production ничего не делать без разрешения основателя. Отчёт по AGENT-RULES §6
с таблицей замеров.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7 и docs/launch/waves/W7-final-checks.md.
Ревью ветки fix/launch-checks против main. Проверь: числа замеров воспроизводятся
(повтори замеры 2 и 4), правки исправляют причину, а не симптом; удалённые тесты
покрыты оставшимися (по списку из отчёта); ворота не тронуты. Вердикт по AGENT-RULES §7.
```

Красные флаги: поднятые пороги или таймауты; `memo`/`useCallback` массово без
профиля; новый кэш-слой; удалённые тесты из «не трогать»; закоммиченное
логирование запросов.
