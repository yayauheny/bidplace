# bidplace — roadmap на 24 месяца

Последнее обновление: 2026-09-08
Статус: Planned
Текущая граница: `DEC-082`–`DEC-084`

## 1. Ограничения

- один основной разработчик и небольшая ручная moderation;
- не более двух крупных целей одновременно;
- следующая волна начинается только после фактического gate;
- сдвиг вправо лучше запуска несвязанных функций одновременно.

## 2. Месяцы 0–3: публичное портфолио

### Цель

Авторы создают и распространяют полноценные публичные страницы с реальными Work.

### Scope

- email auth и recovery;
- application и moderation автора;
- профиль, structured public socials, about и optional achievements;
- Work draft/moderation/publication/hide;
- изображения, детали и text-only creation story;
- Home, Works, Authors, search и простые filters;
- share/copy и QR;
- portfolio legal pack;
- object storage, backup/restore, security и operations;
- mobile-first read-only Figma implementation.

### Gate

- минимум 5 одобренных авторов и реальные работы;
- несколько авторов самостоятельно закончили onboarding;
- реальные переходы по profile link/QR;
- нет critical privacy/security/content incident;
- авторы возвращаются обновлять Work либо понятна причина отказа.

## 3. Месяцы 4–6: улучшение creator value

Кандидаты выбираются по данным пилота:

- clickable tags;
- photo/text creation story;
- notification center;
- series/collections и ordering;
- reports/error feedback;
- creator analytics и social export.

Buyer accounts, likes/follow и collections появляются только при доказанной ценности.

## 4. Месяцы 7–9: commerce contract и controlled build

### Цель

Подготовить один согласованный commerce contour без публичного включения.

### Работы

- Work/Listing/Order/handoff domain contract;
- Belarus commerce legal pack;
- auction/fixed/offer decisions;
- double-sale, idempotency, snapshots and outcome events;
- contact disclosure and critical delivery;
- purchases/sales UI and admin exception flow;
- review текущего auction runtime перед повторным включением.

### Gate

Все mechanics, документы, UI states и abuse/race cases утверждены; capability остаётся
выключенной до controlled pilot.

## 5. Месяцы 10–12: первая commerce wave

Ограниченный pilot auction, fixed price и optional buyer offer. Деньги и доставка идут
напрямую между сторонами. Метрики: Listing→Order, contact reveal, contact success,
failed outcome, admin involvement, relist and repeat author.

Gate: несколько реальных завершённых попыток без double-sale/privacy incident и с
понятной операционной нагрузкой.

## 6. Месяцы 13–15: доверие и повторяемость

- reviews/ratings только из Order outcome;
- transaction chat, если внешний handoff создаёт проблемы;
- dispute workspace;
- creator analytics;
- stronger abuse controls;
- repeat listing and launch tooling.

## 7. Месяцы 16–18: монетизация сервиса

- optional creator subscription;
- billing provider и отдельные условия;
- scheduled publication, expanded limits, statistics, AI assistance;
- marked promotion;
- physical QR creator packs.

Оплата Work, escrow и комиссия не добавляются автоматически вместе с subscription.

## 8. Месяцы 19–21: quantity и новые форматы

Только после спроса:

- editions and sale units;
- drops;
- presale/made-to-order;
- services/commissions как отдельный contract.

## 9. Месяцы 22–24: расширение

Кандидаты:

- platform payments/escrow после отдельной financial architecture;
- delivery providers;
- currencies/languages/countries;
- curated discovery and recommendations на реальных данных.

## 10. Вне обязательного плана

AR/3D, visual search, crypto/NFT, financing, open resale, mass-market inventory,
lotteries and random draws.

## 11. Когда остановить расширение

- текущая волна не прошла gate;
- docs расходятся с code;
- растут moderation/privacy/security incidents;
- feature не усиливает ценность автора или Work;
- нет capacity на поддержку и recovery.
