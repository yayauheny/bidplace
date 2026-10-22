import { View, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { designTokens } from '@bidplace/design-tokens';
import type { AuthProvider } from '@bidplace/contracts';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { AppText, TextButton } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { AuthGoogleIcon } from './auth-google-icon';
import { AuthTelegramIcon } from './auth-telegram-icon';
import { useAuthFlowAction } from './use-auth-flow-action';

export function ProviderButtons({
  intent = 'login',
  returnPath,
  size = 'auth',
  connected = [],
}: {
  intent?: 'login' | 'link';
  returnPath: string;
  size?: 'auth' | 'authDialog';
  connected?: AuthProvider[];
}) {
  const api = useApiClient();
  const action = useAuthFlowAction();
  const options = useQuery({
    queryKey: ['auth', 'options'],
    queryFn: ({ signal }) => api.auth.options({ signal }),
    retry: false,
  });
  const start = (provider: AuthProvider) =>
    void action.run(
      (signal) =>
        api.auth.startProvider(provider, { intent, returnPath }, { signal }),
      (result) => {
        if (Platform.OS === 'web') window.location.assign(result.url);
      },
    );
  return (
    <View style={{ gap: designTokens.auth.loginFormGap }}>
      {(['telegram', 'google'] as const).map((provider) => {
        const available =
          Platform.OS === 'web' &&
          options.data?.[provider] === true &&
          !connected.includes(provider);
        const name = provider === 'google' ? 'Google' : 'Telegram';
        return (
          <FigmaButton
            key={provider}
            label={
              connected.includes(provider)
                ? `${name} подключён`
                : `${intent === 'link' ? 'Подключить' : 'Войти с'} ${name}`
            }
            iconNode={
              provider === 'google' ? <AuthGoogleIcon /> : <AuthTelegramIcon />
            }
            variant="outline"
            size={size}
            width="full"
            disabled={!available || action.busy}
            loading={action.busy}
            accessibilityHint={
              available ? undefined : 'Способ входа пока недоступен'
            }
            onPress={() => start(provider)}
          />
        );
      })}
      {options.isPending ? (
        <AppText role="bodySmall">Проверяем способы входа…</AppText>
      ) : null}
      {options.isError ? (
        <TextButton
          label="Повторить проверку способов входа"
          onPress={() => void options.refetch()}
        />
      ) : null}
      {options.data && (!options.data.google || !options.data.telegram) ? (
        <AppText role="bodySmall" tone="secondary">
          Недоступные способы входа ещё не настроены.
        </AppText>
      ) : null}
      {action.error ? (
        <AppText
          role="bodySmall"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {action.error}
        </AppText>
      ) : null}
    </View>
  );
}
