# Registration discussion — settled by the DEC-105 revision

The notes below the revision were import-time proposals. Where they disagree
with the revision, the revision wins. Captures were not edited.

## Settled

1. Login stays the dialog sheet `526:14885` with email and password. Registration
   uses this full-screen sequence: `4547:23379`, `4547:24138`, `4547:24428`,
   `4547:25026`.
2. Email, nickname, and password are one form. The account is created by one
   `register` call. Mail failure after that call does not register again.
3. The nickname is `User.slug`. The name is entered later as
   `SellerProfile.fullName`. `displayName` is not the nickname and is not
   required for a new account.
4. One `User`. The author profile uses that account slug and does not edit
   another one. Existing `/authors/:slug` strings are copied onto `users.slug`
   and are not renamed. An account with no slug chooses it once, with the
   registration field, before the author profile is created. A slug that is
   already set is not changed in this wave. Publishing an old revision does
   not write `User.slug`. `User.slug` alone does not make a public author.
   Availability does not reserve the slug.
5. The email caption is not an account-existence check and not passwordless
   login. Recovery stays the single-use link. Exit confirmation and the history
   owner stay.

## Still open

The revision does not choose a public policy page. Neither auth bundle contains
one, and the app has no route. `acceptRules` already persists a version for a
signed-in user. Using it requires that page source, or a separate owner
decision that registration may proceed without persisted acceptance.

Styled ranges for `4547:23406` and `4547:25029` are not in the export. The
Google vector `I526:14901;298:6024;521:10381` has paths and no fills; this
bundle does not contain a replacement. Those are missing sources, not a second
registration flow.

This bundle has no back or close control. Browser leave continues to use the
existing history owner and exit confirmation. Do not draw a new control from
guessed geometry.
