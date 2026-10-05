# WebKit `/products/new` — run 1

Code under test: `aaee551a798c1cb3fdefe2527f29acec1151cc9d`.
Command: dedicated media Playwright, workers 1, retries 0, disposable `bidplace_e2e`.
Captured before any rerun. The trace zip stays beside this note and is not committed because it contains a disposable session cookie.

Chromium in the same run passed the full lifecycle in 26.6s.
WebKit failed at `work-media-lifecycle.spec.ts:126` after 14.2s.

What the retained trace shows:

- Login, seller profile, application advance/submit, and profile reads returned 201/200.
- The page navigated to `/products/new`, the bundle started `main`, and the only console message was the existing `pointerEvents` warning. There was no page error.
- The category button `E2E art` was found, clicked, and the checkmark remained.
- Playwright `fill` on `Название *` completed without an error, but the following save snapshot and screenshot show an empty title, `Введите название`, and `Проверьте обязательные поля`.
- No `POST /api/products` was sent. Client validation blocked the empty title.
- Screenshot 1 is blank. Screenshot 2 shows the rendered creation form in that validation state.

Classification: test synchronization. The app refused an empty title. The media spec used raw `fill` instead of the existing `fillControl` helper, which retries until the controlled field actually holds the value.
