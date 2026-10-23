import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthProvider } from '@bidplace/contracts';
import * as oidc from 'openid-client';
import { SERVER_ENV, type ServerEnv } from '../core/config';

@Injectable()
export class OidcProvidersService {
  private readonly configurations = new Map<
    AuthProvider,
    Promise<oidc.Configuration>
  >();
  constructor(@Inject(SERVER_ENV) private readonly env: ServerEnv) {}

  settings(provider: AuthProvider) {
    const prefix = provider === 'google' ? 'GOOGLE' : 'TELEGRAM';
    const clientId = this.env[`${prefix}_CLIENT_ID`];
    const secret = this.env[`${prefix}_CLIENT_SECRET`];
    const redirectUri = this.env[`${prefix}_REDIRECT_URI`];
    if (!clientId || !secret || !redirectUri)
      throw new ServiceUnavailableException('Способ входа пока недоступен');
    return { clientId, secret, redirectUri };
  }

  options() {
    return {
      google: Boolean(this.env.GOOGLE_CLIENT_ID),
      telegram: Boolean(this.env.TELEGRAM_CLIENT_ID),
      emailCode: true,
    };
  }

  private configuration(provider: AuthProvider): Promise<oidc.Configuration> {
    let pending = this.configurations.get(provider);
    if (!pending) {
      const { clientId, secret } = this.settings(provider);
      const issuer =
        this.env.OIDC_TEST_ISSUER ??
        (provider === 'google'
          ? 'https://accounts.google.com'
          : 'https://oauth.telegram.org');
      pending = oidc
        .discovery(
          new URL(issuer),
          clientId,
          secret,
          oidc.ClientSecretBasic(secret),
          {
            execute: this.env.OIDC_TEST_ISSUER
              ? [oidc.allowInsecureRequests, oidc.enableNonRepudiationChecks]
              : [oidc.enableNonRepudiationChecks],
          },
        )
        .catch(() => {
          this.configurations.delete(provider);
          throw new ServiceUnavailableException(
            'Сервис входа временно недоступен',
          );
        });
      this.configurations.set(provider, pending);
    }
    return pending;
  }

  async authorization(
    provider: AuthProvider,
    state: string,
    nonce: string,
    verifier: string,
  ): Promise<string> {
    const configuration = await this.configuration(provider);
    return oidc.buildAuthorizationUrl(configuration, {
      redirect_uri: this.settings(provider).redirectUri,
      scope: provider === 'google' ? 'openid email profile' : 'openid profile',
      response_type: 'code',
      state,
      nonce,
      code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
      code_challenge_method: 'S256',
    }).href;
  }

  async exchange(
    provider: AuthProvider,
    query: string,
    state: string,
    nonce: string,
    verifier: string,
  ) {
    const configuration = await this.configuration(provider);
    const callback = new URL(this.settings(provider).redirectUri);
    callback.search = query;
    try {
      const tokens = await oidc.authorizationCodeGrant(
        configuration,
        callback,
        {
          expectedState: state,
          expectedNonce: nonce,
          pkceCodeVerifier: verifier,
          idTokenExpected: true,
        },
      );
      const claims = tokens.claims();
      if (!claims) throw new UnauthorizedException();
      const email =
        typeof claims.email === 'string'
          ? claims.email.trim().toLowerCase()
          : null;
      const authoritative =
        provider === 'google' &&
        claims.email_verified === true &&
        email !== null &&
        (email.endsWith('@gmail.com') ||
          (typeof claims.hd === 'string' && claims.hd.length > 0));
      return {
        issuer: claims.iss,
        subject: claims.sub,
        email,
        emailProof: authoritative ? email : null,
      };
    } catch {
      throw new UnauthorizedException(
        'Не удалось подтвердить вход. Попробуйте ещё раз',
      );
    }
  }
}
