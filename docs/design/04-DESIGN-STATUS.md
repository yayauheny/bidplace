# bidplace — текущий статус дизайна

Срез: 2026-10-23, MVP `872f22fc`. Визуальная приёмка в целом **Partial**.
Источник/правила — [design index](00-DESIGN-INDEX.md) и [design system](03-DESIGN-SYSTEM.md).
Полный прежний журнал, включая ограничения ранних экранов:
[история](../archive/design/04-DESIGN-STATUS-through-2026-10-23.md).

## Текущие экраны и общие компоненты

| Область | Статус | Проверенное основание / остаток |
| --- | --- | --- |
| Login, fullscreen registration, recovery | Partial visual acceptance | Responsive AuthViewport, одна форма, сохранение ввода/ошибок, Back/Forward и focus; [login audit](../audits/current/2026-10-20-LOGIN-SHEET-REVIEW.md), [UI completion](../audits/current/2026-10-21-UI-COMPLETION.md). Production Turnstile, real keyboard/zoom/device motion не подтверждены. |
| Registration consent | Implemented по DEC-124/125 | Один explicit control, lazy документы, сбой GET не блокирует register; [document access](../audits/2026-10-20-REGISTRATION-DOCUMENT-ACCESS.md). Старые записи про четыре checkbox и disabled до загрузки superseded. |
| Author application / Author Story / Work story | Implemented для проверенного web-среза, device parity Needs verification | Client/API cutover, ordered blocks, private media и сохранение перед переходом; [UI completion](../audits/current/2026-10-21-UI-COMPLETION.md). Старое «UI не переведён / B6 не начат» не текущее состояние. |
| Work editor | Partial, updated 2026-10-23 | [Portfolio audit](../audits/current/2026-10-23-PORTFOLIO-DESIGN.md): сетка177×236/12, tile-local состояния и bottomAction; четыре визуальных этапа, Review metadata, photo tiles, ordered block menu и revision/save guards; [independent review](../audits/current/2026-10-21-INDEPENDENT-UI-REVIEW.md). Source frames 390; 1024/1440 exact parity NEEDS-FIGMA. |
| Фото Work и автора | Browser acceptance, native Needs verification | [Portfolio audit](../audits/current/2026-10-23-PORTFOLIO-DESIGN.md): пять визуальных шагов автора, safe retry создания, Chromium/WebKit responsive evidence и 200% browser zoom.  Release-сетка/wizard, preview, пофайловый прогресс/retry/timeout/переходы объединены; 1023 mobile tests и 6 media E2E по merge-записи. Physical devices, live R2/CDN и Figma новых статусов Needs verification. |
| Account / settings | Partial | Published identity, общий cabinet owner, navigation/scroll/long identity; [account acceptance](../audits/2026-10-20-ACCOUNT-FINAL-ACCEPTANCE.md). Settings title примерно +7 px при 390 — явное исключение BackButton/FigmaIconButton, 2 geometry failures сохранены. Desktop 1024/1440 и black parity NEEDS-FIGMA. Delete CTA отсутствует до API. |
| Public author / category / sticky header | Partial | Bleed, identity, grid, About, action-row motion и focus; [author parity](../audits/current/2026-10-21-AUTHOR-PROFILE-PARITY.md). Master/MVP exclusions и desktop grid start 384 vs 387 px записаны там; 1024/1440 exact parity NEEDS-FIGMA. |
| Public desktop navigation / footer / brand | Partial visual parity | Desktop header от 1024 CSS px, ordinary-page footer, shared chrome visibility; [footer audit](../audits/current/2026-10-21-SHARED-FOOTER.md). 44px targets/MVP legal labels отличаются от static source; unavailable commerce controls дают честный feedback. |
| Home empty/loading/error и shared sheets | Implemented для проверенных browser states | Empty CTA capped 420; 390/1024/1440/1920 no-overflow, непрерывный drag, reduced motion/focus/dirty-busy guards; [UI completion](../audits/current/2026-10-21-UI-COMPLETION.md). Desktop empty-state exact parity NEEDS-FIGMA. |
| DateSelection и общий focus | Implemented web; native Needs verification | React Aria web / native picker API, monochrome semantic focus DEC-126/127; [date audit](../audits/2026-10-20-DATE-SELECTION.md). Black palette остаётся provisional, не включена пользователям. |

## Незакрытая приёмка

- Physical iOS **и** Android, Safe Area, системная клавиатура, native frost/compact
  header/motion и реальные жесты — Needs verification. Expo/Hermes export и WebKit
  эмуляция не заменяют устройства.
- Реальный browser zoom 200%, увеличение системного текста, short/resize states
  на устройствах — Needs verification. Reflow viewport сам по себе не zoom proof.
- Desktop/tablet exact parity требует frames 1024/1440 там, где доступен только390;
  responsive browser checks не превращают `NEEDS-FIGMA` в Implemented.
- Live Turnstile и R2/CDN, SMTP delivery — отдельные [release gates](../audits/current/12-PORTFOLIO-MVP-RELEASE-AUDIT.md).
- Старый Home Opening golden mismatch >0.12 остаётся историческим visual debt;
  проверки не ослаблялись. Новый полный visual suite здесь не запускался.
- Ранние screen-specific `Needs verification` не объявлены закрытыми этой очисткой:
  проверять по [истории](../archive/design/04-DESIGN-STATUS-through-2026-10-23.md)
  и owner evidence перед изменением соответствующего экрана.

## Последние результаты и правило обновления

MVP merge 2026-10-22: полный verify green, API legal-pack assertion исправлен
`cc4911e5`; старое «full verify red» описывает UI-ветку до merge. UI evidence:
988 mobile checks, editor E2E26/26, UI68 passed +2 excluded settings failures,
WebKit focus/motion20/20. Фото merge 2026-10-23: 1023 mobile +6 media E2E.
Это сохранённые результаты исходных проверок, не новые прогоны текущей docs-задачи.

Обновлять нужную строку и ссылку на owner audit; одну короткую датированную запись
добавлять при новом результате. Не копировать тестовые логи и старые checkpoints.
Экран не Complete без loading/empty/error/responsive/accessibility acceptance.


2026-10-23 portfolio design: scoped Figma frames получены через официальный MCP;
shared CoverFrost и destructive controls обновлены, существующий footer проверен
без второго владельца. [Audit и ограничения](../audits/current/2026-10-23-PORTFOLIO-DESIGN.md).
Точный desktop/black parity для новых frames — NEEDS-FIGMA; физическая клавиатура
мобильного устройства, системный text scaling и native rendering не подтверждены.
## 2026-10-22 — Registration before account creation

Implemented locally: DEC-135 adds email proof before password/social account
creation, reusing AuthCodeField and auth layout/actions. Registration retains
legal consent through a failed submission; resend/change-address remain explicit.
The consent checkbox supports web Space activation. Chromium/WebKit lifecycle
14/14 and OIDC/email-code/link smoke 12/12 passed on isolated schemas with a test
IdP; registration keyboard consent and code-form responsive resize are included.
Exact visual acceptance of the added registration step and native device QA
remain Needs verification; existing design tokens and composition are reused.


## 2026-10-23 — Совместная проверка auth и фото

**Partial visual acceptance; local behavior checks passed.** Сохранены cookie
bootstrap, password/email-code/provider формы и явные connections settings из
PR #58 вместе с photo/upload UI MVP. Chromium/WebKit: 12 auth completion,
14 auth lifecycle и 6 media checks прошли. CSRF headers добавлены только в
E2E API-транспорт; production guards и browser assertions/timeouts сохранены.
Native devices, live providers и точная визуальная приёмка нового proof-шага
остаются Needs verification.

## 2026-10-23 — Social onboarding: восстановление после SMTP rejection

**Partial visual acceptance; owner behavior checks passed.** `OnboardingForm`
показывает существующий rejected-copy, обновляет email state и разрешает новый
ключ после определённого `MAIL_REJECTED` без reload. Network/неопределённый 5xx
сохраняют ключ. Client submit owner покрывает все три исхода; layout, tokens,
routes и shared controls не менялись. Новая Figma/native acceptance не заявляется.
Chromium/WebKit completion owner: 14/14 passed, включая настоящий rejection
тестового SMTP и успешный новый запрос/подтверждение на той же странице.


2026-10-23 review follow-up: Add в галерее заблокирован при незавершённой пачке,
retry и явная отмена остатка доступны на плитке. AuthorIntroDialog использует portfolio-only copy.
Геометрия/shared controls не менялись; проверки и ограничения —
[portfolio audit](../audits/current/2026-10-23-PORTFOLIO-DESIGN.md).


2026-10-23 final review P3: после partial upload error переход к истории/проверке
блокируется до retry/cancel незавершённого остатка, включая точки шагов. Retry,
cancel и Back остаются доступны; состояние очереди не подменяет uploadBusy.
