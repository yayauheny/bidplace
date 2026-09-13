# S4 — auth forms, mobile web

## Scope

- Mobile web only: 390 px and the constrained `390 × 667` login viewport.
- Figma: `527:16954`, `527:16956`, `526:15581`, `292:5044`, `292:5058`.
- API calls, validation rules, redirects, analytics and auth schemas are
  unchanged.

## Result

`Implemented` for the reachable auth UI:

- auth titles use the shared 24/29 section heading;
- login and registration use full-width primary/outline actions;
- fields, labels, errors and buttons come from existing shared primitives;
- the forgot-password action follows the password field as in the phone frame;
- validation errors are readable Russian presentation text, including phone;
- login fits at `390 × 667`, has no horizontal overflow, and leaves the dock
  clear.

`Partial`: Figma `526:15581` describes registration completion, while the
current confirmed auth contract immediately authenticates and redirects after
successful registration. S4 does not invent an intermediate state or change
that behavior.

## Evidence

- `login-default-390.png`
- `login-errors-390.png`
- `login-390x667.png`
- `register-default-390.png`
- `register-errors-390.png`
- `forgot-default-390.png`
- `forgot-errors-390.png`
- `reset-invalid-390.png`

Focused ESLint and IDE diagnostics pass. Full mobile TypeScript reaches only
unrelated existing DOM-iterable errors in cover-frost/glass-dock e2e files and
`CreatorHeader.web.tsx`; no S4 file reports an error.
