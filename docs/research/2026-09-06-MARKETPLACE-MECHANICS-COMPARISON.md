# Marketplace mechanics comparison — research input for bidplace

Дата доступа: 2026-09-06. Статус: research; не product decision, не юридическое
заключение для Беларуси или России. Исследование использует публичные первичные
help/policy/terms pages. Если механизм не удалось подтвердить на такой странице,
он отмечен `NOT VERIFIED`, а не выводится из интерфейса или вторичного пересказа.

## Executive comparison

| Площадка | Форматы, подтверждённые источником | Момент/оплата | Что особенно полезно как pattern |
| --- | --- | --- | --- |
| eBay, глобальный marketplace | Auction, fixed-price, Best Offer | bid binding; offer может оставаться доступным до оплаты в некоторых flows | Явные expiry, лимиты предложений и race между offer/payment |
| Etsy, marketplace уникальных товаров | Fixed-price | seller отменяет transaction; buyer запрашивает через Messages | Честно отделять seller policy, cancellation и case flow |
| Catawiki, curated auction/Buy Now | Auction с Buy Now | highest bid/Buy Now обычно создаёт contract; payment window 3 дня | История, reminders, controlled multi-offer/relist и доступ к контакту только после paid win |
| Whatnot, live auction/BIN | Auction, Buy Now, buyer offers | auction автоматически charged; accepted BIN offer charged | One Activity с Purchases/Bids/Offers, explicit offer states и card-on-file confirmation |
| Bidbaits, provided materials | `NOT VERIFIED` публичной страницей в этом исследовании | `NOT VERIFIED` | Допустим только как локальная карта сценариев, не как source law/mechanics |

### Наблюдаемые общие patterns

1. Auction bid визуально и текстово отделяется от fixed buy и offer: binding
   consequence, редкие основания withdrawal и особый post-win путь.
2. «Выиграл» ещё не универсально означает одинаковый commercial outcome: eBay
   и Catawiki используют разные payment/race mechanics; Whatnot снимает деньги
   автоматически. Нельзя перенести это в bidplace без отдельного contract decision.
3. Mature platforms сохраняют cancelled/unpaid history и используют status,
   reminder и audit; «тихо удалить строку» не является хорошим pattern.
4. Second chance не должен считаться одним универсальным действием: Catawiki
   описывает configurable multi-offer/relist, eBay describes Second Chance,
   а contact-release доказан как отдельная privacy boundary.
5. Offer и fixed-sale races требуют server-side single-winner rule: eBay прямо
   описывает offer/payment race; Whatnot charges after accepted offer.

## Sources and evidence

Все ниже — observed facts. Region/format указан в тексте страницы либо в её
контексте; availability может отличаться по country/category/account.

| ID | Platform, page and direct URL | Observed fact relevant to bidplace |
| --- | --- | --- |
| E1 | eBay, [How bidding works](https://www.ebay.com/help/buying/bidding-buying/retracting-bid?id=4003), auction | Bid is described as binding; highest bidder pays. eBay is testing a final-60-second reset in some categories and documents Second Chance. |
| E2 | eBay, [Retracting a bid](https://www.ebay.com/help/buying/bidding/retracting-bid?id=4013&ra=true), auction | Retraction is limited to stated error/description-change cases; shorter window applies near end. |
| E3 | eBay, [How sellers can cancel an order](https://www.ebay.com/help/selling/selling-getting-paid/cancel-transaction?id=4136&ra=true), order | Seller selects a reason; unpaid-buyer reason becomes available after four full calendar days; buyer cancellation request has a response window. |
| E4 | eBay, [Making a Best Offer](https://www.ebay.com/help/buying/buy-now/making-best-offer?id=4019), fixed/offer | Seller has 24h; buyer offer/counteroffer rules, retraction limits and a payment race are visible. |
| E5 | eBay, [Adding Best Offer](https://www.ebay.com/help/selling/listings/using-best-offer?id=4144), fixed/offer | Seller can accept/decline/counter; offers expire; first bid can invalidate auction offers; simultaneous counteroffers and first paid buyer are documented. |
| E6 | eBay, [Shill bidding policy](https://www.ebay.com/help/policies/selling-policies/selling-practices-policy/shill-bidding-policy?id=4353), integrity | Self/friend/employee price manipulation is prohibited; systems monitor patterns; responses can include warning, restriction, suspension or removal. |
| T1 | Etsy, [Buyer Policy](https://www.etsy.com/legal/buyers/), fixed marketplace | Buyer may request cancellation through Messages; only seller can cancel a transaction. |
| T2 | Etsy, [Cancellation Policy](https://www.etsy.com/legal/policy/cancellation-policy/253925018785), fixed marketplace | Documents limited seller cancellation circumstances, including failed payment and refund-based cases. |
| T3 | Etsy, [Seller Policy](https://www.etsy.com/legal/sellers/), unique goods | Seller is expected to honour commitments/processing time, notify and cancel if unable to complete; case system exists. |
| T4 | Etsy, [IP Policy](https://www.etsy.com/legal/policy/intellectual-property-policy/1106143401341) and [report help](https://help.etsy.com/hc/en-us/articles/360000344568-How-to-Report-an-Item-or-Shop?segment=selling) | Platform may disable listing/shop/account under policy; user can report an item/shop. The source does not make Etsy a legal adjudicator. |
| C1 | Catawiki, [withdraw a bid](https://www.catawiki.com/en/help/bidding-issues/i-wish-to-withdraw-or-cancel-an-earlier-bid/), auction | Bid cannot be cancelled/withdrawn; it is binding; failure to pay can block future bidding. |
| C2 | Catawiki, [payment methods](https://www.catawiki.com/en/help/payment-options/what-payment-methods-can-i-use) and [late payment](https://www.catawiki.com/en/help/buyer-payment-issues/what-happens-if-i-dont-pay-for-my-order-on-time), auction/Buy Now | Auction winner gets 3 days; Buy Now is immediate; reminders precede cancellation/possible offer to another bidder. |
| C3 | Catawiki, [seller non-payment flow](https://www.catawiki.com/en/help/seller-payment-issues/what-happens-if-the-buyer-does-not-pay-for-my-object), auction | Configurable multi-offer may reach second/third bidders, then cancel/re-auction; seller can opt out of automatic resubmission. |
| C4 | Catawiki, [Terms of Use](https://www.catawiki.com/en/help/buyer-terms/general-terms-of-use?1519129965=), auction/Buy Now | Describes sale contract, last-minute 90s extension, platform bid log, exceptional cancellation/relist and rights to reject/revoke a bid. |
| C5 | Catawiki, [selling](https://www.catawiki.com/en/help/become-a-seller/how-does-selling-on-catawiki-work) and [submission](https://www.catawiki.com/en/help/submitting-lots/how-does-the-submission-process-work), curated sale | Object is submitted/reviewed separately from auction; a reserve/Buy Now can be attached; unsold item may be re-offered. |
| C6 | Catawiki, [contact seller](https://www.catawiki.com/en/help/), buyer order | The help centre says buyer-to-seller contact function becomes available after win and payment. |
| C7 | Catawiki, [report object](https://www.catawiki.com/en/help/lots-in-auction/how-can-i-report-an-object-if-i-think-it-shouldn-t-be-on-catawiki/) and [misuse](https://www.catawiki.com/en/help/policies-guidelines/misuse-policy) | Public reporting asks for detail/link; policy distinguishes seriousness, pattern and account history; it also notes abuse of reports. |
| W1 | Whatnot, [bid during a show](https://help.whatnot.com/hc/en-us/articles/14932924544141-Bid-on-an-item-during-a-show), live auction | Highest bid at zero is automatically purchased with saved payment; bids are binding; shill bidding can lead to suspension/removal. |
| W2 | Whatnot, [make offer on BIN](https://help.whatnot.com/hc/en-us/articles/4407216260493-Make-an-offer-on-a-Buy-It-Now-product), offer | Buyer reviews amount/payment/shipping, may cancel offer; seller accepts/declines/counters; unanswered offer expires after 30 days; acceptance charges card. |
| W3 | Whatnot, [seller offer controls](https://help.whatnot.com/hc/en-us/articles/14578719543821-Enable-and-respond-to-Buy-It-Now-offers), offer | Offers are an optional BIN setting and seller can accept/counter/decline. |
| W4 | Whatnot, [Activity](https://help.whatnot.com/hc/en-us/articles/48286460264461-View-and-manage-your-buying-activity), cabinet | Purchases, bids and offers are distinct; statuses include completed, refund, cancelled, lost/won and offer awaiting/counter/accepted/cancelled/expired. |
| W5 | Whatnot, [cancel request](https://help.whatnot.com/hc/en-us/articles/360061605451-Request-to-cancel-your-order), order | Seller handles eligible cancellation requests; auction bid remains binding; limited support exception is described for technical bidding issue. |
| W6 | Whatnot, [counterfeit policy](https://help.whatnot.com/hc/en-us/articles/360061604031-Counterfeit-Policy-and-Restricted-Branded-Items-Policy) and [Community Guidelines](https://help.whatnot.com/hc/en-us/articles/360061197472-Whatnot-Community-Guidelines) | Report can require photos; seller gets an evidence opportunity; inconclusive outcomes and repeated patterns are distinguished; stolen/unlicensed media and disruptive bidding are prohibited. |

## Question-by-question comparison

| Topic | Evidence | Safe inference for bidplace | `NOT VERIFIED` / boundary |
| --- | --- | --- | --- |
| 1. Bid / retract / soft close / seller edits | E1–E3, C1/C4, W1/W5 | Make bidder see amount, currency, deadline and consequence at action; immutable audit must record a rare withdrawal/cancel reason. | Exact contract moment and permitted grounds in BY/RF require lawyer. Etsy auction mechanics not verified. |
| 2. Non-payment | E3, C2–C3 | Preserve unpaid/cancelled history; reminders, deadline, reason and recovery path are safer than disappearing row. | Catawiki's fees/sanctions/payment processor must not be copied. |
| 3. Second chance | E1, C2–C4 | Treat every follow-on buyer as an explicit stateful choice, not an automatic contact leak. | eBay Second Chance details and Bidbaits public flow not fully verified here. |
| 4. Fixed price | E4–E5, C4–C5, W2 | Inventory one needs atomic availability check plus immutable accepted/paid snapshot. | Which bidplace event forms a direct contract remains D05/lawyer question. |
| 5. Buyer offer | E4–E5, W2–W4 | Model expiry, revoke, accept/decline/counter and the accept-vs-buy race as first-class server states. | Etsy buyer-offer mechanics not verified. Counteroffer choice for bidplace remains founder decision. |
| 6. Currency | C2, W1, E4 | Contract currency should be persisted and shown at confirmation; viewer conversion must never silently replace it. | BYN/RUB conversion source, display and consumer wording require D04/lawyer. |
| 7. Work / Listing | C5 and C4 | Separate authored object identity from sale attempt; retain immutable sale history and permit later listing by explicit policy. | Multiple sale formats over the same Work are not a permission to implement without T12. |
| 8. Cabinet | E1/E4, W4, C2–C3 | Use separate Purchases/Sales information architecture with active/history/problem states; cancelled rows remain visible. | Exact bidplace roles/actions are product contract work, not visual inference. |
| 9. Complaints/disputes | T4, C7, W6 | Report form should capture subject, reason and optional evidence; outcome/reason/audit should be traceable. | SLA, evidence retention and BY/RF legal notice need lawyer. |
| 10. Notifications | E4–E5, C2–C3, W2–W5 | Action/deadline/cancellation notices should correspond to a persisted event and a user-visible activity state. | Channel consent/marketing classification needs legal review. |
| 11. Abuse | E6, C4, C7, W1, W6 | Human-reviewed, reversible controls and evidence are recurring patterns; do not equate relationship/network signal with proof. | Technical detection signals beyond published policy belong to T11. |
| 12. Legal UX observed only | E1/E4, C1/C4, W1/W2 | Short action-specific consequence plus linked full terms is a reusable UX pattern. | It is not proof that text/placement is legally sufficient in BY/RF. |

## Lifecycle sketches

```text
Auction
Draft Work -> reviewed/published Listing -> LIVE -> ENDED
  -> no valid bid: UNSOLD/history
  -> winning bid: PENDING_FULFILMENT/CONTACT -> COMPLETED | FAILED/CANCELLED
     -> optional, separately accepted recovery: new offer to one eligible buyer
```

```text
Fixed sale (inventory = 1)
ACTIVE -> buyer confirms current snapshot -> atomic reserve/Order creation
  -> PENDING_FULFILMENT -> COMPLETED | CANCELLED/FAILED
  -> any simultaneous buy/offer accept loses with canonical current state
```

```text
Buyer offer
ACTIVE -> OFFER_OPEN -> ACCEPTED | DECLINED | EXPIRED | REVOKED
  ACCEPTED -> atomic Order/reservation -> fulfilment states
  Listing sold/withdrawn/changed -> terminal explicit result for every open offer
```

## Failure and race matrix

| Race/failure | Observed comparable pattern | Minimum safe contract to decide |
| --- | --- | --- |
| last bid vs deadline | eBay/Catawiki extend selected auctions; Whatnot timer ends purchase | server time, atomic bid/endsAt update, durable audit |
| seller cancels after low win | eBay requires reason; Catawiki can cancel in exceptional cases | closed reason taxonomy, visibility, appeal/ops path; no silent delete |
| winner misses deadline | Catawiki reminder -> configurable multi-offer/relist | whether new offer/accept creates next contract and when contact is visible |
| two buyers use fixed buy | eBay/Whatnot describe first payment/automatic charge paths | DB uniqueness + transaction, loser response code and no contact release |
| accepted offer vs fixed buy | eBay states item can remain available until payment in some flow | explicit priority/reservation policy; no client-side winner selection |
| offer is open while Listing changes | eBay ends/declines offers with listing state in described cases | versioned listing snapshot, terminal reason, event/notification |
| report/abuse allegation | Catawiki/Whatnot request information and assess | report status, evidence access controls, human review and non-retaliation/appeal policy |

## Options for unresolved bidplace decisions

These are recommendations for a founder decision, not selected policy.

| Decision | A | B | C | Research trade-off |
| --- | --- | --- | --- | --- |
| D01 Offer expiry/counter | 24h, no counter | 24h, one counter each way | 30d, cancellable offer | A is simplest; B supports negotiation; C mirrors Whatnot but produces long-lived race/state risk. |
| D02 Non-payment / next buyer | cancel and relist manually | seller sends new offer to one rank-selected buyer | automatic ranked multi-offer | A minimizes privacy/error risk; B is auditable; C is operationally powerful but needs strict contract/contact decisions. |
| D03 Contact window | fixed platform 48h | seller-selected bounded 24/48/72h | payment-first window before contact | A easiest; B adds policy/UI surface; C requires payments not in current runtime. |
| D04 Currency | BYN-only contract, no hint | BYN contract with labelled non-binding RUB hint | seller listing currency BYN/RUB | A lowers ambiguity; B requires rate/source/timestamp; C multiplies law, pricing and API work. |
| D05 Contract moment | winning/confirmed action creates direct contract | action creates conditional Order pending contact | platform only records intent until parties agree | A has clearest UX but needs legal validation; B matches current operational shape; C weakens auction/fixed certainty. |
| D06 Notifications | in-app only | transactional email + in-app | user-configurable per-event channels | A is narrow; B supports deadlines; C requires consent/preferences matrix. |

## Patterns classification

### Safe to adopt as engineering patterns

- Persist action, actor, timestamp, snapshot and terminal reason before emitting
  UI/realtime notification.
- Keep cancelled, failed and unpaid rows in role-scoped history.
- Treat server transaction/unique constraint as authority for inventory one and
  for offer/fixed races.
- Expose separate user-facing states for bid, purchase, offer and report.
- Require a human evidence/review route for authenticity/IP/abuse claims.

### Require lawyer + founder decision

- Binding moment and exact promise at bid, fixed-buy and accepted offer.
- Contact disclosure, next-bidder selection, cancellation/reminders and deadline.
- Contract currency and any conversion hint.
- Public legal wording, consent evidence, notification channel and retention.

### Reject for current low-volume MVP

- Copying another platform's fees, automatic card charge, penalty, reserve,
  payment hold or «final decision» wording.
- Automatic multi-bidder contact disclosure, automatic relist, opaque risk score
  or irreversible ban based on an unverified signal.
- Treating competitor Terms as evidence of Belarusian/Russian compliance.

## Implications, without implementation

| Boundary | Needed after decision |
| --- | --- |
| Schema/API | Work separate from Listing; sale-format-specific state machines; immutable Action/Order/Offer snapshots; one active buyer invariant; terminal reasons. |
| UI | Distinct sale-format confirmation surfaces; Purchases/Sales histories; offer deadline/revoke state; canonical conflict recovery; no contact before permitted event. |
| Audit/notifications | Append-only action, state-transition, disclosure and moderation records; event matrix with channel/legal-basis review. |
| Legal/docs | Lawyer maps moment, parties, currency, cancellation, contact, retention and UX text per action; owner docs record only resulting decision. |

## Founder questions (maximum 12)

1. Which D01 offer model is acceptable: no counter, bounded counter, or long-lived cancellable offer?
2. Is non-payment recovery a manual relist only or a new explicit seller-to-buyer offer?
3. May any second bidder's contact be disclosed before that bidder accepts a new deal?
4. Is 48h a pilot operational target or a contractual deadline; who can change it?
5. Is BYN-only contract currency acceptable for RF users until written legal approval?
6. If a conversion hint exists, who supplies rate, timestamp and disclaimer?
7. At which event should bidplace assert the direct seller-buyer contract forms in each format?
8. Can seller cancel a won/fixed/accepted sale; which reasons and evidence are valid?
9. Does MVP allow counteroffers at all, or must negotiation remain out of scope?
10. Which transactional events justify in-app and/or email notice before consent advice?
11. What explicit result/recovery should a buyer see after a cancelled/unpaid sale?
12. Which report types must exist at launch and which team can meet the stated response expectation?

## Uncertainty and access limits

- Bidbaits public mechanics could not be independently verified from a current
  public official page in this research. The provided raw documents remain a
  scenario map only.
- eBay availability differs by category, country, payment setup and product
  type; exact Second Chance conditions were not independently expanded here.
- Etsy buyer offers/auction, Catawiki internal fraud scoring and Whatnot
  enforcement signals beyond stated policy are `NOT VERIFIED`.
- None of the observed competitor flows establishes BY/RF legal compliance,
  consumer-rights treatment, data-retention period or adequate consent wording.
