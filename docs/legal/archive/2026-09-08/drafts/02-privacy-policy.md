# Политика персональных данных и cookies

Версия: `portfolio-draft-2026-09-08`  
Статус: `Prepared, external lawyer review pending`.

Оператор, адрес, support contact, hosting, email, storage, analytics providers, страны
обработки и сроки хранения заполняются только после factual production inventory.
Неизвестные значения не являются обещанием пользователю.

## Данные и цели

Сервис обрабатывает email, password hash, account status и verification/recovery records
для входа и безопасности; данные авторской заявки и профиля для moderation; фото, тексты
и metadata Work для portfolio page, share/QR и резервного восстановления; audit events
для безопасности и проверки moderation. Approved author profile и Work доступны
публично. Auth email, private moderation data и handoff contact публично не выдаются.

Основание, срок и способ удаления для каждой цели подтверждает юрист на основе
[`../09-PORTFOLIO-LEGAL-REVIEW-MANIFEST.md`](../09-PORTFOLIO-LEGAL-REVIEW-MANIFEST.md).

## Получатели и инфраструктура

В production media uses S3-compatible storage and service email uses an SMTP provider.
До выбора реальных providers их наименование, страна, договорные роли, срок и условия
трансграничной обработки остаются `UNKNOWN`. Сервис не обещает обработку в конкретной
стране до заполнения этой информации.

## Cookies

До staging inventory policy не утверждает набор cookies или analytics SDK. Если запуск
использует только essential auth/security cookies, текст notice и evidence подтверждает
юрист. Optional analytics или marketing не загружаются до отдельного правового и UI
решения.

## Обращения

Запрос на данные, исправление, ограничение, удаление или обращение правообладателя
направляется на фактический support contact после его публикации. Необходимые данные
заявителя, срок, порядок идентификации и retention определяет юрист.

Auction, sale, payment, delivery, buyer data and contact reveal do not belong to this
policy version.
