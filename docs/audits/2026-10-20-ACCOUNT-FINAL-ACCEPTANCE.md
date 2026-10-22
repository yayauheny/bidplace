# Финальная приёмка account — 2026-10-20

База: 39cd0d4a. Рабочая ветка: fix/account-final. Аудит дополняется по мере проверок.

## Подтверждённые замечания

1. **P1: закрытие настроек оставляло дубликат account в стеке.** Воспроизведено из account → settings → крест → Back: первый Back оставался в account. Решение: обе кнопки выхода используют существующий router.dismissTo('/account'); replace здесь не удаляет исходный account. Критерий: крест возвращает в account, следующий Back — на главную. Исправлено; Chromium прошёл.
2. **P2: CTA профиля растягивалась на всю колонку.** Владелец — вариант существующей FigmaButton: content вместо full. Никаких экранных размеров кнопки. Критерий: размер по содержимому, отсутствие overflow при 320–440. Измерено: ширина132.86, высота43 CSS px.
3. **P2: общий FormPageShell добавлял лишний верхний отступ.** Добавлены явные варианты account/settings с существующими spacing-токенами; остальные потребители сохраняют поведение. Критерий: account toolbar12px, settings20px; экран не исправляется translate/absolute.
4. **P2: геометрия identity/header отличалась от intake.** Общий AccountIdentity группирует имя/ник отдельно от CTA; настройки используют glyph28 с hitSlop до44, симметричные края шапки. Критерий: имя x124, CTA x120, аватар100; settings title по центру. Сверено по сохранённому intake; screenshot390 и длинное имя приложены.

## Границы проверки

UI fixture перехватывает API и проходит настоящие DTO-схемы; не заменяет backend/security integration. БД, API удаления и публичные права не изменяются. Реальный iPhone, browser zoom и увеличение текста не проверены. 1024/1440: NEEDS-FIGMA.

## Дополнительные замечания

5. **P2, исправлено: выдуманная высота строки настроек.** Figma7008:15156/15170 задаёт leading normal. В settingsTitle/settingsRow удалены предположительные22/20; остальные text roles не изменены. Критерий: реальный Inter, computed line-height normal, сохранение размеров/центра шапки и строк. В обоих браузерах выполнено.
6. **P1 для будущего удаления: неучтённый edge JSON cache.** Origin deletedAt не убирает прогретый ответ Worker. Уточнены фактические TTL и последовательность release в [delete-плане](../archive/tasks/2026-10-19-account-ui/DELETE-BACKEND-PLAN.md) §5/§7. Рекомендация: в delete-волне owner private,no-store, публичные затронутые JSON no-store + исключение works/authors/home/facets из edge lookup до включения DELETE. Критерий: warmed-cache anonymous GET после удаления без старой карточки; categories сохраняет свой кэш. **Это план; runtime backend/Worker здесь не менялись.**

## Измеренная приёмка

Источник — intake ace4a323, сохранённые MCP capture7008:26852/26917/15150.
App screenshot390×750 сопоставлен с исходным390×800 без нарисованной OS-полосы≈50px; статусбар не реализуется внутри приложения. Settings PNG scaled328×1024 не используется как логический размер: source frame390×1218.

| Проверка                          | До                          | После                                 | Критерий/вывод                           |
| --------------------------------- | --------------------------- | ------------------------------------- | ---------------------------------------- |
| Закрыть settings → account → Back | остаётся account            | главная                               | устранён дубликат в router stack         |
| CTA на390                         | 258px, растянута            | 132.86×43px                           | штатный solid/matrix content             |
| Account top padding               | 24                          | 12                                    | source toolbar62−OS≈50                   |
| Settings top padding              | 24                          | 20                                    | source69.78−OS49.78                      |
| Identity                          | имя и CTA начиналисьx120    | имяx124, CTAx120; avatar100           | композиция source, без сдвигов transform |
| Settings title                    | разные ширины сторон header | центрx195                             | обе стороны glyph28/touch44              |
| Responsive320/390/414/440         | проверено после исправления | overflow0                             | без масштабирования390                   |
| Caption author                    | проверка отсутствовала      | computed tracking−0.14px              | обе платформы browser                    |
| Длинное имя320×568                | —                           | перенос, CTA доступна                 | нет горизонтального overflow             |
| 8работ390×568                     | —                           | последний edit выше dock после scroll | один scroll-owner                        |

Screenshots/JSON: [evidence](current/evidence/2026-10-20-account-final/).
Фикстура намеренно использует synthetic DTO, пустые обложки и серое фото; это не доказательство live-media integration. Согласованные отклонения от старого макета: один Back, без избранного/commerce, настоящие статусы и действия owner, только реализованные настройки, серая аватарка до approve. Изменять их ради совпадения PNG нельзя.

## Проверки итогового кода

- Production expo export web, Node22: passed.
- Mobile tsc --noEmit: passed. В checkout подготовлены ignored database generated/dist без миграций и seed.
- Unit:40/40 — account-consumer14, button style owners и theme.
- Production browser:6/6, Chromium3 + WebKit3, `account-presentation.spec.ts`.
- ESLint изменённых mobile-файлов, формат исходников и diff-check: passed. У design-tokens нет отдельного ESLint-конфига/скрипта; пакет проверен build/typecheck.
- Полный suite и backend e2e повторно не запускались: API/контракты/БД не менялись.

Повторить browser gate с уже собранной SPA на7909:
`SHEET_TEST_URL=http://localhost:7909 pnpm --filter @bidplace/mobile exec playwright test --config=playwright.sheet-local.config.ts account-presentation.spec.ts`.
API URL сборки должен иметь путь /api на перехватываемом origin; тест перехватывает DTO-запросы, не требует БД.

## Что осталось простыми словами

Срез личного аккаунта/настроек доведён для дальнейшей разработки: повторных исправлений роутинга или ручной подгонки размеров не требуется по проверенным сценариям. Это не означает, что весь проект свободен от техдолга.

1. Отдельная следующая функциональная волна — реальное удаление работ по уточнённому backend/security-плану, затем кнопка удаления.
2. Отдельная приёмка человеком — физический iPhone, настоящий zoom200% и увеличение текста. До этого общий accessibility gate остаётся Needs verification.
3. Desktop1024/1440 и black visual parity требуют дизайна/утверждения: NEEDS-FIGMA; black пользователям не включать.
4. Избранное, смена email/пароля и прочие настройки — согласованный backlog, не скрытый долг этой поставки.

Готовность этого account-среза: функциональный web gate пройден; адаптивная композиция390 +320–440 проверена. Полную визуальную/accessibility готовность без перечисленных ручных проверок не заявляем. Продолжать экранные задачи уже можно; глобальную чистку ради этого повторно не открываем.
