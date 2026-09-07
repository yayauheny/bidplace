# bidplace — комплект публичных документов portfolio MVP

Дата: 2026-09-08
Статус: рабочий состав; drafts не публиковать до data inventory и проверки юристом Беларуси

## Документы первого запуска

| Документ | Текущий материал | Где нужен |
|---|---|---|
| Пользовательское соглашение сервиса | `drafts/01-user-agreement.md` требует удаления неактивной commerce semantics | Registration, footer |
| Политика персональных данных и cookies | `drafts/02-privacy-policy.md` требует фактических providers/data/countries | Registration, cookie notice, footer |
| Согласие/иной корректный control для ПДн | `drafts/03-pd-consent.md`; обязательность и цели подтверждает юрист | В точках, определённых purpose/legal-basis map |
| Правила автора и лицензия на материалы | `drafts/04-author-rules.md` адаптировать под profile/Work/moderation/share | Author application, Work submit, footer |
| Запрещённый контент и поведение | `drafts/06-prohibited.md` | Author application, Work submit, footer |
| Обращение пользователя/правообладателя | Короткий procedure/contact; не требует полного report workspace | Footer и moderation contact |

Auction/sale rules (`drafts/05-auction-and-sale-rules.md`) сохраняются, но не
публикуются как применимые правила первого MVP. Они вернутся в commerce wave после
обновления механик и legal review.

Email-marketing consent создаётся только при реальной добровольной рассылке и не
блокирует portfolio launch. Transaction contact rules отсутствуют, потому что First MVP
не создаёт Order и не раскрывает buyer/seller contacts.

## Controls первого MVP

- Registration: отдельные понятные строки/controls по результату purpose/legal-basis
  review; marketing отсутствует.
- Cookies: если фактически используются только essential cookies, короткое уведомление
  и ссылка; optional analytics/marketing не запускаются до выбора.
- Author application/Work submit: ссылка на author rules, content responsibility,
  license and prohibited content.
- Footer: agreement, privacy/cookies, author rules, prohibited content, operator details,
  support/rightsholder contact.

## Что должен содержать финальный пакет

- фактические реквизиты ИП и рабочие контакты;
- только реализованный portfolio flow;
- purpose/legal-basis/data/processor/retention map;
- cookies и providers, реально используемые production;
- version/evidence принятия там, где оно требуется;
- public/private поля профиля;
- лицензия на показ/share/promotional use и порядок отзыва;
- moderation, complaint/rightsholder and appeal procedure;
- правила удаления/скрытия Work и аккаунта.

## Порядок

1. Выполнить фактический data/provider/cookie inventory.
2. Закрыть First MVP section в `06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`.
3. Переписать drafts одной согласованной portfolio-редакцией.
4. Получить пакетную проверку юриста Беларуси.
5. Сверить каждый публичный текст и control с production UI/API.
