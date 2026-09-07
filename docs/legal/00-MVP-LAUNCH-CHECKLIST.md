# bidplace — legal gate первого portfolio MVP

Дата: 2026-09-08
Статус: launch checklist; не юридическое заключение

Комплект: [`04-DOCUMENT-SET.md`](04-DOCUMENT-SET.md).
Вопросы: [`06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).

## Scope gate

- [ ] Commerce capability выключена на client/API/jobs; публичные тексты не обещают
      продажу, ставку, оплату или доставку.
- [ ] Public pages показывают только approved author/Work fields.
- [ ] Auth email, moderation data и private application fields не публикуются.
- [ ] Share/QR использует только публичную canonical URL.

## Data gate

- [ ] Составлен production inventory данных, целей, оснований, providers, стран и сроков.
- [ ] Проверены фактические cookies, analytics и third-party SDK.
- [ ] Object storage/email/hosting отражены в policy и contracts.
- [ ] Реализованы required acceptance/cookie evidence и удаление/retention procedure.

## Document gate

- [ ] User agreement описывает portfolio service, auth, moderation и availability.
- [ ] Privacy/cookie policy соответствует inventory.
- [ ] Отдельное PD consent используется только там, где подтвердил юрист.
- [ ] Author rules закрепляют content responsibility, license, share/QR и moderation.
- [ ] Prohibited content и правообладательский contact доступны из footer.
- [ ] Auction/sale rules не представлены как действующие правила First MVP.
- [ ] Реквизиты ИП, даты, версии и support contact заполнены.
- [ ] Весь пакет проверен юристом Беларуси одной согласованной редакцией.

## UI gate

- [ ] Registration controls имеют точные тексты и не содержат marketing bundling.
- [ ] Author application/Work submit ссылаются на актуальные author rules.
- [ ] Essential-only cookie notice соответствует фактическому режиму.
- [ ] Нет claims `проверенный автор`, `проверенная подлинность` или гарантий платформы.
- [ ] Error/rightsholder contact не собирает лишние персональные данные.

## Release evidence

- [ ] Version IDs/timestamps acceptance воспроизводимы.
- [ ] Withdrawal/deletion/moderation requests имеют рабочий process.
- [ ] Backup/restore и access controls для данных/медиа проверены.
- [ ] Final UI/API/document reconciliation не обнаружил commerce leakage.
