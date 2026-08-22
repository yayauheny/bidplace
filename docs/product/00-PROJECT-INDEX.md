# bidplace — индекс канонической документации

Последнее обновление: 2026-07-18  
Статус: Confirmed

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
| `05-MVP-RFC.md`                         | Точный контракт первой рабочей версии и пилота                               |
| `06-ROADMAP-24-MONTHS.md`               | Волны развития на два года и переходные критерии                             |
| `07-GROWTH-AND-ADVERTISING-PLAYBOOK.md` | Реклама, контент и запуск авторов                                            |
| `08-SELLER-AND-ITEM-POLICY.md`          | Кто может продавать и какие предметы допустимы                               |
| `09-TRUST-AND-AUCTION-INTEGRITY.md`     | Честность ставок, provenance, приватность и расследования                    |
| `10-CODE-ARCHITECTURE.md`               | Фактическая архитектура, stack, contracts, persistence и технические границы |
| `11-PROJECT-STATUS.md`                  | Часто меняющийся фактический статус кода                                     |
| `12-DECISION-LOG.md`                    | Реестр решений, альтернатив, причин и условий пересмотра                     |
| `13-APPLICATION-SECURITY.md`            | Инженерная application security: auth, admin emergency, uploads, rate limits |
| `analytics-contract.md`                 | Identity, attribution, event naming and current product analytics events     |
| `analytics-metrics.md`                  | Definitions and sources for admin dashboard metrics                          |
| `../design/00-DESIGN-INDEX.md`          | Навигация по дизайн-принципам, flows, системе, статусу и handoff             |
| `../legal/00-MVP-LAUNCH-CHECKLIST.md`   | Открытые юридические вопросы и minimum checklist до real pilot в Беларуси    |
| `../ops/00-RELEASE-AND-BACKUP.md`       | Deploy, backup, restore drill и `pnpm verify` gate для пилота              |
| `../audits/*`                           | Датированные исторические снимки аудитов; не текущий источник истины         |
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

### Real pilot и юридические материалы

Дополнительно:

- `../legal/00-MVP-LAUNCH-CHECKLIST.md`.

Этот файл фиксирует scope и открытые вопросы для legal review; он не является юридической консультацией или подтверждением compliance.

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
    │   └── 12-DECISION-LOG.md
    ├── design/
    │   ├── 00-DESIGN-INDEX.md
    │   ├── 01-DESIGN-FOUNDATION.md
    │   ├── 02-USER-FLOWS-AND-SCREENS.md
    │   ├── 03-DESIGN-SYSTEM.md
    │   ├── 04-DESIGN-STATUS.md
    │   └── 05-DESIGN-HANDOFF.md
    ├── audits/
    └── research/
        ├── README.md
        └── raw/
```
