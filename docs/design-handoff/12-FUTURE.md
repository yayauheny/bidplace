# Волна 2 — после MVP

Полный owner: [`../product/15-POST-MVP-BACKLOG.md`](../product/15-POST-MVP-BACKLOG.md).
Этот файл нужен только дизайнеру: будущие функции не рисовать как доступные в MVP и
не добавлять disabled controls `Скоро`.

| Направление | Что понадобится в будущем |
|---|---|
| Подписка и продвижение | тарифы, лимиты, scheduled publication, analytics, маркировка продвижения |
| In-app уведомления | результат торгов, offer, handoff, second chance, настройки каналов |
| Чат, отзывы, рейтинг | transaction-bound flows, moderation, appeal, verified author |
| Общие жалобы | report на Work/автора, moderation queue, ответ пользователю |
| Likes и коллекции | сохранение работ, private/public collections, buyer profile |
| Расширенный автор | биография, годы, образование, выставки, серии, ручная сортировка |
| Share/QR | QR профиля и Work, short link, story frame, embed, физические tags/stickers |
| Presale/drops/тираж | количество, готовность, отдельные states и legal copy |
| Auction buyout/counteroffer | отдельная будущая state machine, не control текущего аукциона |
| Другие валюты и языки | contract currency, справочная конвертация, localization |
| AI | черновики карточки/профиля, категории, цена, фото и social copy |
| Платежи и доставка | отдельный checkout/escrow/logistics проект после legal/ops readiness |
| Услуги и мастер-классы | отдельная продуктовая гипотеза, не тип текущей Work |
| Диагностика ошибок | видимый пользователю context preview и optional screenshot |

Сейчас можно оставить композиционное место только там, где оно не меняет MVP flow.
Никакой будущий control не должен появляться в production без `DEC-*`, server contract,
legal/data review и обновления публичных документов.
