# W6 — Юридические тексты, удаление работ, эксплуатация — план реализации

> **Для агентов:** выполнять через superpowers `executing-plans` (задачи
> разнородные, часть — проверки и тексты). Шаги — чекбоксы. Общие правила —
> [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** к запуску продаж «Правила сделок» (текст — волна
[W6a](W6a-deal-rules-legal.md)) подключены в продукт с согласием, автор может
удалить свою работу (`DEC-123`) без потери истории
заказов, а внешние проверки эксплуатации (медиа, почта, бэкапы, расписание,
секреты) выполнены или переданы основателю списком с точными шагами.

**Architecture:** юридические документы — тот же механизм `legalDocumentIdSchema`
+ markdown из `docs/legal/site/`; новый документ «Правила сделок». Удаление
работы — пометка `deletedAt` (tombstone) через модуль публикации W1; заказы и
ставки хранят снимки и не теряются. Эксплуатация — чек-лист в
`docs/ops/00-RELEASE-AND-BACKUP.md`, без нового кода.

**Spec:** [COMMERCE.md](../COMMERCE.md) §1, §6.2, §8–9; `DEC-123`;
[00-FINAL-LEGAL-AUDIT.md](../../legal/00-FINAL-LEGAL-AUDIT.md);
[12-PORTFOLIO-MVP-RELEASE-AUDIT.md](../../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) (открытые gates).

**Ветка:** `feature/launch-readiness` от `main`. Факты проверены на `6720b7af`.
Зависит от: W3 (заказы), W4 (экраны), W6a (утверждённые тексты). Task 4
(эксплуатация) можно начинать сразу после W2b.

## Global Constraints

- Тексты не пишутся здесь: W6 подключает документы, которые основатель утвердил
  в W6a. Отдельной проверки юристом нет (`DEC-150`, C16); единственная пометка
  `[ЮРИСТ: …]` — срок хранения данных (L3).
- Формулировки — COMMERCE §1: посредник, не азартная игра, ставка — оферта.
- Аналитика собирается с запуска (`ANALYTICS_WEB_ENABLED=true`, решение
  основателя, риск правового основания принят); политика описывает её как есть.
- Удаление работы необратимо для автора, но не стирает: заказы, ставки, жалобы,
  аудит остаются; публичные копии медиа отзываются существующим `REVOKE`.
- Агент не входит в Cloudflare, Neon, SMTP, Turnstile — пишет точные шаги
  основателю и проверяет то, что видно снаружи (`curl`).

## Review Focus

1. Автор удаляет работу с активным лотом или открытым заказом — отказ `PRODUCT_IN_SALE`. → Task 2, шаг 1.
2. Покупатель после удаления работы автором видит свой заказ со снимком
   (название, обложка), а не 404 или пустую карточку. → Task 2, шаг 1.
3. Удалённая работа недоступна публично, включая прямую ссылку на фото после
   отзыва. → Task 2, шаг 1.
4. Первая ставка/покупка требует принять «Правила сделок» текущей версии. → Task 1, шаг 3.
5. Бэкап Neon реально восстанавливается (а не «включён»). → Task 4.

## Facts

- `packages/contracts/src/legal.ts`: `legalDocumentIdSchema` = `agreement`,
  `privacy`, `data-consent`, `author-rules`, `prohibited`; `registrationLegalSchema`
  с версиями. Тексты: `docs/legal/site/01…09-*.md`; черновик продаж —
  `docs/legal/deferred/05-commerce-and-future-features.md`.
  Найти, как API отдаёт markdown (`legal` модуль/сборка) и как хранится согласие.
- `DEC-123` (Confirmed, Not implemented): удаление своих работ в любом статусе,
  пометка удалённой, без каскада истории/файлов; нужен план конкуренции с
  модерацией, suspended, media/cache.
- Открытые gates release audit: live R2/CDN purge; recovery после остановки
  (закрывается W2 + проверка); Turnstile hostname/WAF и доставка SMTP; legal
  publication; backup+restore/rollback; устройства и доступность.
- Все переменные и секреты — [ENVIRONMENT.md](../../ops/ENVIRONMENT.md); ★ —
  обязательные к запуску. Значения агент не видит.

## Бэкенд

### Task 1: «Правила сделок» в продукте

**Files:**
- Uses: `docs/legal/site/05-deal-rules.md` и правки `01`/`02`/`04` из W6a (не
  переписывать; расхождение с COMMERCE — вопрос основателю)
- Modify: `packages/contracts/src/legal.ts` (`'deal-rules'`), модуль legal в API,
  модуль согласий, `apps/api/src/antifraud/` (`assertCanAct` проверяет
  согласие — один владелец допуска), `09-ui-legal-copy.md`
- Test: интеграция legal + commerce (согласие)

**Interfaces:**
- Produces: `POST /api/me/legal/deal-rules { version }` (или существующий маршрут
  согласий, если он общий — `Ruling:`); ошибка `DEAL_RULES_NOT_ACCEPTED` (403)
  на ставке, покупке, принятии, создании лота.

- [ ] **Шаг 1:** проверить, что W6a влита и основатель утвердил версию текстов;
  нет — остановиться и спросить.
- [ ] **Шаг 2:** подключить документ `deal-rules` в API и на `(public)/legal/[id]`
  с версией из W6a.
- [ ] **Шаг 3: падающие тесты:** без согласия текущей версии ставка/покупка/
  принятие/создание лота → `DEAL_RULES_NOT_ACCEPTED`; после согласия — проходит;
  новая версия правил снова требует согласия.
- [ ] **Шаг 4:** FAIL → реализовать → PASS; коммит `feat: deal rules consent`.

### Task 2: Удаление своей работы (DEC-123)

**Files:**
- Modify: `packages/database/prisma/schema.prisma` (`Product.deletedAt`), миграция;
  `apps/api/src/products/product-publication.ts` (переход «удалена»),
  `products.service.ts`, `products.controller.ts`, `public-visibility.ts`
  (удалённые не публичны), выборки кабинета, `MediaLifecycleService` (отзыв)
- Test: `apps/api/test/integration/product-delete.integration.spec.ts`

**Interfaces:**
- Produces: `DELETE /api/products/:id` → 204; `deleteProduct(tx, { productId, actor: 'author' })` в модуле публикации.

Требования из прежнего плана удаления (`git show 6720b7af:docs/archive/tasks/2026-10-19-account-ui/DELETE-BACKEND-PLAN.md`):
- транзакция и блокировка строки работы; проверка `deletedAt` под той же
  блокировкой у всех поздних писателей — решение модератора, история, медиа,
  сохранение, отправка (через модуль публикации W1 это одно место);
- любой статус работы, повторный DELETE идемпотентен (204), владелец, политика
  для неподтверждённой почты и `SUSPENDED`;
- исчезает из: кабинета, публичной работы, поиска, главной, фасетов, счётчиков,
  модерации и аналитики (кроме истории); выбор куратора на главной снимается в
  той же транзакции; воскрешение невозможно;
- отзыв и очистка кэша медиа через существующий lifecycle, приватный `SOURCE`
  и история без каскадного удаления; кэш публичного JSON (30 с на краю) — допустимая задержка;
- HTTP-матрица: гость, чужая, несуществующая, удалённая работа, владелец любого
  статуса, suspended/unverified, повтор DELETE;
- гонки на двух соединениях: удаление против одобрения, сохранения, отправки, загрузки.

- [ ] **Шаг 1: падающие тесты** (`it.each` по статусу работы: черновик, на
  модерации, одобрена, скрыта, отклонена): удаление владельцем → 204, работы нет в
  кабинете, каталоге, по прямой ссылке, фото после тика отозваны; чужая → 404;
  с лотом/открытым заказом → `PRODUCT_IN_SALE`; во время модерации — решение
  модератора после удаления → конфликт, не воскрешение; заказ покупателя по
  удалённой работе — карточка со снимком; автор `SUSPENDED` удалить может
  (`Ruling:` если код требует иного — вопрос основателю).
- [ ] **Шаг 2:** FAIL → реализовать → PASS; коммит `feat: delete own work`.

## Фронтенд

### Task 3: Согласие и удаление в интерфейсе

**Files:** Modify: `src/features/commerce/BidSheet.tsx`, `PurchaseDialog.tsx`,
`CreateLotSheet.tsx`, `OrderActions.tsx` (принятие предложения) — шаг согласия
при первой сделке, `src/lib/api-error-messages.ts`,
`owner-work-card.tsx` / экран работы автора (действие «Удалить» с подтверждением
«Работа исчезнет навсегда. История продаж сохранится»), `(public)/legal/[id].tsx`
(новый документ). Test: спеки, e2e.

- [ ] Падающие тесты: `DEAL_RULES_NOT_ACCEPTED` → показ правил и «Принимаю», затем
  повтор действия; удаление — подтверждение, после — работы нет в кабинете,
  переход в кабинет → реализовать → PASS → коммит `feat: deal rules prompt and work deletion ui`.

## Эксплуатация

### Task 4: Чек-лист запуска

**Files:** Modify: `docs/ops/00-RELEASE-AND-BACKUP.md` (единственный владелец
чек-листа), `docs/ops/CLOUDFLARE-DEPLOYMENT.md`.

- [ ] **Шаг 1:** раздел «Запуск продаж» — для каждого пункта: что сделать, кто
  (основатель), как проверить, ожидаемый результат:
  0. Пройти [ENVIRONMENT.md](../../ops/ENVIRONMENT.md): каждая ★ задана; список
     незакрытых ★ — первым пунктом отчёта. Отдельно и явно: `TICK_CRON` пуст —
     аукционы закрываются только пока контейнер не спит; при первых реальных
     аукционах поставить `*/5 * * * *`.
  1. Cloudflare: план Workers Paid, секреты и переменные по ENVIRONMENT.md
     (`INTERNAL_TICK_SECRET`, `SUPPORT_TELEGRAM_URL`, `SUPPORT_EMAIL`,
     невидимый ключ Turnstile).
  2. Медиа: CORS медиа-домена для `https://bid.place` (W5), live-проверка
     revoke/purge (gate F11/D08): скрыть работу → старый URL перестаёт отдаваться.
  3. Почта: SPF/DKIM/DMARC, тестовое письмо каждого обязательного вида на
     реальные ящики (Gmail, Яндекс, Mail.ru) — дошло, не в спаме.
  4. Turnstile: ключ в режиме Invisible, hostname `bid.place`, WAF не блокирует
     `/api/auth/*`; Bot Fight Mode выключен.
  5. Neon: PITR/бэкап включён; **восстановление в отдельную ветку Neon и
     проверка числа строк** `orders`, `bids`, `listings`; время восстановления записать.
  6. Откат: как вернуть предыдущий образ контейнера и что делать с миграцией продаж.
  7. Тик: открыть сайт, через минуту в логах ответ внутреннего таймера;
     `curl -i https://bid.place/api/internal/tick` → 404. После включения
     `TICK_CRON`: тестовый аукцион заканчивается без визитов на сайт → заказ
     и письмо победителю не позже чем через 10 мин, в Cloudflare → Cron Triggers
     есть запуски без ошибок.
  8. Монитор и поддержка — по [MONITORING-AND-SUPPORT.md](../MONITORING-AND-SUPPORT.md):
     UptimeRobot на главную (при пустом `TICK_CRON`; `/api/*` будит контейнер),
     пуш в приложении; ссылки поддержки открываются, письмо на почту поддержки доходит.
- [ ] **Шаг 2:** то, что проверяется снаружи без доступа (`curl` заголовков
  CORS, 404 тика, ответ `/api/health`), — выполнить и записать результат.
- [ ] **Шаг 3:** коммит `docs: launch operations checklist`.

## Документы и проверки

### Task 5

- [ ] `12-PORTFOLIO-MVP-RELEASE-AUDIT.md`: обновить строки gates (продажи в
  запуске, recovery через тик, удаление работ); `00-FINAL-LEGAL-AUDIT.md`:
  подключённые документы; `10-CODE-ARCHITECTURE.md`: tombstone;
  `11-PROJECT-STATUS.md`: запись.
- [ ] Проверки: `typecheck`, `lint`, unit, интеграция (legal, commerce, product-delete),
  e2e удаления и согласия; `git diff --check`; `pnpm docs:link-check`.
- [ ] Коммит `docs: record launch readiness`.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка feature/launch-readiness от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, docs/launch/COMMERCE.md и
целиком docs/launch/waves/W6-launch-legal-ops.md. Скиллы: implement, nest,
security, bidplace-ui + superpowers executing-plans, test-driven-development.
Task 1 → Task 5. Юридические тексты не переписывать — они из W6a. В облачные
кабинеты не входить. Отчёт по AGENT-RULES §6 + незакрытые ★ из
docs/ops/ENVIRONMENT.md + отдельный список действий основателю.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7 и docs/launch/waves/W6-launch-legal-ops.md.
Ревью ветки feature/launch-readiness против main. Скиллы:
code-review-best-practices, security. Проверь: тексты не обещают того, чего нет
(оплата, гарантии, доставка), нет слов азартных игр; удаление работы по таблице
Review Focus; чек-лист исполним человеком без догадок. Вердикт по AGENT-RULES §7.
```

Красные флаги: каскадное удаление заказов/ставок; публичность удалённой работы
через кэш; юридический текст, отличающийся от утверждённого в W6a; проверка
согласия вне `antifraud.assertCanAct`; секреты или их значения в документах.
