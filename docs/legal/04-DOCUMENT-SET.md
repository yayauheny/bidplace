# bidplace — комплект публичных документов MVP

Дата: 2026-09-06
Статус: рабочий состав; drafts не публиковать до адаптации и проверки юристом

## Семь документов

| Документ | Черновик | Где показывать |
|---|---|---|
| Пользовательское соглашение | [`drafts/01-user-agreement.md`](drafts/01-user-agreement.md) | Регистрация, footer |
| Политика персональных данных и cookies | [`drafts/02-privacy-policy.md`](drafts/02-privacy-policy.md) | Регистрация, cookie banner, footer |
| Согласие на обработку персональных данных | [`drafts/03-pd-consent.md`](drafts/03-pd-consent.md) | Точное обязательное место определит юрист после purpose map |
| Правила для авторов | [`drafts/04-author-rules.md`](drafts/04-author-rules.md) | Заявка автора, создание Work, включение продажи |
| Правила аукционов и продаж | [`drafts/05-auction-and-sale-rules.md`](drafts/05-auction-and-sale-rules.md) | Публикация продажи, первая ставка, fixed confirmation, offer actions |
| Запрещённые товары и поведение | [`drafts/06-prohibited.md`](drafts/06-prohibited.md) | Заявка/публикация, footer, правообладателям |
| Согласие на email-маркетинг | Ещё не создано | Только добровольная подписка; footer при включении marketing |

Email consent не блокирует MVP, если маркетинговой подписки и рассылки в продукте нет.
Файл создаётся до включения этой функции, а не как пустая ссылка.

## Короткие controls

- Registration: отдельные unchecked строки и отдельное 18+. Обязательность PD consent
  остаётся lawyer check; marketing отсутствует.
- Cookies: при only-essential режиме — уведомление и ссылка; при optional categories —
  `Принять все`, `Только необходимые`, `Настроить`.
- Первая ставка: сумма, обязанность купить при победе, rules link и подтверждение.
- Fixed: сумма и отдельное `Подтвердить покупку`.
- Offer buyer: `Это ещё не покупка`; seller: `Принять и создать сделку`.
- Contact: private deal context и объяснение цели раскрытия.

Полная матрица: [`../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md`](../research/2026-09-06-BELARUS-LEGAL-UX-PATTERNS.md).

## Что должен содержать финальный пакет

- фактические реквизиты оператора и рабочие контакты;
- только реализованные product flows;
- purpose/legal-basis/data/processor/retention map;
- версии документов и правила повторного принятия;
- порядок раскрытия контактов, удаления данных, жалоб и апелляций;
- точные правила аукциона, fixed, offer, невыкупа и повторной продажи;
- фактические cookies, providers и трансграничную передачу.

## Следующий шаг

Сначала выполнить data inventory и закрыть
[`06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).
Затем переписать drafts одной согласованной редакцией и отдать всю пачку юристу
Беларуси. Частичное одобрение отдельных абзацев не считается готовностью к публикации.
