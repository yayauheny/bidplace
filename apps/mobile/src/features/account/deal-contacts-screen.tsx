import { useEffect, useRef, useState } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserContactsResponse } from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { BackButton } from '../../components/figma/BackButton';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { SettingsGroup, SettingsRow } from '../../components/figma/SettingsList';
import { FormPageShell } from '../../components/layout';
import { AppText, PrimaryButton, TextButton, TextField } from '../../components/ui';
import {
  canWritePrivateCache,
  commerceKeys,
  currentAuthEpoch,
  refreshAfterContactSave,
} from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import type { SafeRedirect } from '../auth/auth-redirect';
import {
  dealContactsLoginPath,
  draftFromContacts,
  submitDealContacts,
  type DealContactDraft,
} from './deal-contacts';

const HINT =
  'Для ставок и покупок нужен хотя бы один. Видны второй стороне заказа и поддержке.';

export function DealContactsScreen({
  redirectTo,
}: {
  redirectTo: SafeRedirect;
}) {
  const auth = useAuth();
  return (
    <DealContactsEditor
      key={auth.user?.id ?? 'signed-out'}
      userId={auth.user?.id ?? null}
      email={auth.user?.email ?? null}
      emailVerifiedAt={auth.user?.emailVerifiedAt ?? null}
      redirectTo={redirectTo}
    />
  );
}

function DealContactsEditor({
  userId,
  email,
  emailVerifiedAt,
  redirectTo,
}: {
  userId: string | null;
  email: string | null;
  emailVerifiedAt: string | null;
  redirectTo: SafeRedirect;
}) {
  const router = useRouter();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const saveAbort = useRef<AbortController | null>(null);
  const [draft, setDraft] = useState<DealContactDraft | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const contacts = useQuery({
    queryKey: commerceKeys.contacts(),
    queryFn: ({ signal }) => api.commerce.getContacts({ signal }),
    enabled: Boolean(userId),
    retry: false,
  });

  useEffect(() => () => saveAbort.current?.abort(), []);

  const loaded = contacts.data;
  const view = draft ?? (loaded ? draftFromContacts(loaded) : null);
  const leave = () => router.dismissTo(redirectTo as Href);
  const openLogin = () => {
    router.push({
      pathname: '/login',
      params: { redirectTo: dealContactsLoginPath(redirectTo) },
    });
  };

  const change = (field: keyof DealContactDraft, value: string | boolean) => {
    if (!loaded) return;
    setDraft((current) => ({
      ...(current ?? draftFromContacts(loaded)),
      [field]: value,
    }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const save = async () => {
    if (!loaded || !view || pending) return;
    const epoch = currentAuthEpoch(queryClient);
    const owns = () => canWritePrivateCache(queryClient, epoch);
    saveAbort.current?.abort();
    const controller = new AbortController();
    saveAbort.current = controller;
    setPending(true);
    setFormError(null);
    setNotice(null);
    const result = await submitDealContacts({
      loaded,
      draft: view,
      stillOwns: owns,
      update: (patch) =>
        api.commerce.updateContacts(patch, { signal: controller.signal }),
    });
    if (saveAbort.current === controller) setPending(false);
    if (result.kind === 'dropped') return;
    if (result.kind === 'unchanged') {
      setNotice('Изменений нет');
      return;
    }
    if (result.kind === 'invalid') {
      setFieldErrors({ [result.field]: result.message });
      return;
    }
    if (result.kind === 'stale-session') {
      openLogin();
      return;
    }
    if (result.kind === 'failed') {
      setFormError(result.message);
      return;
    }
    if (!canWritePrivateCache(queryClient, epoch)) return;
    queryClient.setQueryData(commerceKeys.contacts(), result.contacts);
    await refreshAfterContactSave(queryClient, epoch);
    router.replace(redirectTo as Href);
  };

  return (
    <FormPageShell hideDock variant="settings">
      <View style={{ gap: designTokens.space.x5 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BackButton onPress={leave} />
          <AppText role="settingsTitle" tone="strong">
            Контакты для сделок
          </AppText>
          <FigmaIconButton
            icon="x"
            size="settingsHeader"
            iconSize={designTokens.size.settingsHeaderGlyph}
            label="Закрыть контакты"
            onPress={leave}
          />
        </View>
        <AppText role="bodySmall">{HINT}</AppText>
        <EmailLine email={email} verified={emailVerifiedAt !== null} />
        {contacts.isPending ? (
          <AppText role="bodySmall">Загружаем контакты…</AppText>
        ) : null}
        {contacts.isError ? (
          <LoadError
            error={contacts.error}
            onLogin={openLogin}
            onRetry={() => void contacts.refetch()}
          />
        ) : null}
        {view ? (
          <ContactFields
            view={view}
            loaded={loaded}
            fieldErrors={fieldErrors}
            formError={formError}
            notice={notice}
            pending={pending}
            onChange={change}
            onSave={() => void save()}
          />
        ) : null}
      </View>
    </FormPageShell>
  );
}

function EmailLine({
  email,
  verified,
}: {
  email: string | null;
  verified: boolean;
}) {
  return (
    <View style={{ gap: designTokens.space.x1 }}>
      <AppText role="settingsSection">Почта</AppText>
      <AppText role="body">{email ?? 'Почта не указана'}</AppText>
      {verified ? (
        <AppText role="bodySmall">Подтверждена. Изменить здесь нельзя.</AppText>
      ) : (
        <AppText role="bodySmall">Почта не подтверждена.</AppText>
      )}
    </View>
  );
}

function LoadError({
  error,
  onLogin,
  onRetry,
}: {
  error: unknown;
  onLogin: () => void;
  onRetry: () => void;
}) {
  const stale = error instanceof ApiClientError && error.status === 401;
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="bodySmall" tone="danger">
        {stale
          ? 'Войдите снова, чтобы открыть контакты.'
          : 'Не удалось загрузить контакты.'}
      </AppText>
      {stale ? (
        <TextButton label="Войти" onPress={onLogin} />
      ) : (
        <TextButton label="Повторить загрузку контактов" onPress={onRetry} />
      )}
    </View>
  );
}

function ContactFields({
  view,
  loaded,
  fieldErrors,
  formError,
  notice,
  pending,
  onChange,
  onSave,
}: {
  view: DealContactDraft;
  loaded: UserContactsResponse | undefined;
  fieldErrors: Record<string, string>;
  formError: string | null;
  notice: string | null;
  pending: boolean;
  onChange: (field: keyof DealContactDraft, value: string | boolean) => void;
  onSave: () => void;
}) {
  return (
    <View style={{ gap: designTokens.space.x4 }}>
      <TextField
        label="Телефон"
        value={view.phone}
        onChangeText={(value) => onChange('phone', value)}
        error={fieldErrors.phone}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        inputMode="tel"
      />
      <TextField
        label="Telegram"
        value={view.telegram}
        onChangeText={(value) => onChange('telegram', value)}
        error={fieldErrors.telegram}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />
      <TextField
        label="Instagram"
        value={view.instagram}
        onChangeText={(value) => onChange('instagram', value)}
        error={fieldErrors.instagram}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />
      <TextField
        label="VK"
        value={view.vk}
        onChangeText={(value) => onChange('vk', value)}
        error={fieldErrors.vk}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />
      {loaded && loaded.showToBuyer !== null && view.showToBuyer !== null ? (
        <SettingsGroup label="Покупатель">
          <SettingsRow
            icon="view"
            label="Показывать мои контакты покупателю"
            toggle={{
              value: view.showToBuyer,
              disabled: pending,
              onChange: (value) => onChange('showToBuyer', value),
            }}
          />
        </SettingsGroup>
      ) : null}
      {notice ? <AppText role="bodySmall">{notice}</AppText> : null}
      {formError ? (
        <AppText role="bodySmall" tone="danger">
          {formError}
        </AppText>
      ) : null}
      <PrimaryButton
        label="Сохранить"
        width="block"
        loading={pending}
        disabled={pending || !loaded}
        onPress={onSave}
      />
    </View>
  );
}
