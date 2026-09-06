# bidplace — mapping материалов Bidbaits

Дата: 2026-09-06  
Статус: research mapping; не копировать как документы bidplace

## Источники

Вход включает предоставленные пользователем User Agreement, Personal Data
Consent, Privacy Policy, Cookies, buyer/seller advice, FAQ и rights-holder page.
Репозиторный архив находится в
[`../research/raw/2026-08-25-bidbaits-legal-documents.md`](../research/raw/2026-08-25-bidbaits-legal-documents.md).
Повторные вложения не создают новую юридическую версию без даты/источника сайта.

## Mapping

| Материал/pattern | Использовать как | Не переносить | Статус bidplace |
|---|---|---|---|
| User agreement structure | Checklist ролей, карточки, Order, delivery, liability, claims | ФИО/ИНН оператора РФ, ссылки, право РФ, собственные названия/сроки | Адаптировать под право Беларуси и фактический MVP; затем проверить у юриста |
| Privacy policy | Checklist data categories, purposes, processors, rights, contacts | Russia-only operator/localization assumptions и blanket consent | Нужен code-derived data map и provider countries |
| PD consent | Checklist identity, purposes, operations, withdrawal | Consent «на всё и навсегда», если обработка идёт по договору/закону | Юрист определяет legal basis по каждой цели |
| Cookies | Перечень технических и analytics data | «Продолжая использовать» как универсальный consent | Controls зависят от фактического cookie inventory; см. legal UX research |
| Fixed order | Карточка → confirmation → кабинет → contact exchange | Их public-offer wording и отказ seller без проверки по праву Беларуси | Отдельное buyer confirmation создаёт сделку (`DEC-078`) |
| 48h contact | Candidate SLA и reminder pattern | Считать 48h отраслевым законом | Research + lawyer question |
| Non-payment/relist | Cancelled history, reminders, relist from original work | Automatic relist без product/audit decision | Portfolio-first model подходит как основа |
| Seller/buyer advice | Help-center checklist fraud/delivery safety | Гарантии, рейтинг и onsite chat, которых нет | После core MVP как safety content |
| Reviews/rating | Transaction-bound review pattern | Перенос рейтинга и «надёжный» badge без verification | After MVP |
| Rights holders | Dedicated report route, URL/evidence fields, prompt response | Обещание one business day без staffing/SLA | Complaint flow before launch; SLA lawyer/ops |
| Chat evidence | On-platform evidence helps dispute review | Копировать arbitration policy при отсутствии chat | Chat after MVP |
| Delivery | Seller declares methods/cost/limits; recommend evidence/insurance | Tracking, carrier integration, platform responsibility claims | Card fields MVP; platform delivery excluded |
| Auction history | Deterministic winner and bid history | Их auction engine rules, auto-bids, cancellation freedom | Compare against server contract |
| Seller status | Earned trust signal | Purchased/transferred reputation | Verification/rating later |

## Главный вывод

Bidbaits показывает, какие реальные сценарии появятся: невыход на связь,
отмена, повторная публикация, повреждение доставки, IP complaint, negative review
dispute. Для bidplace это backlog и research evidence. Ни один их текст не закрывает
вопрос применимого права, next bidder или ответственности. Беларусь, BYN и product
outcomes fixed/offer зафиксированы в `DEC-076`–`DEC-078`. Текущий UX и оставшиеся
юридические вопросы находятся в
[`../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md`](../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md)
и [`06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).
