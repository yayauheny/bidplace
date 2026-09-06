# Auction abuse controls — research input for bidplace

Дата доступа: 2026-09-06. Статус: security/product research; не юридическое
заключение, не evidence that a particular account committed abuse and не решение
об implementation. Public policy describes outcomes more often than detection
logic; absent disclosure is marked `NOT VERIFIED`.

## Threat model for a low-volume pilot

| Threat | Actor/action/gain | Harmed party | Evidence that may exist | Signal is not proof because |
| --- | --- | --- | --- | --- |
| Shill bid | seller or connected person bids to raise price | genuine bidder, marketplace trust | bid sequence, actor/listing relation, audit, user report | family/network/device overlap can be legitimate; price alone is not proof |
| Seller cancels low win | seller claims a false problem/non-payment | winning buyer, auction integrity | cancellation reason, chronology, communication, listing edits | genuine force majeure, safety or legal issue can exist |
| Winner does not perform | bidder places disposable/fake high bid | seller and later genuine bidders | order status, reminders, prior fulfilled/cancelled outcomes | payment/contact failure can be accidental or external |
| Duplicate/resale | actor republishes same object or implies false authorship | author, buyer, trust | Work images/text/provenance, complaint, moderation decision | owner may legitimately resell or list a different edition |
| Stolen media/provenance | actor uploads third-party photos/documents | rights holder, buyer | original report, URLs, files/checksums, claimant authority | similar images or a claim alone do not establish ownership |
| Multi-account manipulation | user evades a restriction or self-bids | all participants | session/account/rate-limit/audit facts | shared device/network/location is common and non-conclusive |
| Complaint abuse | actor files false/repeated reports to suppress rival | seller/reported user, moderators | report history, evidence quality, decision/appeal log | a report must remain possible even from a new/unknown user |

## Cross-platform primary evidence

| Platform | Direct primary source | Observed control / limit |
| --- | --- | --- |
| eBay | [Shill bidding policy](https://www.ebay.com/help/policies/selling-policies/selling-practices-policy/shill-bidding-policy?id=4353) | Prohibits self/family/friend/employee artificial-price bids; says systems monitor patterns; published outcomes include removal, warning, restriction or suspension. It does not disclose detector inputs. |
| eBay | [How bidding works](https://www.ebay.com/help/buying/bidding-buying/retracting-bid?id=4003) | Publicly explains fair-auction reason for no friend bidding and binding auction consequence. |
| Etsy | [IP Policy](https://www.etsy.com/legal/policy/intellectual-property-policy/1106143401341) and [report item/shop](https://help.etsy.com/hc/en-us/articles/360000344568-How-to-Report-an-Item-or-Shop?segment=selling) | Listing/shop/account may be disabled under policy; item/shop reporting exists. Etsy says it is not positioned to make legal determinations on IP disputes. |
| Etsy | [Seller Policy](https://www.etsy.com/legal/sellers/) and [Cancellation Policy](https://www.etsy.com/legal/policy/cancellation-policy/253925018785) | Seller completion obligations, cancellation conditions and failed-payment flagging are public. Shill detector, device/network and appeal process are `NOT VERIFIED` here. |
| Catawiki | [Fair business practice](https://www.catawiki.com/en/help/eerlijkzakendoen) | System prevents seller bidding on own submissions; experts cannot buy their own auctions; seller identity may be requested through payment partner. |
| Catawiki | [Misuse Policy](https://www.catawiki.com/en/help/policies-guidelines/misuse-policy) | Considers severity, intent, pattern and account history; warns/removes/suspends according to case; recognises report abuse. |
| Catawiki | [Report object](https://www.catawiki.com/en/help/lots-in-auction/how-can-i-report-an-object-if-i-think-it-shouldn-t-be-on-catawiki/) and [Terms](https://www.catawiki.com/en/help/buyer-terms/general-terms-of-use?1519129965=) | Report route asks for detail/link; terms describe removal/cancellation for shill, technical or counterfeit/stolen concerns and ability to limit account participation. |
| Whatnot | [Bid during a show](https://help.whatnot.com/hc/en-us/articles/14932924544141-Bid-on-an-item-during-a-show) | Binding bid policy calls out artificial price increase/shill bidding and possible suspension/removal. |
| Whatnot | [Counterfeit Policy](https://help.whatnot.com/hc/en-us/articles/360061604031-Counterfeit-Policy-and-Restricted-Branded-Items-Policy) | Claim may need photos; seller can submit authenticity evidence; authentic, inauthentic and inconclusive outcomes are distinguished; repeated inconclusive claims can trigger review. |
| Whatnot | [Community Guidelines](https://help.whatnot.com/hc/en-us/articles/360061197472-Whatnot-Community-Guidelines) and [IP Policy](https://help.whatnot.com/hc/en-us/articles/4685447890445-IP-Policy) | Prohibits disruptive/fake bidding and unlicensed images/IP; reports and corrective action exist; repeat infringement can cause removal. |
| Bidbaits | [local source mapping](../legal/08-BIDBAITS-SOURCE-MAPPING-2026-09-06.md) | Provided materials are useful scenario input only. A current public primary policy/mechanism was `NOT VERIFIED`; no control is attributed to Bidbaits here. |

## Prevention, detection, response and appeal

| Control class | Pilot-safe control using current data | Response | Appeal / false-positive safeguard |
| --- | --- | --- | --- |
| Hard invariant | Prevent a seller's own authenticated account from bidding on its Listing; retain existing single-user ownership checks. | Reject request with neutral reason; audit rejected action. | Correct only an identity/ownership error through support; no relationship inference. |
| Hard invariant | Reject actor state that is already server-prohibited (banned/revoked/not verified where current contract requires it). | Existing deterministic API error and audit. | Human restores only after reasoned review; no silent bypass. |
| Soft flag | Unusual bid/cancel/non-performance sequence, repeat report target, duplicate-image/text candidate. | Queue for admin review; do not change price/winner or disclose contact. | Reviewer sees source facts and can mark false positive/not enough evidence. |
| Manual review | Credible rights-holder, counterfeit/stolen/provenance or serious misrepresentation report. | Temporarily hide only when harm/risk warrants; ask for evidence; preserve original audit. | Reported seller can respond; decision/reason/review timestamp retained. |
| Sanction | Repeated/proven deliberate manipulation or policy breach after review. | Proportionate warning, temporary restriction or suspension; preserve appeal route. | Do not make a permanent automatic ban from one IP/device match or one allegation. |

## Safe pilot controls and data minimisation

### P0 — implement/operate before public audience

| Control | Current/minimal data | Measurable signal | False-positive risk |
| --- | --- | --- | --- |
| Enforce own-seller bid block | authenticated user id, Listing seller id | rejected self-bid count | low for direct ownership; does not detect friends |
| Append-only cancellation/non-performance reason and actor | Order/Listing ids, state, reason, timestamp, admin actor | cancellation rate by reason, overdue counts | reason can be incomplete; do not label fraud |
| Structured report with subject, category, free text and optional evidence | reporter id if logged in, target id/URL, submitted evidence | report volume/outcome/time-to-triage | malicious/low-quality reports |
| Manual moderation queue and reversible status | existing audit event, moderation outcome/reason | review age, hide/reinstate ratio | reviewer inconsistency |
| Rate-limit existing sensitive actions | user/request dimensions already supported by app security boundary | rejected rate-limit events | shared connections; never use as guilt evidence |

### P1 — only after written legal/data decision and operational owner

| Candidate | Additional personal/technical data | Why it needs review |
| --- | --- | --- |
| Risk correlation | device/browser/network/session signals, relation graph | privacy, retention, access, false-positive and appeal policy |
| Duplicate detection | image fingerprints/embeddings, text similarity, provenance documents | rights/biometric-like inference risk, review workflow, storage/retention |
| Seller verification tiers | identity/payment-provider result, business status | data minimisation, processor/transfer and fairness policy |
| Automated restriction score | history plus any above | explainability, adverse action/appeal and drift; unsuitable as low-volume first control |

## Duplicate / resale policy alternatives

| Option | Rule | Benefit | Risk / required decision |
| --- | --- | --- | --- |
| A. Creator-only pilot | Seller declares they created the Work; resale is not eligible. | Simplest value boundary and moderation. | Excludes legitimate owner resale; declaration alone is not authentication. |
| B. Creator + declared resale | Separate `creator`/`owner resale` role and provenance disclosure; no claim that platform authenticates. | Supports legitimate transfer while preserving truthful authorship. | Needs eligibility, wording, evidence/complaint handling and legal review. |
| C. Broad secondary marketplace | Owner resale is generally allowed with category rules. | Largest supply. | Conflicts with current creator/value focus and increases counterfeit/provenance burden. |

Recommendation for founder decision: A is the lowest-risk pilot boundary; B should
only follow a confirmed Work/provenance/complaint contract. C is not a current MVP
recommendation.

## Staged control plan

| Stage | Control | Signal / success measure | Do not claim |
| --- | --- | --- | --- |
| P0 | Direct self-bid prevention, reasoned cancellation, audited manual report/moderation, rate limits | Every intervention has actor, reason and reversible outcome; queue age measurable | That friends/multi-accounts are detected or fraud is prevented |
| P1 | Review playbook, duplicate/provenance report route, controlled temporary hold, appeal record | decision consistency and reinstatement rate | Authenticity guarantee or legal determination |
| Later | Data-minimised correlation after legal approval and calibrated review | precision/false-positive evidence from pilot | Fully autonomous enforcement |

## Minimum audit-event and retention questions

Minimum event facts: event type; target type/id; actor user/admin/system id where
applicable; prior/new status; reason code; immutable timestamp; request/correlation
id where already available; referenced report/evidence identifiers; disclosure
event and recipient when a contact is revealed. Store no photo blob, password,
payment credential or raw technical diagnostic in the audit event.

Retention questions for the BY/RF lawyer and data-map task:

1. Retention/deletion basis for bid, listing edit, order, report and moderation facts.
2. Separate retention/access policy for complaint attachments and identity/provenance.
3. Whether/when security/session/request identifiers may be linked to an abuse case.
4. Disclosure, correction, objection and appeal response procedure.
5. Processor/country requirements before any device, IP, image-similarity or identity data.

## Founder decisions (maximum 10)

1. Select A/B/C eligibility policy for creator work and legitimate owner resale.
2. Which cancellation reasons require mandatory admin review before a seller can reuse a Work?
3. Which report categories launch with MVP: IP, counterfeit/stolen, misleading card, safety, platform error?
4. When can a report cause temporary hide versus only a review queue?
5. Which sanctions are allowed in pilot: warning, temporary restriction, suspension; what appeal channel exists?
6. Is any identity verification justified before the pilot, and for which seller category?
7. Who owns daily review and what response expectation can be honestly published?
8. Is manual evidence collection acceptable without in-app chat, and how do parties submit it safely?
9. Does a cancelled/non-paying buyer event merely create a case or ever trigger automatic restriction?
10. Which retention/access answers are required before public reports and diagnostics open?

## Lawyer questions to merge into the legal pack

- Which abuse/security evidence is necessary and proportionate for BY/RF users,
  and on what basis may each category be retained and disclosed?
- What notice, explanation and appeal are required for temporary hide, restriction
  or suspension, including urgent safety/IP cases?
- Can a platform ask an accused seller for provenance/authenticity evidence and
  show it to reporter/buyer; what redaction is mandatory?
- What are lawful conditions for reporting a suspected crime/counterfeit to an
  authority and preserving relevant evidence?
- What terms may distinguish a creator from an owner-reseller without asserting
  authentication or authorship beyond reviewed evidence?

## Code touchpoint map — no implementation design

Current relevant boundaries are `apps/api/src/bids`, `orders`, `listings`,
`admin`, `auth`, `core/database`, `images` and `analytics`; mobile operational
surfaces are Activity, Order and admin moderation. Existing `AuditEvent`, user
status/session version, moderation cancellation and upload limits are useful
facts, not a finished abuse system. Any new report, evidence, correlation or
retention design must follow legal decisions and a separate security review.

## Unverified / intentionally excluded

- Private eBay/Catawiki/Whatnot detector features, device/network weighting,
  thresholds and internal investigation playbooks are `NOT VERIFIED`.
- Bidbaits current public control pages are `NOT VERIFIED`.
- No source establishes that an IP, device, payment/contact, image similarity,
  friendship or cancellation pattern proves shill bidding or fraud.
- This document does not prescribe a BY/RF retention period, processor, legal
  wording, automated score, permanent ban or authenticity guarantee.
