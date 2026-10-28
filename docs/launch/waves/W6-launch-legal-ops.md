# W6 — Юридические тексты, удаление работ, эксплуатация — план реализации

> **Для агентов:** выполнять через superpowers `executing-plans` (задачи
> разнородные, часть — проверки и тексты). Шаги — чекбоксы. Общие правила —
> [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** к запуску продаж тексты правил готовы для юриста и подключены в
продукт, автор может удалить свою работу (`DEC-123`) без потери истории
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
Зависит от: W3 (заказы), W4 (экраны). Task 4 (эксплуатация) можно начинать
сразу после W2.

## Global Constraints

- Юридические тексты агент готовит как черновик «для юриста»: пометки
  `[ЮРИСТ: …]` на каждом спорном месте. Публикация — только после решения
  основателя (`AGENTS.md`: юридические формулировки — его решение).
- Формулировки — COMMERCE §1: посредник, не азартная игра, ставка — оферта.
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
- Секреты и переменные, которые появятся к запуску: `INTERNAL_TICK_SECRET` (W2),
  `SUPPORT_TELEGRAM_URL` (W3/W4). Значения агент не видит.

## Бэкенд

### Task 1: «Правила сделок» в продукте

**Files:**
- Create: `docs/legal/site/05-deal-rules.md` (из `deferred/05-…`, переписан под COMMERCE)
- Modify: `packages/contracts/src/legal.ts` (`'deal-rules'`), модуль legal в API,
  модуль согласий, `commerce-guards.ts` (`assertBuyerEligible` проверяет
  согласие), `docs/legal/site/01-user-agreement.md`, `02-privacy-policy.md`
  (передача контактов второй стороне заказа), `09-ui-legal-copy.md`,
  `docs/legal/README.md`; удалить `docs/legal/deferred/05-…` после переноса
- Test: интеграция legal + commerce (согласие)

**Interfaces:**
- Produces: `POST /api/me/legal/deal-rules { version }` (или существующий маршрут
  согласий, если он общий — `Ruling:`); ошибка `DEAL_RULES_NOT_ACCEPTED` (403)
  на ставке, покупке, принятии, создании лота.

- [ ] **Шаг 1:** текст «Правил сделок»: роли, лот, ставка-оферта и
  неотменяемость, бронь, сроки 48 ч / 14 дней, следующий участник, страйки и
  блокировка, жалобы и поддержка, что bidplace не делает (деньги, доставка,
  гарантии), обработка контактов. Каждое спорное место — `[ЮРИСТ: …]`.
- [ ] **Шаг 2:** правки соглашения и политики: контакты сторон заказа,
  сроки хранения заказов, письма по сделкам как обязательные уведомления.
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
`CreateLotSheet.tsx` (шаг согласия при первой сделке), `src/lib/api-error-messages.ts`,
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
  1. Cloudflare: план Workers Paid, Cron Trigger виден в дашборде, секреты
     `INTERNAL_TICK_SECRET`, переменная `SUPPORT_TELEGRAM_URL`.
  2. Медиа: CORS медиа-домена для `https://bid.place` (W5), live-проверка
     revoke/purge (gate F11/D08): скрыть работу → старый URL перестаёт отдаваться.
  3. Почта: SPF/DKIM/DMARC, тестовое письмо каждого обязательного вида на
     реальные ящики (Gmail, Яндекс, Mail.ru) — дошло, не в спаме.
  4. Turnstile: hostname `bid.place`, WAF не блокирует `/api/auth/*`.
  5. Neon: PITR/бэкап включён; **восстановление в отдельную ветку Neon и
     проверка числа строк** `orders`, `bids`, `listings`; время восстановления записать.
  6. Откат: как вернуть предыдущий образ контейнера и что делать с миграцией продаж.
  7. Тик: через 2 минуты после деплоя в логах ответ тика; `curl -i https://bid.place/api/internal/tick` → 404.
- [ ] **Шаг 2:** то, что проверяется снаружи без доступа (`curl` заголовков
  CORS, 404 тика, ответ `/api/health`), — выполнить и записать результат.
- [ ] **Шаг 3:** коммит `docs: launch operations checklist`.

## Документы и проверки

### Task 5

- [ ] `12-PORTFOLIO-MVP-RELEASE-AUDIT.md`: обновить строки gates (продажи в
  запуске, recovery через тик, удаление работ); `00-FINAL-LEGAL-AUDIT.md`: новые
  документы и открытые вопросы юристу; `10-CODE-ARCHITECTURE.md`: tombstone;
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
Task 1 → Task 5. Юридические тексты — черновик с пометками [ЮРИСТ: …], не
публиковать как окончательные. В облачные кабинеты не входить. Отчёт по
AGENT-RULES §6 + отдельный список действий основателю.
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
через кэш; юридический текст без пометок для юриста; секреты или их значения в
документах.
