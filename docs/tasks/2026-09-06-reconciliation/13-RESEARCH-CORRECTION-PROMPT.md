# Task 13R — correction pass marketplace, abuse и BY legal research

## Кому дать

- Тому же исследователю или Grok 4.6 High с web access.
- Review: GPT-5.6 Sol.
- Режим: research-only.

## Prompt

```text
Исправь результат T01/T11/T12R после независимого review. Прочитай:
- docs/research/raw/2026-09-06-researcher-marketplace-abuse-by-legal-response.md;
- docs/audits/2026-09-06-RESEARCH-PACK-REVIEW.md;
- docs/tasks/2026-09-06-reconciliation/00-RESEARCH-PROJECT-CONTEXT.md;
- DEC-075–DEC-078 в docs/product/12-DECISION-LOG.md;
- исходные prompts T01, T11 и T12R.

Research-only. Не меняй code, schemas, product decisions, public legal drafts, Figma
или .pen. Не повышай recommendation до founder decision или legal conclusion.

Исправь обязательные проблемы:

1. Раздели монолит на три самостоятельных результата:
   - docs/research/YYYY-MM-DD-MARKETPLACE-MECHANICS-COMPARISON.md;
   - docs/research/YYYY-MM-DD-AUCTION-ABUSE-CONTROLS.md;
   - docs/research/YYYY-MM-DD-BY-LEGAL-PRIMARY-SOURCE-MAP.md.
2. Удали все `turn*`, `filecite` и session-local citations из итоговых файлов.
   Для каждого существенного факта дай stable direct Markdown URL, page/document
   title, publisher/authority, access date and region/format. Для НПА добавь точный
   article/paragraph и revision/effective date.
3. Перепроверь каждую URL. Если page не открывается либо claim не следует из неё,
   исправь claim или поставь NOT VERIFIED. Не оставляй generic «official help page».
4. Коды `63.12`, `62.01` и `73.11` уже перепроверены юристом и выбраны основателем
   (`DEC-078`). Не открывай выбор заново. Если исправляешь историческую карту постановления
   № 457, отдели exact evidence от этого принятого решения; только прямое противоречие
   актуального официального источника пометь `LAWYER CHECK`.
5. Дополни либо честно оставь NOT VERIFIED по BY blocks: qualification площадки,
   public requisites, electronic contract/offer/acceptance, consumer seller status,
   advertising, content/moderation, IP/photo licence and minors.
   Secondary source маркируй отдельно.
6. Не открывай заново подтверждённые решения:
   - soft close остаётся 60s→+60s с cap 600s, пока основатель явно не пересмотрел;
   - creator-only/no general resale остаётся MVP boundary; controlled resale только
     future hypothesis;
   - Work-first, cancelled history, free MVP and no platform payment are confirmed.
   - Belarus-only legal scope, `BYN`, the seven-file document set, mandatory cookie
     banner, three registration items, fixed-buy confirmation, accepted-offer outcome
     and text-only V1 error report are confirmed by `DEC-077`/`DEC-078`.
7. Удали recommendation «72h» как якобы лучший срок либо обоснуй её через явные
   operating assumptions. Market ranges сами по себе не выбирают срок.
8. Для second chance чётко различи:
   - eBay отдельное предложение выбранным non-winning bidders;
   - Catawiki payment-integrated simultaneous/sequential multi-offer variants;
   - bidplace candidate для one-of-one без встроенной оплаты.
   Не утверждай, что эти модели равны.
9. Для offer сравни exact binding/reservation/payment behavior eBay, Etsy and Whatnot;
   не переносить payment/autopay consequence в bidplace.
10. Для abuse сохрани distinction signal/allegation/finding, false-positive analysis,
    reversible manual review and appeal. Любой новый personal/device signal пометь
    DATA + LAWYER GATE.

Отдельно создай correction coverage table:
- каждый пункт T01 (1–12);
- каждый пункт T11 (1–12);
- каждый пункт T12R (1–34) и mapping исходных legal questions 1–37;
- статус VERIFIED / PARTIAL / NOT VERIFIED / OUT OF CURRENT SCOPE;
- direct source IDs.

Не копируй длинные фрагменты чужих Terms. Не используй competitor practice как право
Беларуси. Российское право, Roskomnadzor, RF localization и GDPR пометь
OUT OF CURRENT SCOPE; не трать время на их исследование.

Если repository доступен, один research-only commit. Не включай чужие изменения.

Верни ровно:
1. Outcome COMPLETE/PARTIAL/BLOCKED по T01, T11, T12R отдельно.
2. Changed/output files.
3. Stable primary-source count по каждой платформе/органу.
4. Coverage counts VERIFIED/PARTIAL/NOT VERIFIED/OUT OF CURRENT SCOPE.
5. Проверяемая историческая source note по ОКЭД без пересмотра `DEC-078`.
6. Что изменилось относительно raw response.
7. P0 launch blockers.
8. Founder decisions, только действительно открытые.
9. Только прямые конфликты с официальными источниками Беларуси, которые требуют
   финальной проверки юристом; без повторения закрытых вопросов.
10. Branch/base/commit/diff stat либо явное no-repository explanation.
```

## Критерии готовности

- Итоги разделены на три файла.
- Нет session-local citations; все существенные claims проверяемы по direct URLs.
- Историческая ссылка на ОКЭД исправлена без повторного открытия выбранных кодов.
- Confirmed product decisions не выданы за открытые вопросы.
- Coverage tables доказывают выполнение исходных prompts.
- Legal gaps остались явно открытыми, если official evidence недостаточно.

## Prompt проверки в новом чате Codex

```text
Review-only. Проверь correction Task 13R по его prompt и аудиту
docs/audits/2026-09-06-RESEARCH-PACK-REVIEW.md. Открой каждую P0/P1 primary link,
сверь claim, article/paragraph/date, coverage T01/T11/T12R и отсутствие session-local
citations. Проверь, что `DEC-075`–`DEC-078`, включая выбранные ОКЭД и Belarus-only
scope, не были самовольно открыты, а recommendations не стали decisions. Верни ГОТОВО /
ЧАСТИЧНО / НЕ ГОТОВО; findings P0–P3; broken sources; missing coverage; correction
prompt. Ничего не исправляй.
```
