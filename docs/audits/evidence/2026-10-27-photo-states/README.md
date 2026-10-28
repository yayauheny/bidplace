# Фото — состояния для анализа

86 PNG, Chromium и WebKit. Откройте [index.html](index.html) для просмотра всей подборки.
Папки `chromium/` и `webkit/` содержат оригинальные снимки без обрезки и ретуши.
`manifest.json` содержит состояние, фактический размер viewport и SHA-256 каждого PNG.

## Происхождение

- Runtime: `feature/photo-workflow`, `804fe830`; при съёмке менялся только E2E-сценарий, код приложения не менялся.
- Node 22.20.0, локальные Chromium/WebKit; API и PostgreSQL настоящие, R2/CDN заменены media-server transport double.
- Тестовые фотографии Work/автора; для лимита 10 используются пять изображений с разными исходными байтами. Это не обещание визуальной дедупликации.
- Ошибки обработки: одноразовая ошибка canvas.toBlob. Ошибка загрузки: HTTP 503 для одного файла; остальные идут дальше.
- Ошибка порядка: HTTP 503 на PATCH images/order; отправка/сохранение удерживаются request gate для воспроизводимого снимка.
- Основной viewport 390×874; короткий — 390×600. Пустая сетка/редактор — также 1024/1440. Ошибка upload — также 320/414/440/1024/1440. Это проверка устойчивости, не Figma parity широких экранов.
- Скрыт только служебный Expo toast; UI приложения не подменяется. OS status bar не нарисован.

## Что оценивать

Иерархию, отступы, рамки/иконки, состояние CTA, ошибки, читаемость и доступность последнего ряда над CTA.
Часть баннеров в длинной сетке находится ниже первого экрана: смотрите также `last-row-*`.
Отключённые действия во время отправки, четыре шага и отсутствие нарисованного OS status bar — принятые решения.
Фото-иконка — утверждённый карандаш без нижней черты.

## Ограничения

Это широкий набор воспроизводимых Web-состояний, не все математические сочетания данных.
Нет Native, 200% browser zoom, тёмной темы/всех тем, системного file picker, разрешений ОС, HEIC на устройстве и live CDN.
Не сняты отдельно все коды ошибок API, потерянный ответ/expiry сессии, конфликт revisions, каждый промежуточный кадр обработки и каждый gesture.
Поведение и доступность нельзя подтвердить одними PNG; исходные browser-сценарии находятся в work-media-lifecycle.spec.ts.
Не интерпретировать браузерные снимки как принятие Native/production или архитектурную проверку.

## Файлы

| Браузер | Состояние | Размер | PNG |
| --- | --- | --- | --- |
| chromium | После перезагрузки: только принятые сервером фото | 390×874 | [chromium/after-reload-server-gallery-390.png](chromium/after-reload-server-gallery-390.png) |
| chromium | Все 10 фото и порядок подтверждены сервером | 390×874 | [chromium/all-saved-390.png](chromium/all-saved-390.png) |
| chromium | Редактор аватара: круглая область | 390×874 | [chromium/avatar-390.png](chromium/avatar-390.png) |
| chromium | Редактор аватара: ошибка обработки | 390×874 | [chromium/avatar-processing-error-390.png](chromium/avatar-processing-error-390.png) |
| chromium | Редактор аватара: поворот | 390×874 | [chromium/avatar-rotated-390.png](chromium/avatar-rotated-390.png) |
| chromium | Профиль после успешного повторного сохранения аватара | 390×874 | [chromium/avatar-saved-390.png](chromium/avatar-saved-390.png) |
| chromium | Подтверждение отбрасывания при закрытии | 390×874 | [chromium/discard-confirmation-390.png](chromium/discard-confirmation-390.png) |
| chromium | Отклонён точный дубликат исходного файла | 390×874 | [chromium/duplicate-390.png](chromium/duplicate-390.png) |
| chromium | Редактор Work: Кадрировать | 1024×874 | [chromium/editor-1024.png](chromium/editor-1024.png) |
| chromium | Редактор Work: Кадрировать | 1440×874 | [chromium/editor-1440.png](chromium/editor-1440.png) |
| chromium | Редактор Work: Кадрировать | 390×874 | [chromium/editor-390.png](chromium/editor-390.png) |
| chromium | Редактор Work: поворот и отражение | 390×874 | [chromium/editor-flipped-390.png](chromium/editor-flipped-390.png) |
| chromium | Редактор Work: фокус рамки с клавиатуры | 390×874 | [chromium/editor-keyboard-focus-390.png](chromium/editor-keyboard-focus-390.png) |
| chromium | Редактор Work: режим Оригинал | 390×874 | [chromium/editor-original-390.png](chromium/editor-original-390.png) |
| chromium | Редактор Work: ошибка обработки, настройки сохранены | 390×874 | [chromium/editor-processing-error-390.png](chromium/editor-processing-error-390.png) |
| chromium | Редактор Work: сброс к состоянию открытия | 390×874 | [chromium/editor-reset-390.png](chromium/editor-reset-390.png) |
| chromium | Редактор Work: поворот на 90° | 390×874 | [chromium/editor-rotated-390.png](chromium/editor-rotated-390.png) |
| chromium | Пустая сетка | 1024×874 | [chromium/empty-1024.png](chromium/empty-1024.png) |
| chromium | Пустая сетка | 1440×874 | [chromium/empty-1440.png](chromium/empty-1440.png) |
| chromium | Пустая сетка | 390×874 | [chromium/empty-390.png](chromium/empty-390.png) |
| chromium | Частичный успех: низ сетки, короткий экран 600px | 390×600 | [chromium/last-row-600.png](chromium/last-row-600.png) |
| chromium | Частичный успех: низ сетки, экран 874px | 390×874 | [chromium/last-row-874.png](chromium/last-row-874.png) |
| chromium | Лимит 10 фото: низ сетки | 390×874 | [chromium/last-row-limit-ten-390.png](chromium/last-row-limit-ten-390.png) |
| chromium | Пять фото: низ сетки, короткий экран 600px | 390×600 | [chromium/last-row-long-600.png](chromium/last-row-long-600.png) |
| chromium | Пять фото: низ сетки, экран 874px | 390×874 | [chromium/last-row-long-874.png](chromium/last-row-long-874.png) |
| chromium | Ошибка сохранения порядка: баннер внизу сетки | 390×874 | [chromium/last-row-order-save-error-390.png](chromium/last-row-order-save-error-390.png) |
| chromium | Достигнут лимит 10 фото: верх сетки | 390×874 | [chromium/limit-ten-390.png](chromium/limit-ten-390.png) |
| chromium | Одно локальное фото | 390×874 | [chromium/one-local-390.png](chromium/one-local-390.png) |
| chromium | Файлы приняты, итоговый порядок не сохранён: верх сетки | 390×874 | [chromium/order-save-error-390.png](chromium/order-save-error-390.png) |
| chromium | Сохранение итогового порядка, CTA заблокирована | 390×874 | [chromium/order-saving-390.png](chromium/order-saving-390.png) |
| chromium | Загрузка закончена с частичным успехом: доступен retry | 1024×900 | [chromium/partial-error-1024.png](chromium/partial-error-1024.png) |
| chromium | Загрузка закончена с частичным успехом: доступен retry | 1440×900 | [chromium/partial-error-1440.png](chromium/partial-error-1440.png) |
| chromium | Загрузка закончена с частичным успехом: доступен retry | 320×900 | [chromium/partial-error-320.png](chromium/partial-error-320.png) |
| chromium | Загрузка закончена с частичным успехом: доступен retry | 390×900 | [chromium/partial-error-390.png](chromium/partial-error-390.png) |
| chromium | Загрузка закончена с частичным успехом: доступен retry | 414×900 | [chromium/partial-error-414.png](chromium/partial-error-414.png) |
| chromium | Загрузка закончена с частичным успехом: доступен retry | 440×900 | [chromium/partial-error-440.png](chromium/partial-error-440.png) |
| chromium | Пять локальных фото до отправки | 390×874 | [chromium/preparation-390.png](chromium/preparation-390.png) |
| chromium | Главное фото удалено, следующая карточка стала главной | 390×874 | [chromium/primary-deleted-390.png](chromium/primary-deleted-390.png) |
| chromium | Успешный адресный retry: Продолжить доступно | 390×874 | [chromium/retry-success-390.png](chromium/retry-success-390.png) |
| chromium | Пустой исходный файл: карточка и ошибка | 390×874 | [chromium/unreadable-source-390.png](chromium/unreadable-source-390.png) |
| chromium | Одновременно успешные, ошибочный и загружаемый файлы | 390×874 | [chromium/upload-error-390.png](chromium/upload-error-390.png) |
| chromium | Ошибка после окончания активной отправки | 390×874 | [chromium/upload-error-idle-390.png](chromium/upload-error-idle-390.png) |
| chromium | Отправка пачки, состав заблокирован | 390×874 | [chromium/uploading-390.png](chromium/uploading-390.png) |
| webkit | После перезагрузки: только принятые сервером фото | 390×874 | [webkit/after-reload-server-gallery-390.png](webkit/after-reload-server-gallery-390.png) |
| webkit | Все 10 фото и порядок подтверждены сервером | 390×874 | [webkit/all-saved-390.png](webkit/all-saved-390.png) |
| webkit | Редактор аватара: круглая область | 390×874 | [webkit/avatar-390.png](webkit/avatar-390.png) |
| webkit | Редактор аватара: ошибка обработки | 390×874 | [webkit/avatar-processing-error-390.png](webkit/avatar-processing-error-390.png) |
| webkit | Редактор аватара: поворот | 390×874 | [webkit/avatar-rotated-390.png](webkit/avatar-rotated-390.png) |
| webkit | Профиль после успешного повторного сохранения аватара | 390×874 | [webkit/avatar-saved-390.png](webkit/avatar-saved-390.png) |
| webkit | Подтверждение отбрасывания при закрытии | 390×874 | [webkit/discard-confirmation-390.png](webkit/discard-confirmation-390.png) |
| webkit | Отклонён точный дубликат исходного файла | 390×874 | [webkit/duplicate-390.png](webkit/duplicate-390.png) |
| webkit | Редактор Work: Кадрировать | 1024×874 | [webkit/editor-1024.png](webkit/editor-1024.png) |
| webkit | Редактор Work: Кадрировать | 1440×874 | [webkit/editor-1440.png](webkit/editor-1440.png) |
| webkit | Редактор Work: Кадрировать | 390×874 | [webkit/editor-390.png](webkit/editor-390.png) |
| webkit | Редактор Work: поворот и отражение | 390×874 | [webkit/editor-flipped-390.png](webkit/editor-flipped-390.png) |
| webkit | Редактор Work: фокус рамки с клавиатуры | 390×874 | [webkit/editor-keyboard-focus-390.png](webkit/editor-keyboard-focus-390.png) |
| webkit | Редактор Work: режим Оригинал | 390×874 | [webkit/editor-original-390.png](webkit/editor-original-390.png) |
| webkit | Редактор Work: ошибка обработки, настройки сохранены | 390×874 | [webkit/editor-processing-error-390.png](webkit/editor-processing-error-390.png) |
| webkit | Редактор Work: сброс к состоянию открытия | 390×874 | [webkit/editor-reset-390.png](webkit/editor-reset-390.png) |
| webkit | Редактор Work: поворот на 90° | 390×874 | [webkit/editor-rotated-390.png](webkit/editor-rotated-390.png) |
| webkit | Пустая сетка | 1024×874 | [webkit/empty-1024.png](webkit/empty-1024.png) |
| webkit | Пустая сетка | 1440×874 | [webkit/empty-1440.png](webkit/empty-1440.png) |
| webkit | Пустая сетка | 390×874 | [webkit/empty-390.png](webkit/empty-390.png) |
| webkit | Частичный успех: низ сетки, короткий экран 600px | 390×600 | [webkit/last-row-600.png](webkit/last-row-600.png) |
| webkit | Частичный успех: низ сетки, экран 874px | 390×874 | [webkit/last-row-874.png](webkit/last-row-874.png) |
| webkit | Лимит 10 фото: низ сетки | 390×874 | [webkit/last-row-limit-ten-390.png](webkit/last-row-limit-ten-390.png) |
| webkit | Пять фото: низ сетки, короткий экран 600px | 390×600 | [webkit/last-row-long-600.png](webkit/last-row-long-600.png) |
| webkit | Пять фото: низ сетки, экран 874px | 390×874 | [webkit/last-row-long-874.png](webkit/last-row-long-874.png) |
| webkit | Ошибка сохранения порядка: баннер внизу сетки | 390×874 | [webkit/last-row-order-save-error-390.png](webkit/last-row-order-save-error-390.png) |
| webkit | Достигнут лимит 10 фото: верх сетки | 390×874 | [webkit/limit-ten-390.png](webkit/limit-ten-390.png) |
| webkit | Одно локальное фото | 390×874 | [webkit/one-local-390.png](webkit/one-local-390.png) |
| webkit | Файлы приняты, итоговый порядок не сохранён: верх сетки | 390×874 | [webkit/order-save-error-390.png](webkit/order-save-error-390.png) |
| webkit | Сохранение итогового порядка, CTA заблокирована | 390×874 | [webkit/order-saving-390.png](webkit/order-saving-390.png) |
| webkit | Загрузка закончена с частичным успехом: доступен retry | 1024×900 | [webkit/partial-error-1024.png](webkit/partial-error-1024.png) |
| webkit | Загрузка закончена с частичным успехом: доступен retry | 1440×900 | [webkit/partial-error-1440.png](webkit/partial-error-1440.png) |
| webkit | Загрузка закончена с частичным успехом: доступен retry | 320×900 | [webkit/partial-error-320.png](webkit/partial-error-320.png) |
| webkit | Загрузка закончена с частичным успехом: доступен retry | 390×900 | [webkit/partial-error-390.png](webkit/partial-error-390.png) |
| webkit | Загрузка закончена с частичным успехом: доступен retry | 414×900 | [webkit/partial-error-414.png](webkit/partial-error-414.png) |
| webkit | Загрузка закончена с частичным успехом: доступен retry | 440×900 | [webkit/partial-error-440.png](webkit/partial-error-440.png) |
| webkit | Пять локальных фото до отправки | 390×874 | [webkit/preparation-390.png](webkit/preparation-390.png) |
| webkit | Главное фото удалено, следующая карточка стала главной | 390×874 | [webkit/primary-deleted-390.png](webkit/primary-deleted-390.png) |
| webkit | Успешный адресный retry: Продолжить доступно | 390×874 | [webkit/retry-success-390.png](webkit/retry-success-390.png) |
| webkit | Пустой исходный файл: карточка и ошибка | 390×874 | [webkit/unreadable-source-390.png](webkit/unreadable-source-390.png) |
| webkit | Одновременно успешные, ошибочный и загружаемый файлы | 390×874 | [webkit/upload-error-390.png](webkit/upload-error-390.png) |
| webkit | Ошибка после окончания активной отправки | 390×874 | [webkit/upload-error-idle-390.png](webkit/upload-error-idle-390.png) |
| webkit | Отправка пачки, состав заблокирован | 390×874 | [webkit/uploading-390.png](webkit/uploading-390.png) |
