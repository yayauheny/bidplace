# Task 11 — исследование защиты от auction abuse

## Кому дать

- Исполнитель: Grok 4.6 High.
- Независимая проверка: GPT-5.6 Sol с `security`.
- Приоритет: P1 research; можно выполнять параллельно T01, но не дублировать его механику сделок.

## Prompt исполнителю

```text
Repository: bidplace. Research/security-design only. Не меняй app code, schemas, product
decisions, Figma или .pen. Прочитай AGENTS.md; docs/product/01, 05, 08, 09, 11, 12;
docs/legal/07; docs/tasks/2026-09-06-reconciliation/01-MARKETPLACE-MECHANICS-RESEARCH.md;
implementation stack review и этот task. Примени security review discipline.

Цель: на актуальных primary sources исследовать, как eBay и минимум четыре релевантных
marketplace/auction platforms обнаруживают, предотвращают и разбирают злоупотребления,
которые критичны bidplace. Обязательно попытайся проверить eBay, Etsy, Bidbaits,
Catawiki и Whatnot. Если evidence закрыто авторизацией или отсутствует, пиши NOT VERIFIED.
Не выдавай отсутствие публичного описания за отсутствие механики.

Темы:
1. shill bidding: ставки себе, друзья/семья, связанные accounts, seller collusion;
2. seller cancellation после невыгодной финальной цены и фиктивный non-payment;
3. bidder non-payment, serial cancellation и disposable accounts;
4. duplicate Work/Listings, повторная публикация того же экземпляра и mass spam;
5. перепродажа чужой авторской работы на той же площадке: допустимый secondary market
   vs ложное авторство/выдача себя за автора;
6. stolen photos, forged provenance, misleading description and counterfeit claims;
7. multi-account/device/network/payment/contact signals и их false positives;
8. evidence retention: bids, IP/device/session, edits, contacts, moderation actions;
9. user-facing warnings, reports, appeals, sanctions and transparency;
10. manual moderation vs automatic limits for a low-volume pilot;
11. privacy/data-minimization implications for BY+RF lawyer validation;
12. abuse of complaint and report-site-error channels.

Для каждой площадки используй official policies/help/transparency/security materials;
для technical mechanisms можно добавлять papers/standards после primary platform source.
Каждому факту: direct URL, page title, date accessed, region/sale format, short paraphrase.
Не копируй Terms и не пытайся обходить login/paywall.

Создай:
docs/research/2026-09-XX-AUCTION-ABUSE-CONTROLS.md

Структура:
- threat model: actor, action, gain, harmed party, evidence;
- cross-platform evidence matrix;
- prevention/detection/response/appeal matrix;
- safe pilot controls using current data;
- controls needing new personal/device data and lawyer approval;
- hard blocks vs soft flags vs manual review;
- duplicate/resale policy alternatives A/B/C preserving legitimate ownership transfer;
- staged implementation P0/P1/later, each with measurable signal and false-positive risk;
- minimum audit events and retention questions, no final legal retention period;
- founder decisions, maximum 10;
- lawyer questions to merge into legal pack;
- code touchpoint map only, no code design fiction.

Do not recommend opaque permanent auto-bans from a single IP/device match. Do not promise
fraud prevention or authenticity verification. Separate policy violation, anomaly signal
and proven abuse. Prefer reversible pilot controls and human review where confidence is low.

Create branch fix/auction-abuse-research and one research-only commit:
fix issue:

* added auction abuse threat model
* compared primary marketplace controls
* proposed staged pilot safeguards

Верни ровно:
1. Outcome and commit coordinates.
2. Platforms/primary sources inspected.
3. Top threats ranked likelihood × impact.
4. P0 pilot controls and data each requires.
5. Unverified mechanisms.
6. Founder and lawyer decisions.
7. Changed files/diff stat/static checks.
8. Confirmation code, Figma and .pen untouched.
```

## Критерии готовности

- Все 12 тем имеют evidence либо `NOT VERIFIED`.
- Shill bidding не сводится к одному IP; показаны false positives и appeal.
- Duplicate/resale различает законного владельца, автора и ложное авторство.
- Рекомендации подходят low-volume pilot и не требуют скрытого сбора лишних данных.
- Legal/data-retention вопросы отделены от технических предположений.

## Prompt проверки в новом чате Codex

```text
Review-only + security. Проверь Task 11 по
docs/tasks/2026-09-06-reconciliation/11-AUCTION-ABUSE-RESEARCH.md. Код не исправляй.
Проверь primary links, полноту threat model, false positives, data minimization, appeal,
разделение anomaly/proof и реалистичность low-volume pilot controls. Верни ГОТОВО /
ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3; unsupported claims; missed threats; correction
prompt. Не превращай competitor practice в юридическое заключение BY/RF.
```
