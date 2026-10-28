# bidplace — владельцы документации

Вход для задач: [AGENT-MAP](../AGENT-MAP.md). Этот индекс нужен для выбора owner,
а не для обязательного чтения каждого файла. Правила выполнения и обновления —
[AGENTS.md](../../AGENTS.md).

| Вопрос | Единственный owner |
| --- | --- |
| Ценность, миссия, границы | [01-PRODUCT-FOUNDATION](01-PRODUCT-FOUNDATION.md) |
| История продукта | [02-PRODUCT-EVOLUTION](02-PRODUCT-EVOLUTION.md) |
| Первое интервью | [03-CUSTDEV-TAISIA](03-CUSTDEV-TAISIA.md) |
| Рынок и конкурентные паттерны | [04-MARKET-AND-COMPETITIVE-PLAYBOOK](04-MARKET-AND-COMPETITIVE-PLAYBOOK.md) |
| Точный MVP (портфолио; продажи — `DEC-149` и COMMERCE) | [05-MVP-RFC](05-MVP-RFC.md) |
| Волны развития | [06-ROADMAP-24-MONTHS](06-ROADMAP-24-MONTHS.md) |
| Запуск авторов и рост | [07-GROWTH-AND-ADVERTISING-PLAYBOOK](07-GROWTH-AND-ADVERTISING-PLAYBOOK.md) |
| Допустимые авторы и предметы | [08-SELLER-AND-ITEM-POLICY](08-SELLER-AND-ITEM-POLICY.md) |
| Ставки, provenance, приватность и integrity | [09-TRUST-AND-AUCTION-INTEGRITY](09-TRUST-AND-AUCTION-INTEGRITY.md) |
| Архитектура, модели, контракты и persistence | [10-CODE-ARCHITECTURE](10-CODE-ARCHITECTURE.md) |
| Фактическая реализация | [11-PROJECT-STATUS](11-PROJECT-STATUS.md) |
| Решения, rationale, alternatives и revisions | [12-DECISION-LOG](12-DECISION-LOG.md), поиск по ID/теме |
| Auth, admin emergency, uploads, rate limits | [13-APPLICATION-SECURITY](13-APPLICATION-SECURITY.md) |
| Открытые продуктовые решения | [14-OPEN-MVP-DECISIONS](14-OPEN-MVP-DECISIONS.md) |
| Продажи: механика, данные, гонки (`DEC-149`) | [COMMERCE](../launch/COMMERCE.md) |
| План запуска по волнам, открытая работа | [Launch](../launch/README.md) |
| Функции после запуска | [15-POST-MVP-BACKLOG](15-POST-MVP-BACKLOG.md) |
| Владельцы компонентов и screen hooks | [17-COMPONENT-OWNERS](17-COMPONENT-OWNERS.md) |
| Контракт событий / метрики | [analytics-contract](analytics-contract.md) / [analytics-metrics](analytics-metrics.md) |
| Готовность релиза и проверки | [Release audit](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md) |
| Дизайн, responsive и состояния | [Design index](../design/00-DESIGN-INDEX.md) |
| Юридическая публикация | [Final legal audit](../legal/00-FINAL-LEGAL-AUDIT.md) |
| Release/backup/restore | [Operations](../ops/00-RELEASE-AND-BACKUP.md) |
| Удалённые планы, аудиты и архив | `git show 036d2cc4:<путь>` |

Перед продуктовой реализацией: foundation + нужные разделы RFC; архитектура и
решения — только по затронутой границе. Roadmap/growth/market не обязательны для
обычного исправления. UI: нужный flow только при изменении маршрута, design-system
по паттерну; статусы не заменяют live Figma и код.

Продажи: правила — только `../launch/COMMERCE.md`, работа — по файлу волны из
`../launch/waves/` и `../launch/AGENT-RULES.md`. Архивный commerce-код
(`archive/commerce-v1`) — справочник чистых функций, не основа модулей.

Legal: читать итоговый аудит, нужный текст `../legal/site/`, для будущих функций
`../legal/deferred/05-commerce-and-future-features.md`. Raw — только для
происхождения и разночтений. Закрытые вопросы не открывать заново; продуктовый
handoff не доказывает внедрение и не является заключением юриста.

Один тезис — один owner, в остальных файлах ссылка. Решение не выводится из кода
или сырого исследования. Статусы продукта: `Confirmed`, `Hypothesis`, `Planned`,
`Rejected`; статусы кода: `Implemented`, `Partial`, `Not implemented`,
`Needs verification`. Отклонённые идеи сохраняют причину и условие пересмотра.

Новый спорный вывод сопровождается источником и датой (решение основателя,
интервью, внешнее исследование, наблюдение пилота или период метрики); внешнее
исследование и одно интервью сами по себе не превращают гипотезу в `Confirmed`.
Исторические execution-пакеты и сентябрьские readiness-аудиты не являются текущей
очередью задач. Новые статусы — компактно, подробная приёмка — в owner audit.
