# bidplace — индекс канонической документации

Последнее обновление: 2026-10-12
Статус: Confirmed

Карта для агентов: [`../AGENT-MAP.md`](../AGENT-MAP.md).
Релиз portfolio MVP:
[`../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md`](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
Срез готовности (2026-09-08, частично устарел):
[`../audits/00-CURRENT-MVP-READINESS.md`](../audits/00-CURRENT-MVP-READINESS.md).
Архитектурные пробелы:
[`../audits/01-OPEN-ARCHITECTURE-GAPS.md`](../audits/01-OPEN-ARCHITECTURE-GAPS.md).
Исторические execution-пакеты First MVP:
[`../archive/tasks/`](../archive/tasks/).
Следующая волна — продажи, цены, аукционы, жалобы и отложенные улучшения:
[`15-POST-MVP-BACKLOG.md`](15-POST-MVP-BACKLOG.md).
Отложенные execution-задачи:
[`../archive/tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md`](../archive/tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md).
План адаптации backend заявки автора и истории:
[`../archive/tasks/2026-10-11-author-story-backend/PLAN.md`](../archive/tasks/2026-10-11-author-story-backend/PLAN.md).
Открытые решения: [`14-OPEN-MVP-DECISIONS.md`](14-OPEN-MVP-DECISIONS.md).
Юридический вход: [`../legal/README.md`](../legal/README.md).

## 1. Назначение набора

Этот каталог — единый источник правды о продукте bidplace. Документы должны позволить человеку или агенту быстро восстановить:

- зачем существует продукт;
- что не подлежит случайному пересмотру;
- как идея развивалась;
- что входит в MVP;
- куда движется продукт в течение двух лет;
- какие рыночные практики применимы;
- какие продавцы и предметы допускаются;
- как обеспечивается честность торгов;
- как код и дизайн поддерживают долгосрочное видение;
- что уже реализовано;
- какие решения были приняты и почему.

Документы не должны дублировать друг друга. Каждый тип информации имеет один документ-владелец. В остальных документах используется краткая ссылка.

## 2. Карта файлов

| Файл                                                         | Единственная зона ответственности                                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `00-PROJECT-INDEX.md`                                        | Навигация, правила чтения и обновления                                                                    |
| `01-PRODUCT-FOUNDATION.md`                                   | Неизменяемое ядро: ценность, миссия, границы, North Star                                                  |
| `02-PRODUCT-EVOLUTION.md`                                    | История появления идеи и хронология изменений                                                             |
| `03-CUSTDEV-TAISIA.md`                                       | Полный разбор первого интервью                                                                            |
| `04-MARKET-AND-COMPETITIVE-PLAYBOOK.md`                      | Что заимствовать у рынка и чего избегать                                                                  |
| `05-MVP-RFC.md`                                              | Точный portfolio-first контракт первого публичного MVP (`DEC-082`–`DEC-084`)                              |
| `06-ROADMAP-24-MONTHS.md`                                    | Волны развития на два года и переходные критерии                                                          |
| `07-GROWTH-AND-ADVERTISING-PLAYBOOK.md`                      | Реклама, контент и запуск авторов                                                                         |
| `08-SELLER-AND-ITEM-POLICY.md`                               | Кто может продавать и какие предметы допустимы                                                            |
| `09-TRUST-AND-AUCTION-INTEGRITY.md`                          | Честность ставок, provenance, приватность и расследования                                                 |
| `10-CODE-ARCHITECTURE.md`                                    | Фактическая архитектура, stack, contracts, persistence и технические границы                              |
| `11-PROJECT-STATUS.md`                                       | Часто меняющийся фактический статус кода                                                                  |
| `12-DECISION-LOG.md`                                         | Реестр решений, альтернатив, причин и условий пересмотра                                                  |
| `13-APPLICATION-SECURITY.md`                                 | Инженерная application security: auth, admin emergency, uploads, rate limits                              |
| `14-OPEN-MVP-DECISIONS.md`                                   | Оставшиеся внешние/продуктовые развилки первого MVP; сейчас product blockers отсутствуют                  |
| `15-POST-MVP-BACKLOG.md`                                     | Единый план следующей волны продаж: цены, аукционы, сделки, жалобы, UI и gates; остальные будущие функции |
| `analytics-contract.md`                                      | Identity, attribution, event naming and current product analytics events                                  |
| `analytics-metrics.md`                                       | Definitions and sources for admin dashboard metrics                                                       |
| `../design/00-DESIGN-INDEX.md`                               | Навигация по дизайн-принципам, flows, системе, статусу и handoff                                          |
| `../design-handoff/00-BRIEF.md`                              | Исторический бриф прежней commerce-волны; не текущий First MVP contract                                   |
| `../design-handoff/13-FOOTER-AND-COMPLAINT.md`               | Исторический commerce handoff; актуальные legal controls — в `../legal/`                                  |
| `../design-handoff/14-CABINET-LOGIC.md`                      | Исторический commerce handoff; не First MVP owner                                                         |
| `../00-WAVES.md`                                             | Две волны: portfolio MVP и сохранённый post-MVP/commerce scope                                            |
| `../legal/00-FINAL-LEGAL-AUDIT.md`                           | Единый юридический handoff: согласованные решения, данные, controls, сроки, вопросы и публикация          |
| `../legal/site/`                                             | Полные русские тексты для сайта; подключение отдельной задачей                                            |
| `../legal/deferred/05-commerce-and-future-features.md`       | Неактивное приложение будущих продаж, платежей, доставки и отзывов                                        |
| `../legal/archive/README.md`                                 | Консультация, закрытый вопросник и старые редакции; не текущие задачи                                     |
| `../archive/tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md` | Исторический execution backlog First MVP (архив)                                                          |
| `../archive/tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md`  | Сохранённые execution-задачи после MVP и commerce wave (архив)                                            |
| `../archive/tasks/2026-09-08-first-mvp/00-EXECUTION-ORDER.md`        | Восемь implementation/review пакетов First MVP (архив)                                                    |
| `../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md`        | Проверенные правовые опоры, рыночные patterns и legal UX matrix                                           |
| `../ops/00-RELEASE-AND-BACKUP.md`                            | Deploy, backup, restore drill и `pnpm verify` gate для пилота                                             |
| `../ops/CLOUDFLARE-DEPLOYMENT.md`                            | Portfolio Cloudflare staging/production: domains, secrets, migrations и smoke                             |
| `../audits/00-CURRENT-MVP-READINESS.md`                      | Главный текущий аудит готовности и блокеров                                                               |
| `../audits/01-OPEN-ARCHITECTURE-GAPS.md`                     | Нерешённые архитектурные пробелы, варианты и зависимости от решений                                       |
| `../research/README.md`                                      | Правила хранения сырого исследования                                                                      |
| `../research/raw/*`                                          | Архив исходных отчётов; не каноническое решение                                                           |

## 3. Минимальные пакеты чтения

### Любая задача

1. `00-PROJECT-INDEX.md`
2. `01-PRODUCT-FOUNDATION.md`
3. `11-PROJECT-STATUS.md`

### Реализация продуктовой функции

Дополнительно:

- `05-MVP-RFC.md`
- `06-ROADMAP-24-MONTHS.md`
- `10-CODE-ARCHITECTURE.md`
- релевантные решения из `12-DECISION-LOG.md`

### Подключение цен, аукционов или продаж после portfolio MVP

Сначала прочитать целиком `15-POST-MVP-BACKLOG.md`, включая карту §2 и порядок
полного ответа §10, затем `99-POST-MVP-BACKLOG.md` и указанные документы-владельцы.
Разделять принятые решения, фактический runtime и открытые механики. Нельзя
сводить задачу к показу цены или включению архивного commerce-кода.

### UI, экран или пользовательский маршрут

Дополнительно:

- `../design/00-DESIGN-INDEX.md`;
- `../design/01-DESIGN-FOUNDATION.md`;
- `../design/02-USER-FLOWS-AND-SCREENS.md`;
- `../design/03-DESIGN-SYSTEM.md`;
- `../design/04-DESIGN-STATUS.md`.

Для чистого handoff вместо полного набора достаточно `00`, нужного flow из `02`, системы из `03` и `05-DESIGN-HANDOFF.md`.

### Ставки, аукционы, пользователи, безопасность

Дополнительно:

- `09-TRUST-AND-AUCTION-INTEGRITY.md`
- `13-APPLICATION-SECURITY.md` — auth, admin emergency, upload hardening, rate limits
- `08-SELLER-AND-ITEM-POLICY.md`

### Public pilot и юридические материалы

Дополнительно:

1. [`../legal/00-FINAL-LEGAL-AUDIT.md`](../legal/00-FINAL-LEGAL-AUDIT.md) — весь текущий
   юридический handoff, включая условия публикации и единственный оставленный
   основателем вопрос об аналитике.
2. Нужный пользовательский текст из `../legal/site/`.
3. Для будущих функций — `../legal/deferred/05-commerce-and-future-features.md`.
4. Архив и raw источники — только при проверке происхождения/разночтения.

Не открывать закрытые вопросы заново и не считать архивный manifest текущим статусом.
Продуктовое согласование не является доказательством внедрения или заключением юриста.

### Позиционирование, реклама, запуск автора

Дополнительно:

- `04-MARKET-AND-COMPETITIVE-PLAYBOOK.md`
- `07-GROWTH-AND-ADVERTISING-PLAYBOOK.md`

### Пересмотр стратегии

Дополнительно:

- `02-PRODUCT-EVOLUTION.md`
- `03-CUSTDEV-TAISIA.md`
- `04-MARKET-AND-COMPETITIVE-PLAYBOOK.md`
- `12-DECISION-LOG.md`

Сырые исследования читаются только при проверке источника или спорного вывода.

## 4. Статусы

Продукт:

- `Confirmed` — принятое решение или надёжный факт.
- `Hypothesis` — требует пилота, интервью или проверки.
- `Planned` — принято в roadmap, но не реализовано.
- `Rejected` — сознательно отклонено.

Код:

- `Implemented`;
- `Partial`;
- `Not implemented`;
- `Needs verification`.

Нельзя заменять продуктовый статус статусом кода.

## 5. Принцип отсутствия дублирования

Для каждого тезиса определяется документ-владелец.

Примеры:

- «Главная идея — ценность» раскрывается только в `01-PRODUCT-FOUNDATION.md`.
- Точная механика ставки принадлежит `05-MVP-RFC.md`.
- Причина запрета искусственных ставок принадлежит `09-TRUST-AND-AUCTION-INTEGRITY.md`.
- Текущий статус реализации принадлежит `11-PROJECT-STATUS.md`.
- История принятия решения принадлежит `12-DECISION-LOG.md`.

В других файлах допускается одно предложение и ссылка:

> Искусственные ставки запрещены. См. `09-TRUST-AND-AUCTION-INTEGRITY.md`, раздел 3, и `DEC-011`.

## 6. Порядок изменений

### Код без изменения продукта

Обновить:

- `11-PROJECT-STATUS.md`;
- при необходимости `10-CODE-ARCHITECTURE.md`;
- при UI-изменении — соответствующий owner в `docs/design/`.

### Изменение продуктового поведения

Обновить:

- документ-владелец функции;
- `11-PROJECT-STATUS.md`;
- `12-DECISION-LOG.md`.

### Изменение стратегии

Обновить:

- `01-PRODUCT-FOUNDATION.md`;
- `02-PRODUCT-EVOLUTION.md`;
- `06-ROADMAP-24-MONTHS.md`;
- `12-DECISION-LOG.md`.

Требуется явное решение основателя.

### Отказ от идеи

Не удалять. Сохранить статус `Rejected`, причину и условие пересмотра.

## 7. Формат новой функции

```markdown
## Название функции

Status: Planned
Decision: DEC-XXX

### Задача

### Поведение

### Правила

### Данные

### Риски

### Проверка

### Не входит
```

## 8. Формат источников

В конце спорного тезиса:

- `Источник: решение основателя, 2026-07-18.`
- `Источник: custdev Taisia; одно интервью, не обобщать.`
- `Источник: внешний рыночный отчёт; требует проверки первоисточника.`
- `Источник: наблюдение пилота №N.`
- `Источник: метрика продукта, период ...`

Внешний отчёт не превращает вывод в `Confirmed`.

## 9. Каноническая структура

```text
/
├── AGENTS.md
└── docs/
    ├── product/
    │   ├── 00-PROJECT-INDEX.md
    │   ├── 01-PRODUCT-FOUNDATION.md
    │   ├── 02-PRODUCT-EVOLUTION.md
    │   ├── 03-CUSTDEV-TAISIA.md
    │   ├── 04-MARKET-AND-COMPETITIVE-PLAYBOOK.md
    │   ├── 05-MVP-RFC.md
    │   ├── 06-ROADMAP-24-MONTHS.md
    │   ├── 07-GROWTH-AND-ADVERTISING-PLAYBOOK.md
    │   ├── 08-SELLER-AND-ITEM-POLICY.md
    │   ├── 09-TRUST-AND-AUCTION-INTEGRITY.md
    │   ├── 10-CODE-ARCHITECTURE.md
    │   ├── 11-PROJECT-STATUS.md
    │   ├── 12-DECISION-LOG.md
    │   ├── 13-APPLICATION-SECURITY.md
    │   ├── 14-OPEN-MVP-DECISIONS.md
    │   └── 15-POST-MVP-BACKLOG.md
    ├── design/
    │   ├── 00-DESIGN-INDEX.md
    │   ├── 01-DESIGN-FOUNDATION.md
    │   ├── 02-USER-FLOWS-AND-SCREENS.md
    │   ├── 03-DESIGN-SYSTEM.md
    │   ├── 04-DESIGN-STATUS.md
    │   └── 05-DESIGN-HANDOFF.md
    ├── audits/
    │   └── 00-CURRENT-MVP-READINESS.md
    └── research/
        ├── README.md
        └── raw/
```
