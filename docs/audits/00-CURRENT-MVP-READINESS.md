# bidplace — текущее состояние public MVP

Дата среза: 2026-09-07
Проверенный code baseline: `fix/figma-readonly-audit`, HEAD `beed3a0`
Текущая документация: `feature/mvp-decision-review`
Статус: текущий аудит; прежние датированные аудиты удалены из рабочего дерева и остаются в Git

## Итог

Закрытый локальный тест текущего аукциона возможен. Публичный MVP пока не готов:
в коде нет Work-first модели, прямой продажи и предложения цены; правила невыкупа
не выбраны; legal UX не реализован; публичные документы не адаптированы к фактической
инфраструктуре и не проверены юристом Беларуси; новый дизайн нельзя окончательно
подключить к отсутствующим server contracts.

## Подтверждённо закрыто

| Область | Результат |
|---|---|
| Product write atomicity | В HEAD находятся `e35a4f5` и follow-up `474ef07`: Product, media, story, scheduling и moderation используют общий row-lock invariant; race coverage добавлен. |
| Buyer Activity | `e3f1b99`: отмена больше не называется проигранной ставкой, Order выбирается детерминированно. |
| Binary hydration | Из известных list/moderation paths убрана загрузка полного photo blob; статус отражён в `11-PROJECT-STATUS.md`. |
| Figma inventory | Read-only аудит выполнен; оригинальный Figma не менялся. По статусу основателя основные прототипы готовы, кроме окончательной логики `Покупки / Продажи`. Визуальная готовность не заменяет отсутствующие fixed/offer contracts. |
| Marketplace и abuse research | Достаточно для выбора продуктовых вариантов: Work/Listing разделены, second chance является отдельным действием, self-bid блокируется, сетевые признаки не считаются доказательством, история остаётся неизменяемой. |
| Stress-test D01–D04 | Варианты проверены как одна модель сделки. Зафиксированы Work-level deal invariant, защита fixed/offer races, two-party/admin resolution и безопасный second chance. Это рекомендация, а не решение основателя. |
| Belarus legal UX research | Достаточно для проектирования мест controls, cookies, action confirmations, footer и audit evidence. Оно не заменяет финальную проверку юриста. |
| Решения основателя | Оператор и юридическая рамка — Беларусь, первая аудитория — Беларусь и Россия; BYN; Work-first; аукцион отдельно от fixed; offer только для fixed; деньги и доставка вне платформы; fixed подтверждает покупатель; принятый offer создаёт сделку. |

## Работа, которую можно брать сейчас

| Приоритет | Задача | Состояние | Исполнитель |
|---|---|---|---|
| P0 | Зафиксировать Work-first domain contract | Не выполнено; без него нельзя безопасно строить fixed и offer | GPT-5.6 Sol |
| P0 | Составить фактическую data/cookie/processor map | Не выполнено; блокирует legal drafts и consent implementation | Grok 4.6 High, review Sol |
| P1 | Интегрировать seller sales history | Код есть только на `fix/seller-sales-history` / `c3ef615`, в HEAD его нет | GPT-5.6 Sol review, затем перенос |
| P1 | Legacy HTTPS preflight | Strict schema существует, старые `http:` значения не проверены | Grok 4.6 High, review Sol |
| P1 | JWT role freshness | Guards могут доверять роли из ранее выданного токена | Grok 4.6 High, security review Sol |
| P2 | Lifecycle bounded progress | Batch 50 есть; нет доказательства `51 → 50 + 1`, решения poison-prefix и multi-instance policy | Grok 4.6 High, review Sol |
| P1 | Security/dependency evidence review | Самописный JWT и другие security-critical utilities не получили отдельного evidence review; запрос на сравнение с поддерживаемыми библиотеками не был оформлен задачей | Grok 4.6 High, security review Sol |
| P1 | Public-pilot operations readiness | Runbook существует, но его утверждения и реальные deploy/backup/email/TLS gaps не сверены заново | Grok 4.6 High, review Sol |

## Решения основателя, нужные до реализации сделок

Исследование не определяет один обязательный отраслевой вариант. До schemas и UI
нужно выбрать:

1. Offer: срок, возможность отзыва покупателем, counteroffer и судьба offer при
   параллельной fixed-покупке.
2. Невыкуп: срок связи, кто объявляет сделку несостоявшейся, напоминания и условия
   повторной продажи.
3. Second chance: отсутствует; либо отдельное предложение одному следующему
   участнику с его подтверждением, либо только новый Listing. Исходный результат
   никогда не переписывается, контакты всех участников автоматически не открываются.
4. Статусы передачи: кто может отметить `Связались` и `Передача завершена`, требуется
   ли подтверждение второй стороны.

Актуальные варианты находятся в
[`docs/product/14-OPEN-MVP-DECISIONS.md`](../product/14-OPEN-MVP-DECISIONS.md), а
совместимая рекомендация и последствия — в
[`docs/research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md`](../research/2026-09-06-MVP-DEAL-DECISION-STRESS-TEST.md).

## Открытые архитектурные пробелы

Полная карта вариантов хранится в
[`01-OPEN-ARCHITECTURE-GAPS.md`](01-OPEN-ARCHITECTURE-GAPS.md). До решения D01–D04 и
Work-first contract открыты девять связанных областей: Work-level защита от двойной
продажи, источники Order, двусторонний handoff outcome, second chance, immutable
history, evidence раскрытия контактов, durable notifications, граница Work/Listing и
отдельный complaint domain.

Самые опасные текущие расхождения:

- DB гарантирует один активный Order на Listing, но не на Work;
- fixed и accepted offer нельзя представить без обязательного `sourceBidId`;
- seller единолично ставит terminal handoff statuses;
- admin replacement создаёт новый Order до согласия runner-up;
- production-like чтение старых Orders может подменять snapshot живой карточкой.

Это зафиксированные пробелы, а не разрешение менять schema. Варианты и рекомендуемые
направления должны быть утверждены перед техническими задачами.

## Последовательность реализации

1. Принять четыре решения выше и утвердить Work-first contract.
2. Интегрировать seller history; закрыть HTTPS, role freshness и lifecycle residuals.
3. Реализовать Work без продажи и attach/relist Listing.
4. Реализовать fixed sale отдельным атомарным блоком.
5. Реализовать buyer offer отдельным блоком.
6. Реализовать non-payment/second chance по принятому решению.
7. Собрать data map; затем versioned acceptances, cookies и contact-disclosure audit.
8. Реализовать жалобы, text-only сообщение об ошибке, кабинет и уведомления.
9. Перенести изображения в S3-compatible storage и обновить backup/restore перед
   ожидаемой публичной нагрузкой.
10. Выполнить mobile-first redesign, затем 1024/1440 и полный state/accessibility QA.
11. Провести staging, race, email, consent, backup/restore и rollback rehearsal.

## Что не блокирует текущую работу

Подписка, встроенная оплата, доставка платформы, чат, отзывы, рейтинг, wishlist,
дропы, пресейл, другие валюты, AI-помощник, расширенный QR/social export и
автоматическое приложение session logs к сообщению об ошибке находятся после MVP.

## Текущие release blockers

- открытые продуктовые правила offer/non-payment/second chance;
- Work-first, fixed и offer server contracts;
- защита от двойной продажи и утечки контактов для новых flows;
- data/cookie/processor map и реализация legal evidence;
- адаптированный комплект документов и финальная проверка юриста Беларуси;
- complaint/support flow;
- кабинет `Покупки / Продажи` с полной историей;
- завершённый responsive redesign и release rehearsal.

## Проверка этого обновления

Изменялась только документация. Код и тесты приложения не запускались. `.pen` и
оригинальный Figma не изменялись.
