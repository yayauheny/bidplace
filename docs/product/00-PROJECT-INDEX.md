# bidplace — индекс канонической документации

Последнее обновление: 2026-09-08
Статус: Confirmed

Текущее состояние: [`../audits/00-CURRENT-MVP-READINESS.md`](../audits/00-CURRENT-MVP-READINESS.md).
Открытые архитектурные варианты:
[`../audits/01-OPEN-ARCHITECTURE-GAPS.md`](../audits/01-OPEN-ARCHITECTURE-GAPS.md).
Активные задачи:
[`../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md).
Отложенные задачи:
[`../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md`](../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md).
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

| Файл                                    | Единственная зона ответственности                                            |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `00-PROJECT-INDEX.md`                   | Навигация, правила чтения и обновления                                       |
| `01-PRODUCT-FOUNDATION.md`              | Неизменяемое ядро: ценность, миссия, границы, North Star                     |
| `02-PRODUCT-EVOLUTION.md`               | История появления идеи и хронология изменений                                |
| `03-CUSTDEV-TAISIA.md`                  | Полный разбор первого интервью                                               |
| `04-MARKET-AND-COMPETITIVE-PLAYBOOK.md` | Что заимствовать у рынка и чего избегать                                     |
| `05-MVP-RFC.md`                         | Точный portfolio-first контракт первого публичного MVP (`DEC-082`–`DEC-084`) |
| `06-ROADMAP-24-MONTHS.md`               | Волны развития на два года и переходные критерии                             |
| `07-GROWTH-AND-ADVERTISING-PLAYBOOK.md` | Реклама, контент и запуск авторов                                            |
| `08-SELLER-AND-ITEM-POLICY.md`          | Кто может продавать и какие предметы допустимы                               |
| `09-TRUST-AND-AUCTION-INTEGRITY.md`     | Честность ставок, provenance, приватность и расследования                    |
| `10-CODE-ARCHITECTURE.md`               | Фактическая архитектура, stack, contracts, persistence и технические границы |
| `11-PROJECT-STATUS.md`                  | Часто меняющийся фактический статус кода                                     |
| `12-DECISION-LOG.md`                    | Реестр решений, альтернатив, причин и условий пересмотра                     |
| `13-APPLICATION-SECURITY.md`            | Инженерная application security: auth, admin emergency, uploads, rate limits |
| `14-OPEN-MVP-DECISIONS.md`              | Оставшиеся внешние/продуктовые развилки первого MVP; сейчас product blockers отсутствуют |
| `15-POST-MVP-BACKLOG.md`                | Сохранённые будущие функции и условия возврата в работу                        |
| `analytics-contract.md`                 | Identity, attribution, event naming and current product analytics events     |
| `analytics-metrics.md`                  | Definitions and sources for admin dashboard metrics                          |
| `../design/00-DESIGN-INDEX.md`          | Навигация по дизайн-принципам, flows, системе, статусу и handoff             |
| `../design-handoff/00-BRIEF.md`         | Исторический бриф прежней commerce-волны; не текущий First MVP contract       |
| `../design-handoff/13-FOOTER-AND-COMPLAINT.md` | Исторический commerce handoff; актуальные legal controls — в `../legal/` |
| `../design-handoff/14-CABINET-LOGIC.md`  | Исторический commerce handoff; не First MVP owner                             |
| `../00-WAVES.md`                        | Две волны: portfolio MVP и сохранённый post-MVP/commerce scope               |
| `../legal/00-MVP-LAUNCH-CHECKLIST.md`   | Когда публиковать документы; не бриф дизайнеру                              |
| `../legal/02-LAWYER-ANSWERS-2026-08-24.md` | Фиксация встречи 24 августа (с наложением расшифровки 26 августа)         |
| `../legal/04-DOCUMENT-SET.md`            | Комплект portfolio MVP и отложенные commerce drafts                           |
| `../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md` | Нерешённые вопросы финальной проверки юристом Беларуси        |
| `../legal/08-BIDBAITS-SOURCE-MAPPING-2026-09-06.md` | Текущая карта использования материалов Bidbaits без копирования      |
| `../tasks/2026-09-06-reconciliation/00-FIRST-MVP-BACKLOG.md` | Активный execution backlog первого portfolio MVP                    |
| `../tasks/2026-09-06-reconciliation/99-POST-MVP-BACKLOG.md` | Сохранённые execution-задачи после MVP и commerce wave              |
| `../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md` | Проверенные правовые опоры, рыночные patterns и legal UX matrix |
| `../legal/drafts/*`                     | Рабочие черновики оферты и правил; не выкладка на прод                     |
| `../ops/00-RELEASE-AND-BACKUP.md`       | Deploy, backup, restore drill и `pnpm verify` gate для пилота              |
| `../audits/00-CURRENT-MVP-READINESS.md` | Главный текущий аудит готовности и блокеров                                   |
| `../audits/01-OPEN-ARCHITECTURE-GAPS.md` | Нерешённые архитектурные пробелы, варианты и зависимости от решений          |
| `../research/README.md`                 | Правила хранения сырого исследования                                         |
| `../research/raw/*`                     | Архив исходных отчётов; не каноническое решение                              |

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

- `../legal/02-LAWYER-ANSWERS-2026-08-24.md` — фиксация решений встречи 24 августа;
- `../legal/04-DOCUMENT-SET.md` — какие семь файлов, слои, галочки;
- `../legal/drafts/` — рабочие черновики; канон смысла остаётся в `02`;
- `../legal/00-MVP-LAUNCH-CHECKLIST.md` — когда выкладывать на сайт;
- `../legal/06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md` — только оставшиеся вопросы;
- `../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md` — размещение controls и граница между законом и рыночным pattern.

Эти файлы не являются юридической консультацией или подтверждением compliance.

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
