# Presentation and account discussion — unconfirmed

Import is authorized; implementation is not. The recommendations below are
proposals for founder discussion, not recorded decisions or executor instructions.

1. Keep quick password login in the previous sheet; use the new full-screen
   composition for deliberate multi-step registration. Do not switch modes merely
   because a field received focus; keep one state/form owner and scroll for keyboard.
2. If multi-step registration is adopted, collect email/name/password locally,
   then call existing registration once and show existing email verification.
   Do not create users at every step or send mail on every mount.
3. Keep account `displayName` as «Имя». Author slug and public author page belong
   to becoming an author. Availability and suggestions require a separate decision.
4. Separate explicit login/registration intent; the combined email caption alone
   does not justify a new lookup that exposes whether an account exists.
5. One account/settings entry; private account settings and public author page
   are sections of the same identity, with author capability added after approval.
   Keep their persistence/privacy boundaries. Purchases remain outside portfolio MVP.
6. Back between steps keeps values without an exit warning; leaving a filled
   flow reuses the existing exit confirmation. Before server creation, leave
   discards the local draft; after creation, leaving does not delete the account.
   Do not persist passwords/OTP in browser storage.
7. On wide screens preserve the agreed phone-column adaptation until a separate
   wide source is approved. Confirmation during registration stays in the full
   composition; standalone verification/recovery presentation needs a decision.

Resolve these together before implementation. Designer files are visual evidence,
not product instructions. The founder may keep registration single-form and adopt
only the full-screen layout instead of the proposed step sequence.
