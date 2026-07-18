# Task A — Product / Listing implementation report

Date: 2026-07-19
Branch: `feature/product-listing-model`
Starting SHA: `50c3753`  
Final SHA: documentation commit for this report.

## Delivered model and behavior

- Canonical storage is `SellerProfile → Product → Listing → AuctionRules → Bid → Order`; Product and Order use immutable public IDs and Listing is BYN-only.
- The baseline migration, clean reset and deterministic seed establish the schema and partial indexes for an active Listing and Order.
- Bids are idempotent, phone-verified, serializable and soft-close aware. Lifecycle close is race-tested against bids and creates the deterministic winning Order.
- Activity derives buyer status, including WON, without public bidder identity. Orders authorize buyer, seller and admin; replacement stays a manual admin control.
- Test OTP writes only an explicit local `TEST_OTP_FILE`; production still requires a real transport. Realtime is a refetch signal over canonical HTTP snapshots.
- Seller draft editing, Product image upload/delete/reorder and compact admin review exist. Lot/central Auction surface, reserve, Buy Now and USD runtime elements are removed.

## Chromium E2E

`apps/mobile/playwright.config.ts` starts real API and Expo web servers against isolated `bidplace_e2e`, seeds buyer/seller/admin/outsider identities, and retains trace/screenshot only on failure.

The passing suite verifies:

1. Product → UI login → unverified bid rejection → test OTP → accepted Bid/current price → Activity → controlled Listing close → canonical Order.
2. Outsider cannot open that Order; ordinary user gets 403 for an admin operation; admin can read the Order.
3. `/auctions/legacy` is unmatched, and Product UI has no reserve, Buy Now or USD.

E2E found and fixed browser fetch receiver loss in `packages/api-client`: selected fetch implementations are wrapped before invocation.

## Verification evidence

- Frozen install after the Playwright dependency change.
- Full lint, full typecheck, API build and Expo web export.
- Prisma validation, isolated reset and seed.
- Existing unit suite and PostgreSQL integration suite.
- Chromium E2E: 3 passed.

## Task A commits

- `a52b1d7` lifecycle close-vs-Bid coverage.
- `c85c81c` client seller/admin flows.
- `40ab66b` Product image management.
- `ef2c832` Activity WON derivation.
- `e590516` generated Prisma Client ignore strategy.
- `ea1f18a` closed-pilot verification preparation.
- Follow-up commits complete E2E, fixes and this report.

## Definition of Done

Task A is **completed for closed pilot with manual controls**. Task B visual redesign has not started on this branch.

## Post-Task-B release hardening TODO

- WebKit and full cross-browser matrix.
- Physical-device QA.
- Visual regression.
- Exhaustive seller/admin E2E.
- Full accessibility automation.
- Expanded ten-session browser rehearsal.
