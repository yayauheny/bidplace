# Disposable email domains

Pinned commit: `81a8976e63879a11bf4301a28c14e0eb7a7855cf`

Source: <https://github.com/disposable-email-domains/disposable-email-domains>

Upstream file: `disposable_email_blocklist.conf`

Local file: `disposable-email-domains.txt`

License: CC0-1.0, copied as `LICENSE.txt` from the upstream `LICENSE.txt`.

SHA-256: `14f873c136310a4e9e8f25a692c67b211aa049eca7642f0c4a435a38b2af8b21`

The API loads this file locally. Registration and unverified email correction
check it. Login and password recovery do not. There is no per-address request
to the upstream project.

Update from a reviewed commit:

```sh
curl -fsSL -o apps/api/src/antifraud/auth/vendor/LICENSE.txt \
  https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/81a8976e63879a11bf4301a28c14e0eb7a7855cf/LICENSE.txt
curl -fsSL -o apps/api/src/antifraud/auth/vendor/disposable-email-domains.txt \
  https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/81a8976e63879a11bf4301a28c14e0eb7a7855cf/disposable_email_blocklist.conf
shasum -a 256 apps/api/src/antifraud/auth/vendor/disposable-email-domains.txt
```

Replace the commit SHA in these URLs with the newly reviewed revision, then
record that SHA and the new digest here.
