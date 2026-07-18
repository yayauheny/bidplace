# bidplace — пользовательские маршруты и экраны

Последнее обновление: 2026-07-18

Статус: MVP flow confirmed by product docs; implementation snapshot verified

## Правила карты

- Ожидаемое поведение задаёт `../product/05-MVP-RFC.md`, не текущий route.
- Статусы реализации: `Implemented`, `Partial`, `Not implemented`, `Needs verification`, `Implemented but inconsistent with product`.
- Для каждого экрана обязательны loading, empty, error, responsive и accessibility states; realtime-экраны дополнительно имеют stale/offline/reconnect.

## MVP buyer flow

```text
public link → preview/details → register/login → phone verification before first bid
→ review amount → place bid → participation status → outbid/winning loop
→ auction end → won/lost → handoff instructions
```

| Экран                   | Назначение / действие                                                 | Данные и состояния                                                         | Privacy / errors                               | Route / код                                                    | Статус                                                                |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| Public entry            | Открыть seller-led ссылку без регистрации                             | seller, lot, images, scheduled/active state                                | без PII; 404/network/hidden                    | `/auctions/[slug]`, `/product/[id]`; auction/storefront detail | Partial; два конкурирующих detail routes                              |
| Auction preview         | Понять предмет, автора, историю, правила и время старта               | минимум 3 фото, provenance/content fields, countdown, start/minimum        | hidden reserve скрыт; removed/hidden state     | те же detail routes                                            | Partial; контент лота неполный, reserve раскрыт                       |
| Seller details          | Проверить человека и связь с предметом                                | profile, verification, previous/existing auctions                          | public fields only                             | `/sellers/[slug]`; `public-seller-screen.tsx`                  | Partial; contact preference публичен, нет verification/photo/examples |
| Register/login          | Получить сессию перед ставкой                                         | email/password/name/phone; validation/loading/error                        | пароль не логировать; generic auth errors      | `/register`, `/login`; `auth-form.tsx`                         | Partial; HTTP flow есть, native persistence/E2E не подтверждены       |
| Phone verification      | Подтвердить телефон перед первой ставкой                              | phone, OTP, expiry, retry/lockout                                          | masked phone; abuse limits                     | route/component отсутствует                                    | Not implemented; pilot blocker                                        |
| Bid review/confirmation | Увидеть minimum и подтвердить необратимую сумму                       | current price, increment, amount, auction status, pending/success/rejected | no identity; conflict/ended/rate-limit/network | `BidPanel.tsx` на detail                                       | Partial; нет отдельного confirmation и idempotency                    |
| Participation status    | Понять «побеждает», «перебита», «выиграна», «проиграна» и next action | own latest bid, current leader state, auction result                       | собственный статус только участнику            | route/query/component отсутствуют                              | Not implemented; pilot blocker                                        |
| Return/reconnect        | Вернуться по ссылке после background/refresh                          | fresh HTTP snapshot, event version/gap state                               | stale state не выдавать за live                | только query refetch                                           | Not implemented как realtime recovery                                 |
| Bid history             | Видеть прозрачную историю без identity                                | public alias, amount, time                                                 | no user ID/email/phone                         | `BidHistory.tsx`; public auction API                           | Partial; alias отсутствует, показывается bid status                   |
| Auction end             | Ясно увидеть winner/no winner и свой результат                        | final price, ended state, own participation                                | no winner PII                                  | detail banner/timer                                            | Partial; canonical result states не представлены полностью            |
| Post-auction            | Победитель получает инструкции, остальные — понятный финал            | handoff status, privacy consent, next action                               | контакт только по правилам handoff             | route/model/API отсутствуют                                    | Not implemented; real-sale blocker                                    |

## MVP seller flow

```text
manual onboarding → verified profile → lot draft → images/value/provenance/terms
→ auction terms → preview → admin approval → scheduled publication → announcement
→ observe → close → winner contact/handoff → sale confirmation
```

| Экран                    | Назначение / действие                                                      | Данные и состояния                                                                           | Privacy / errors                               | Route / код                                | Статус                                                                            |
| ------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| Manual onboarding        | Founder/admin проверяет первого автора                                     | identity, category fit, invitation/decision                                                  | restricted admin data                          | UI/workflow отсутствует                    | Not implemented; manual operation не зафиксирована в системе                      |
| Seller profile           | Создать публичное представление автора                                     | name, bio, photo, city, directions, contact mode                                             | public/private separation                      | `/profile`; `seller-profile-form.tsx`      | Partial; профиль сразу active, набор полей неполный                               |
| Seller dashboard         | Видеть drafts, auctions и следующие действия                               | lots/auctions/loading/empty/errors                                                           | owner only                                     | `/seller`; `seller-dashboard-screen.tsx`   | Partial; English/internal terminology, нет moderation/handoff                     |
| Lot draft                | Описать объект и его ценность                                              | title, story, technique, materials, dimensions, year, uniqueness, city, delivery, provenance | owner/admin before publish                     | `/lots/new`; `lot-create-form.tsx`         | Partial; contract/form покрывает только базовые поля                              |
| Images                   | Загрузить и упорядочить минимум 3 фото                                     | progress, preview, reorder/delete, rejected file                                             | draft owner/admin; safe media                  | внутри lot form; image API                 | Partial; validation есть, minimum 3 отсутствует                                   |
| Auction terms            | Назначить BYN, start, end, start price, optional hidden reserve, increment | validation, server-time constraints                                                          | reserve скрыт public                           | `/auctions/new`; `auction-create-form.tsx` | Implemented but inconsistent; USD default, public required reserve, buy-now field |
| Preview/moderation       | Увидеть public presentation и отправить на проверку                        | complete validation, pending/approved/changes requested                                      | owner/admin                                    | route/state отсутствуют                    | Not implemented; pilot blocker                                                    |
| Publication/announcement | Опубликовать после approval и получить share link/assets                   | scheduled/active/share                                                                       | only approved content                          | seller publishes directly                  | Implemented but inconsistent with product                                         |
| Observe auction          | Следить за ставками и статусом без влияния на цену                         | bid count/history/live state                                                                 | seller access per policy; no manual price edit | dashboard + seller bid endpoint            | Partial; no client realtime/audit                                                 |
| Close/handoff            | Получить winner flow, consented contact and exceptions                     | result, contact release, refusal, next bidder, timeline                                      | contacts only after allowed state              | отсутствует                                | Not implemented; real-sale blocker                                                |
| Sale confirmation        | Зафиксировать completion/failure and interview                             | sale status, reason, operational notes                                                       | restricted                                     | отсутствует                                | Not implemented; validation cannot be measured                                    |

## Admin flow

```text
review seller → review lot/preview → approve/publish → monitor → hide/ban
→ inspect immutable bids/audit → investigate → handle refusal/handoff
```

| Экран                   | Назначение / действие                                 | Обязательные состояния                             | Privacy / safety                          | Route / код                            | Статус                                            |
| ----------------------- | ----------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| Admin dashboard         | Очереди и incident overview                           | loading/empty/error, counts, pending reviews       | admin guard                               | `/admin`; `admin-dashboard-screen.tsx` | Partial; только users/auctions                    |
| Seller review           | Проверить invitation, identity и eligibility          | pending/approved/rejected/needs changes            | restricted PII, reason log                | отсутствует                            | Not implemented                                   |
| Lot review/preview      | Проверить provenance, фото, текст и terms             | draft/pending/approved/rejected                    | immutable decision/audit                  | отсутствует                            | Not implemented                                   |
| Publish/hide            | Approve scheduled publication или hide unsafe auction | confirmation/success/conflict                      | reason + append-only audit                | hide существует, approval отсутствует  | Partial and unsafe for pilot audit                |
| User block              | Заблокировать пользователя                            | confirmation/already banned/error                  | reason/audit; prevent self-lockout policy | `/admin`; admin API                    | Partial; action exists without confirmation/audit |
| Bid inspection          | Расследовать спор                                     | full bid records, ordering, related events         | admin-only PII, access log                | endpoint exists; UI link not found     | Partial                                           |
| Integrity investigation | Сопоставить bids/admin/lifecycle evidence             | case status, evidence, outcome                     | restricted, append-only                   | отсутствует                            | Not implemented                                   |
| Winner refusal/handoff  | Зафиксировать отказ и выбрать разрешённый next step   | refusal reason, next bidder, deadline, final state | controlled contact release                | отсутствует                            | Not implemented                                   |

## Cross-flow state requirements

- Loading: skeleton/progress без ложной цены или принятой ставки.
- Empty: объясняет причину и безопасное следующее действие.
- Error: различает validation, permission, conflict/ended, rate limit, network и server error.
- Offline/stale: live-данные явно помечены; ставка не подтверждается локально.
- Reconnect: сначала authoritative snapshot, затем продолжение событий.
- Responsive: primary action и current state остаются видимыми на узком экране; desktop использует иерархию, а не только ширину.
- Accessibility: logical headings, labels/errors, keyboard/focus, 44 px touch, non-color state, timer announcements without noise.

## Future screen map (24 months)

Без детальной спецификации до соответствующей product wave:

- fixed-price detail/checkout после подтверждения механики;
- limited drop и preorder participation;
- creator storefront и discovery/search;
- buyer participation/purchase history;
- watchlist и разрешённые notifications;
- payments, order, delivery, refund/dispute;
- public-person verification и authorised representative;
- provenance records and trust center;
- seller analytics and creator tools;
- inbox/custom request только после отдельного продуктового решения.

Future routes не должны появляться в MVP navigation как обещанное рабочее поведение.
