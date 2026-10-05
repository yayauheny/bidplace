# Full Chromium/WebKit gate

Code: `a8d0acb50be727ceda257289deb3c9d042beed66`.
Command: `playwright test --workers=1 --retries=0`.
Disposable `bidplace_e2e`. Result: 210 passed / 2 failed, 12.2m, exit 1.

Both failures are Home Opening visual debt at `home-opening-figma.spec.ts`.
Chromium mismatch `0.12231040564373898`. WebKit mismatch `0.12205687830687831`.
Threshold `0.12`. Compact-header timing did not fail. No other failure.
