# Промт 01 — выключить commerce fail-closed, сохранив код

Рекомендуемый исполнитель: сильный backend/full-stack агент.
Обязательные skills: `nest` и `security`.
Ветка: `feature/commerce-capability-gate`.

## Готовый промт

Ты работаешь в репозитории `/Users/yayauheny/projects/bidplace`. Реализуй пакет F01:
server-authoritative capability gate, который по умолчанию полностью выключает
commerce первого public MVP, сохраняя весь auction/bid/order/handoff код и тесты для
будущей ветки продукта. Не merge ветку и не создавай PR.
Начни с clean актуальной `main`, запиши её SHA и создай указанную feature branch.

### Цель и критерии успеха до реализации

Сначала кратко запиши план и критерии успеха. Успех означает:

- единственный канонический server config для commerce имеет production-safe default
  `false` и валидируется fail-closed;
- client navigation, deep links, кнопки и public cards не экспонируют auctions, bids,
  orders, prices, timers, cart, likes или handoff;
- прямые commerce API reads и mutations недоступны при выключенной capability;
- scheduler, realtime и background paths не создают и не продвигают commerce state;
- public discovery не зависит от Listing и не выдаёт commerce-only поля;
- существующие commerce modules, migrations и meaningful tests не удалены;
- commerce tests явно включают capability, а default-off tests доказывают изоляцию.

### Обязательное чтение

Прочитай `AGENTS.md`, `docs/product/00-PROJECT-INDEX.md`,
`01-PRODUCT-FOUNDATION.md`, `05-MVP-RFC.md`, `10-CODE-ARCHITECTURE.md`,
`11-PROJECT-STATUS.md`, `12-DECISION-LOG.md` (`DEC-082`–`DEC-084`),
`13-APPLICATION-SECURITY.md`, оба backlog и
`docs/audits/00-CURRENT-MVP-READINESS.md`. Затем проинвентаризируй routes, contracts,
clients, jobs и UI через `rg`; не исходи только из названий файлов.

Минимально проверь `apps/api/src/{bids,listings,orders,lifecycle,realtime,activity,admin,discovery}`,
`apps/api/src/app.module.ts`, `apps/api/src/core/config`, `packages/contracts`,
`packages/api-client`, `apps/mobile/src/app`, `apps/mobile/src/components/layout`,
`apps/mobile/src/features` и текущие e2e commerce tests.

### Сначала сравни решения

Перед кодом перечисли варианты и trade-offs:

- **Durable fix:** один типизированный capability config; server guards/service checks,
  job gating и client projection из того же публичного capability contract.
- **Acceptable workaround:** физически не подключать commerce modules в default-off
  deployment, только если это не ломает migrations/tests и прямые routes действительно
  отсутствуют.
- **Hack:** скрыть кнопки CSS, оставить API/jobs активными или разбросать несвязанные
  booleans — запрещено.

Выбери минимальный durable вариант. Зафиксируй точный HTTP/error contract выключенной
capability и покрой его тестами; не добавляй silent fallback.

### Реализация

1. Сделай полный inventory commerce entry points и добавь его в описание commit или
   в короткий docs evidence file, если он нужен для проверяемости.
2. Добавь типизированный config с default `false`. Используй имя env только как schema
   key; не открывай `.env` и не печатай значения.
3. Применяй gate на server boundary до выполнения бизнес-логики. Покрой reads,
   mutations, admin emergency commerce actions, websocket subscription/event paths и
   cron lifecycle.
4. Убери commerce controls и routes из доступной навигации первого MVP. Если старый URL
   открыт вручную, он должен безопасно завершаться согласованным unavailable/not-found
   состоянием без создания данных.
5. Отвяжи Home/Works/public Work projections от Listing. Не реализуй весь новый
   portfolio API из пакета 05, но default публичный ответ не должен утекать через
   commerce dependency.
6. Сохрани будущий код и тесты. В test helpers сделай включение commerce явным и
   локальным конкретному suite.

### Не входит

Не менять механику аукциона, ставки, Order/handoff, second chance, fixed sale или offer.
Не удалять commerce schema/migrations. Не начинать визуальный redesign, object storage
или Work revision model. Не менять Figma и `.pen`.

### Tests и проверки

Добавь значимые tests как минимум для: default-off config; прямой API access; admin
commerce actions; scheduler no-op; realtime suppression; public response без commerce;
explicit-on regression существующих commerce suites. Затем выполни:

```bash
pnpm db:generate
pnpm --filter @bidplace/contracts test
pnpm --filter @bidplace/contracts typecheck
pnpm --filter @bidplace/api test
pnpm --filter @bidplace/api test:integration
pnpm --filter @bidplace/api typecheck
pnpm --filter @bidplace/api lint
pnpm --filter @bidplace/mobile typecheck
pnpm --filter @bidplace/mobile lint
pnpm build
```

PostgreSQL checks выполняй только против disposable test DB вне sandbox. Если mobile
route behavior изменён, добавь и запусти узкий Playwright suite для default-off shell.

### Документация и Git

Обнови `docs/product/11-PROJECT-STATUS.md`; если изменился архитектурный invariant —
`10-CODE-ARCHITECTURE.md`; если изменился доступный flow — `docs/design/02-...` и
`04-DESIGN-STATUS.md`. Не переписывай RFC и decision log: решение уже принято.
Проверь `git diff --name-only -- '*.pen'` — вывод должен быть пустым.

Сделай один логический commit:

```text
implement feature:

* changed commerce capability to default-off
* added fail-closed boundary coverage
* updated runtime status documentation
```

Верни отчёт строго по формату из `00-EXECUTION-ORDER.md`, включая список всех gated
entry points и доказательство, что default-off не создаёт commerce state.
