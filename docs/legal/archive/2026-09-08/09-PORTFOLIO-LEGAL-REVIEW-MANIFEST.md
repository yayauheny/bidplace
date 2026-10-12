# Portfolio MVP legal review manifest

Status: `Prepared, external lawyer review pending`.

This manifest covers the portfolio-only release described by
[`../product/05-MVP-RFC.md`](../product/05-MVP-RFC.md). It is not legal advice and
does not approve publication of any draft.

## Documents and controls

| Document                              | Required control / evidence                                                                        | Launch status                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `drafts/01-user-agreement.md`         | Version ID and timestamp accepted during author registration; link visible before submission.      | Blocked: portfolio-only rewrite and lawyer review required.        |
| `drafts/02-privacy-policy.md`         | Link at registration and footer; factual provider/country/retention map.                           | Blocked: operator and infrastructure facts are `UNKNOWN`.          |
| `drafts/03-pd-consent.md`             | Separate only where lawyer identifies consent as the lawful basis; acceptance evidence by version. | Blocked: legal basis decision required.                            |
| `drafts/04-author-rules.md`           | Link before author application and Work submission; record accepted version.                       | Blocked: portfolio-only rewrite and lawyer review required.        |
| `drafts/06-prohibited.md`             | Footer/rightsholder contact and moderation workflow.                                               | Blocked: remove commerce-only conduct wording and confirm process. |
| `drafts/05-auction-and-sale-rules.md` | None for First MVP. Retained solely for a future commerce wave.                                    | Deferred.                                                          |

## Known factual inputs

- Account auth uses email/password, verification and recovery. Auth email is private.
- Author profile and Work media are moderated; approved public profile/Work is visible.
- `COMMERCE_ENABLED=false` is the default launch capability. No price, sale, bid,
  payment, delivery or contact reveal belongs in First MVP legal UX.
- Production media storage requires an S3-compatible provider. Email, hosting,
  analytics, provider countries, retention and deletion practices remain `UNKNOWN`.
- Cookies are not described as accepted until the deployed cookie/SDK inventory is
  captured. Essential-only operation must be confirmed from the release environment.

## Required lawyer answer package

Use [`06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md`](06-OPEN-QUESTIONS-FOR-BELARUS-LAWYER.md).
For each section A question, the lawyer should provide: `можно / нельзя / можно при
условиях`, governing norm, required control text, document section and retention or
evidence requirement. No lawyer approval has been received.

## Commerce-term classification

References to auction, bids, purchase, payment, delivery, buyer or lots are allowed
only in `drafts/05-auction-and-sale-rules.md` and the explicitly deferred section of
the lawyer questions. Their presence in any First MVP-facing draft is commerce leakage
and blocks publication until removed or reclassified.
