# W2b — Антифрод одним модулем — план реализации

> **Для агентов:** выполнять через superpowers `subagent-driven-development`
> (рекомендуется) или `executing-plans`. Шаги — чекбоксы. Общие правила —
> [AGENT-RULES.md](../AGENT-RULES.md).

**Goal:** вся логика «может ли этот человек действовать» живёт в одном модуле
`apps/api/src/antifraud/`: защита входа (как сейчас), лимиты частоты в базе,
невидимый Turnstile, сигналы и временные блоки, бан. W3 добавляет в него правила
продаж (страйки, 3 брони, сигналы ставок), а не пишет свои.

**Architecture:** модуль Nest `AntifraudModule` — единственный владелец. Внутри:
`auth/` (перенесённый `auth-abuse` без изменения поведения), `rate-limit/`
(перенесённый `core/rate-limit`, счётчики в базе), `turnstile/`, `signals/`
(сигналы и блоки), `antifraud.policy.ts` — чистые функции с порогами (как
утилитный класс: без базы, с тестами), `antifraud.service.ts` — фасад для других
модулей. Остальной код зовёт только фасад и декоратор лимита.

**Spec:** [COMMERCE.md](../COMMERCE.md) §7, §14 (C13); `DEC-150`;
[TECH-DEBT.md](../TECH-DEBT.md) B4.

**Ветка:** `feature/antifraud-module` от `main`. Зависит от: W2 (тик), W1 можно
параллельно. До W3.

## Global Constraints

- Перенос — без изменения поведения: те же коды ошибок, тексты, лимиты, тесты.
  Сначала перенос (Task 1–2), потом новое (Task 3–4).
- Публичный вход в модуль — `AntifraudService` и `@RateLimit`; импорт
  внутренних файлов модуля снаружи запрещён правилом ESLint (`no-restricted-imports`
  по шаблону `**/antifraud/*/**`, исключение — сам модуль, через `overrides`).
- Пороги — именованные константы в `antifraud.policy.ts`, каждая с тестом на
  границе; нигде больше чисел антифрода нет.
- Автоблок — только при ≥ 2 сигналах **разных** видов за 24 ч; один сигнал —
  запись. Блок временный, снимает админ; постоянный бан ставит только админ.
- Невидимый Turnstile: на регистрации проверка обязательна (как сейчас), на
  покупке и первой ставке в сессии — провал только сигнал.
- Секреты не создавать и не читать; в `docs/ops/ENVIRONMENT.md` — только имена.
- Без новых зависимостей.

## Review Focus

1. После переноса вход, OTP и сброс пароля ведут себя побайтно как раньше. → Task 1, шаг 3.
2. Рестарт контейнера не обнуляет лимиты (перебор кодов после рестарта). → Task 2, шаг 1.
3. Обычный человек с одним провалом Turnstile не заблокирован. → Task 4, шаг 1.
4. Два параллельных сигнала не создают два блока. → Task 4, шаг 1.
5. Модуль продаж (W3) может проверить «можно ли ставить» одним вызовом в своей транзакции. → Task 4, интерфейс.

## Facts

- `apps/api/src/auth-abuse/`: `auth-abuse.module.ts`, `.service.ts`,
  `.store.ts` (таблицы `AuthAbuseOperation`, `AuthAbuseCounter`), `.policy.ts`,
  `turnstile-verifier.ts`, `client-ip.ts`, `disposable-email.ts`,
  `mail-outcome.ts`, `vendor/`; ~3,5 тыс. строк вместе с `core/rate-limit`.
  Потребители: `auth/` (4 файла), `otp/`, `password-reset/`, `app.module.ts`.
- `apps/api/src/core/rate-limit/`: `RateLimitService` — `Map` в памяти,
  `consume(key, limit, windowMs)` синхронный (6 прямых вызовов), `@RateLimit`
  + guard (19 мест). Потребители: `analytics`, `sellers`, `images`, `portfolio`,
  `password-reset`.
- Turnstile: env `TURNSTILE_SECRET_KEY`, `TURNSTILE_HOSTNAME`,
  `TURNSTILE_VERIFIER` (`core/config/env.ts` 74–76); клиент —
  `apps/mobile/src/features/auth/turnstile-widget.tsx` (видимый виджет, `render`
  со `size`). Режим «невидимый» задаётся у ключа в панели Cloudflare; тестовые
  ключи невидимого режима — по документации Cloudflare (проверить перед
  использованием).
- Статус пользователя меняет админ: `admin.controller.ts` `updateUserStatus` (213).
- Интеграционные тесты: `test/integration/auth-abuse.integration.spec.ts`,
  `social-auth.integration.spec.ts`, `abuse-request.ts`.

### Task 1: Перенос `auth-abuse` в `antifraud/auth`

**Files:** `git mv apps/api/src/auth-abuse apps/api/src/antifraud/auth`;
Create `apps/api/src/antifraud/antifraud.module.ts`, `antifraud.service.ts`;
Modify потребителей (импорты), `app.module.ts`, `apps/api/.eslintrc.cjs`.

- [ ] **Шаг 1:** перенести файлами (история сохраняется), `AntifraudModule`
  импортирует и реэкспортирует нынешний сервис; потребители импортируют из
  `antifraud`.
- [ ] **Шаг 2:** правило ESLint на внутренние пути модуля.
- [ ] **Шаг 3:** все существующие тесты входа (unit + `auth-abuse`,
  `social-auth`, `auth-transport` интеграция) зелёные без правки ожиданий.
- [ ] **Шаг 4:** коммит `refactor: move auth abuse into antifraud module`.

### Task 2: Лимиты частоты в базе

**Files:** `git mv apps/api/src/core/rate-limit apps/api/src/antifraud/rate-limit`;
миграция `rate_limit_counters(key VarChar(200) PK, window_start, count)`;
Modify потребителей.

**Interfaces:** `consume(key, limit, windowMs): Promise<boolean>` — один
атомарный `INSERT … ON CONFLICT DO UPDATE … RETURNING count` с обнулением
устаревшего окна; `@RateLimit` и guard — те же параметры. Старые строки чистит
задача тика `antifraud-cleanup` (окно старше суток).

- [ ] **Шаг 1: падающие тесты:** интеграция — лимит исчерпан, новый экземпляр
  сервиса (имитация рестарта) всё ещё отказывает; 20 параллельных `consume` при
  лимите 10 → ровно 10 `true`; окно истекло → снова можно.
- [ ] **Шаг 2:** реализовать; вызовы `consume` стали `await`; PASS.
  Переменные памяти `RATE_LIMIT_MAX_BUCKETS` и `RATE_LIMIT_CLEANUP_INTERVAL_MS`
  удалить из `env.ts`, `containerVariables`, `wrangler.jsonc` и
  [ENVIRONMENT.md](../../ops/ENVIRONMENT.md), если код их больше не читает.
- [ ] **Шаг 3:** коммит `feat: persist rate limits`.

### Task 3: Невидимый Turnstile

**Files:** Modify `antifraud/auth/turnstile-verifier.ts` (или перенести в
`antifraud/turnstile/`), `apps/mobile/src/features/auth/turnstile-widget.tsx` и
формы входа; Test рядом.

**Interfaces:** `verifyRequired(token, ip)` — как сейчас (регистрация, вход по
коду); `verifySignal(token, ip): Promise<'passed' | 'failed' | 'missing'>` — без
исключения, для продаж. Клиент: один хук `useInvisibleTurnstile()` →
`getToken(): Promise<string | null>`; виджет без видимой разметки, вызывается при
отправке формы.

- [ ] **Шаг 1: падающие тесты:** форма регистрации не рендерит видимого блока
  Turnstile; при отправке токен запрашивается; провал → текст «Попробуйте ещё
  раз», без поломки раскладки; `verifySignal` не бросает.
- [ ] **Шаг 2:** реализовать; e2e регистрации на 390 — раскладка без виджета.
- [ ] **Шаг 3:** в отчёт — действие основателя: в Cloudflare переключить
  виджет Turnstile в режим Invisible (или создать новый и заменить
  `TURNSTILE_SITE_KEY` и секрет `TURNSTILE_SECRET_KEY`) — строки в
  [ENVIRONMENT.md](../../ops/ENVIRONMENT.md). Имена переменных не меняются.
- [ ] **Шаг 4:** коммит `feat: invisible turnstile`.

### Task 4: Сигналы, временный блок, бан, фасад для продаж

**Files:** Create `antifraud/signals/` (+ миграция `fraud_signals(id, user_id,
kind, subject_id?, created_at)`, `purchase_holds(id, user_id, reason,
created_at, released_at?, released_by_id?, note?)` с частичным уникальным
индексом «один активный блок на пользователя»), `antifraud.policy.ts`; Modify
`antifraud.service.ts`, админ-контроллер (бан).

**Interfaces:**

```ts
type SignalKind = 'TURNSTILE_FAILED' | 'BID_BURST' | 'SHARED_BROWSER_WITH_SELLER' | 'NEW_ACCOUNT_BURST'
type ActorAction = 'bid' | 'purchase' | 'accept-offer'
class AntifraudService {
  recordSignal(tx, s: { userId: string; kind: SignalKind; subjectId?: string }): Promise<void> // 2 разных вида за 24 ч → блок + аудит
  assertCanAct(tx, userId: string, action: ActorAction): Promise<void>  // active, почта, нет блока; W3 добавляет контакты, страйки и 3 брони
  releaseHold(adminId, userId, note): Promise<void>
  banUser(adminId, userId, reason): Promise<void>                      // SUSPENDED + завершить сессии; W3 добавляет аннулирование ставок
}
// antifraud.policy.ts — чистые функции
shouldHold(kindsInWindow: SignalKind[]): boolean
detectBidBurst(bids: { listingId: string; at: Date }[], now: Date): boolean
```

- [ ] **Шаг 1: падающие тесты:** `it.each` по `shouldHold` (один вид ×3 → нет;
  два разных → да); `detectBidBurst` на границах порогов; интеграция — два
  параллельных `recordSignal` разных видов → ровно один активный блок;
  `assertCanAct` при активном блоке → `BUYER_BLOCKED` (код добавить в
  `packages/contracts/src/error.ts`); `banUser` без `reason` → 400, с причиной → статус
  `SUSPENDED`, сессии недействительны, `auditEvent` записан.
- [ ] **Шаг 2:** реализовать; PASS.
- [ ] **Шаг 3:** коммит `feat: antifraud signals, holds and ban`.

### Task 5: Документы и проверки

- [ ] `10-CODE-ARCHITECTURE.md` «Владельцы логики»: строка антифрода;
  `docs/ops/ENVIRONMENT.md` — переменные Turnstile; `TECH-DEBT.md` — B4 удалить;
  `11-PROJECT-STATUS.md` — запись.
- [ ] Проверки: `typecheck`/`lint` `@bidplace/api` и `@bidplace/mobile`; unit и
  интеграция API (вход, OTP, сброс, лимиты, сигналы); e2e регистрации;
  `git diff --check`; `pnpm docs:link-check`.
- [ ] Коммит `docs: record antifraud module`.

## Промпт исполнителю

```text
Работай в /Users/yayauheny/projects/bidplace, ветка feature/antifraud-module от main.
Прочитай AGENTS.md, docs/launch/AGENT-RULES.md, целиком docs/launch/waves/W2b-antifraud.md,
docs/launch/COMMERCE.md §7. Скиллы: implement, nest, security + superpowers
subagent-driven-development (или executing-plans), test-driven-development.
Task 1 → Task 5, один коммит на задачу. Перенос — без изменения поведения.
Секреты не создавать и не читать. Деплой не делать. Отчёт по AGENT-RULES §6.
```

## Промпт ревьюеру

```text
Прочитай docs/launch/AGENT-RULES.md §7 и docs/launch/waves/W2b-antifraud.md.
Ревью ветки feature/antifraud-module против main. Скиллы: code-review-best-practices,
security, nest. Прогони тесты входа и лимитов, проверь Review Focus. Вердикт по AGENT-RULES §7.
```

Инварианты: один владелец решений «можно ли действовать»; лимиты переживают
рестарт; автоблок только по двум разным сигналам; перенос не меняет поведение входа.

Красные флаги: проверки антифрода внутри `commerce`/`auth` в обход фасада; числа
порогов вне `antifraud.policy.ts`; постоянный бан автоматикой; видимый виджет
Turnstile; пустой `catch` вокруг проверки.
