# Task 01 — исследование marketplace mechanics

## Prompt исполнителю

```text
Repository: bidplace. Research-only. Не меняй app code, product decisions, Figma
или .pen. Прочитай docs/product/00, 01, 05, 09, 11, 12; docs/legal/07; docs/legal/08;
docs/audits/2026-09-06-IMPLEMENTATION-STACK-REVIEW.md.

Цель: на первичных публичных источниках сравнить актуальные mechanics eBay,
Etsy, Bidbaits и минимум двух релевантных площадок (предпочтительно Catawiki и
Whatnot; замени только с объяснением). Не копируй Terms. Отделяй observed fact,
legal wording, UX pattern и свою recommendation. Для каждого факта дай direct URL,
название страницы, дату доступа и регион/тип продажи. Если механика не видна без
аккаунта, пометь NOT VERIFIED, не угадывай.

Исследуй одним связанным пакетом:
1. Auction bid: binding moment, confirmation, bid retraction, soft close, seller
   cancellation and listing edits.
2. Non-payment: contact/payment window, reminders, weekends, cancellation,
   sanctions, relist and audit/history.
3. Second chance: automatic next winner vs seller-selected ranked bidder vs new
   offer; можно ли пропускать участников; когда и чьи contacts раскрываются.
4. Fixed price: buy confirmation, seller withdrawal race, inventory=1,
   cancellation and contract snapshot.
5. Buyer offer: default/custom expiry, revoke, accept/reject/counteroffer,
   competing offers/fixed buy, notifications and race resolution.
6. Currency: listing currency, viewer conversion hints, rate source/timestamp,
   checkout/contract currency, BYN/RUB examples if platforms support them.
7. Work/Listing separation: portfolio item without sale, later listing, archive,
   relist, multiple sale formats over the same work and immutable sale history.
8. Cabinet: Purchases/Sales tabs, active/history/problem states, cancelled rows,
   bid history and actions.
9. Complaints/disputes: report work/seller/order/site error, evidence, session or
   technical diagnostics, privacy notice, status tracking and response SLA.
10. Notifications: in-app vs email for bid, outbid, sale, offer, deadline,
    cancellation, complaint and security.
11. Abuse: self-bids/friends, duplicate/resale work, multi-account, price pumping,
    account sanctions and evidence available to platform.
12. Legal UX only as observed: which short warnings and links appear at bid/buy/
    offer/publish; do not assert legality from competitor practice.

Output file:
docs/research/2026-09-XX-MARKETPLACE-MECHANICS-COMPARISON.md

Required structure:
- executive comparison matrix;
- evidence table per question with direct primary links;
- lifecycle diagrams for auction/fixed/offer;
- failure/race matrix;
- patterns safe to adopt, patterns requiring lawyer, patterns to reject;
- recommended bidplace MVP option A/B/C for each unresolved decision with
  trade-offs, no silent final decision;
- exact founder questions, maximum 12;
- implications for schema/API/UI/audit/notification/legal docs;
- uncertainty and inaccessible evidence.

Do not implement. Do not treat a competitor Terms page as proof of BY/RF law.
Use official help/terms pages, not SEO articles. Web facts must be current at the
date of research.

Commit only the research file:
fix issue:

* added marketplace mechanics comparison
* documented primary source evidence
* proposed unresolved mvp alternatives

Return exactly:
1. Outcome complete/partial/blocked.
2. Branch, base SHA, commit SHA.
3. Platforms and primary sources inspected.
4. Five most important findings.
5. Unverified items.
6. Founder decisions still required.
7. Changed files and diff stat.
8. Confirmation app code, Figma and .pen untouched.
```

## Критерии готовности

- Все 12 тем имеют evidence либо явный `NOT VERIFIED`.
- Для eBay/Etsy/Bidbaits и двух аналогов используются primary sources.
- Recommendation не маскируется под факт или юридическое заключение.
- Offer expiry, second chance/contact release, fixed-buy race, currency hint и
  Work/Listing separation разобраны особенно подробно.
- Есть варианты, которые можно передать основателю и юристу без повторного поиска.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь результат Task 01 по
docs/tasks/2026-09-06-reconciliation/01-MARKETPLACE-MECHANICS-RESEARCH.md.
Проверь каждую ссылку, дату, соответствие факта источнику, полноту 12 тем,
разделение facts/inference/recommendation и отсутствие ложных юридических выводов.
Верни ГОТОВО / ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3; missing evidence; correction
prompt. Код не исправляй.
```

