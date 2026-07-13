# Auth transport

Bidplace mobile and web use the API session cookie returned by `POST /api/auth/login` and `POST /api/auth/register`.

## Current behavior

- The API sets an httpOnly `bidplace_session` cookie.
- The mobile app does not store access tokens in AsyncStorage or SecureStore.
- `AuthProvider` restores session state by calling `GET /api/auth/me` on app start.
- `logout()` calls `POST /api/auth/logout`, then clears the React Query cache and local auth state.
- API requests use `credentials: 'include'`.

## Platform notes

- Web relies on browser cookie persistence.
- iOS and Android rely on the platform fetch cookie jar exposed by Expo/React Native.
- Telegram Mini App behavior should be rechecked if a different cookie container or webview boundary is introduced.

## Security notes

- No access token is persisted in client storage.
- The backend remains the only source of truth for auth, permissions, ownership, and moderation.
- Client route guards only improve UX and never replace server authorization.
