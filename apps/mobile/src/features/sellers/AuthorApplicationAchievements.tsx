import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { z } from 'zod';

import { designTokens } from '@bidplace/design-tokens';

import { InfrastructureErrorState } from '../../components/shared/InfrastructureErrorState';
import { FigmaButton } from '../../components/figma/FigmaButton';
import {
  AppText,
  DateField,
  ResilientRemoteImage,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { getUserFacingErrorMessage, readFormFailure } from '../../errors';
import { getApiAssetUrl } from '../../lib/environment';
import {
  authKeys,
  canWritePrivateCache,
  sellerKeys,
  captureDraftWriteLease,
  currentAuthEpoch,
  draftWriteLeaseIsValid,
  refreshPrivateQuery,
} from '../../lib/query-cache';
import {
  DRAFT_STORAGE_ERROR_MESSAGE,
  clearFormDraft,
  createDraftWriter,
  draftWriteNeedsWarning,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
} from '../../lib/local-form-draft';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { useApiClient } from '../../providers/api-provider';
import type { User } from '@bidplace/contracts';
import {
  parseAchievementDateInput,
  formatAchievementDate,
  presentAchievementDateGroup,
} from './achievement-date';

let childWriteSequence = 0;

function nextChildWriteToken() {
  childWriteSequence += 1;
  return childWriteSequence;
}

const achievementDraftSchema = z.object({
  body: z.string(),
  dateInput: z.string(),
});

type AchievementDraft = {
  token: number;
  epoch: number;
  body: string;
  occurredDate: { year: number; month: number; day: number | null };
};

type AchievementDelete = {
  token: number;
  epoch: number;
  id: string;
};

export function AuthorApplicationAchievements({
  editable,
  parentBusy,
  parentOperation,
  onChildWrite,
  onDraftChange,
  onStorageError,
}: {
  editable: boolean;
  parentBusy: () => boolean;
  parentOperation: () => number;
  onChildWrite: (token: number, active: boolean) => void;
  onDraftChange?: (epoch: number, dirty: boolean) => void;
  onStorageError?: (message: string | null) => void;
}) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const draftWriter = useRef(createDraftWriter());
  const restoredAccount = useRef<string | null>(null);
  const accountId = canWritePrivateCache(queryClient, authEpoch)
    ? (queryClient.getQueryData<User | null>(authKeys.session)?.id ?? null)
    : null;
  const draftKey = accountId
    ? formDraftKey(accountId, 'seller-achievements', 'new')
    : null;
  const seenAuthEpoch = useRef(authEpoch);
  const sessionOperation = useRef(0);
  const writeToken = useRef(0);
  const parentBusyRef = useRef(parentBusy);
  const parentOperationRef = useRef(parentOperation);
  const onChildWriteRef = useRef(onChildWrite);
  const onDraftChangeRef = useRef(onDraftChange);
  const onStorageErrorRef = useRef(onStorageError);
  const editableRef = useRef(editable);
  parentBusyRef.current = parentBusy;
  parentOperationRef.current = parentOperation;
  onChildWriteRef.current = onChildWrite;
  onDraftChangeRef.current = onDraftChange;
  onStorageErrorRef.current = onStorageError;
  editableRef.current = editable;

  const [body, setBody] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [writeActive, setWriteActive] = useState(false);
  const [dateGroupError, setDateGroupError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  useEffect(() => {
    onDraftChangeRef.current?.(authEpoch, Boolean(body || dateInput));
  }, [authEpoch, body, dateInput]);
  useEffect(
    () => () => {
      onDraftChangeRef.current?.(authEpoch, false);
    },
    [authEpoch],
  );

  const application = useQuery({
    queryKey: sellerKeys.application,
    queryFn: async () => {
      const epoch = currentAuthEpoch(queryClient);
      const data = await api.portfolio.getAuthorApplication();
      if (!canWritePrivateCache(queryClient, epoch)) {
        throw new Error('Private cache is closed');
      }
      return data;
    },
    retry: false,
  });

  const releaseWrite = (token: number) => {
    if (writeToken.current !== token) return;
    writeToken.current = 0;
    setWriteActive(false);
    onChildWriteRef.current(token, false);
  };

  const addAchievement = useMutation({
    mutationFn: (variables: AchievementDraft) => {
      const input = {
        body: variables.body,
        occurredDate: variables.occurredDate,
      };
      return api.portfolio.addAuthorAchievement(input);
    },
    onSuccess: async (_saved, variables) => {
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      if (writeToken.current === variables.token) {
        setBody('');
        setDateInput('');
        setDateGroupError(null);
        setBodyError(null);
      }
      await refreshPrivateQuery(
        queryClient,
        ['seller', 'application'],
        variables.epoch,
      );
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      await queryClient.invalidateQueries({ queryKey: sellerKeys.profile });
    },
    onSettled: (_saved, _error, variables) => {
      releaseWrite(variables.token);
    },
  });

  const deleteAchievement = useMutation({
    mutationFn: (variables: AchievementDelete) =>
      api.portfolio.deleteAuthorAchievement(variables.id),
    onSuccess: async (_saved, variables) => {
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      await refreshPrivateQuery(
        queryClient,
        ['seller', 'application'],
        variables.epoch,
      );
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      await queryClient.invalidateQueries({ queryKey: sellerKeys.profile });
    },
    onSettled: (_saved, _error, variables) => {
      releaseWrite(variables.token);
    },
  });

  useEffect(() => {
    return () => {
      const token = writeToken.current;
      if (token !== 0) onChildWriteRef.current(token, false);
    };
  }, []);

  useEffect(() => {
    if (seenAuthEpoch.current === authEpoch) return;
    seenAuthEpoch.current = authEpoch;
    restoredAccount.current = null;
    sessionOperation.current += 1;
    const token = writeToken.current;
    writeToken.current = 0;
    setWriteActive(false);
    if (token !== 0) onChildWriteRef.current(token, false);
    setBody('');
    setDateInput('');
    setDateGroupError(null);
    setBodyError(null);
    addAchievement.reset();
    deleteAchievement.reset();
  }, [addAchievement, authEpoch, deleteAchievement]);

  // Restore the unfinished achievement (runs after the epoch reset above).
  useEffect(() => {
    const restoreMark = `${authEpoch}:${accountId ?? ''}`;
    if (restoredAccount.current === restoreMark) return;
    restoredAccount.current = restoreMark;
    if (!draftKey || !accountId) return;
    const stored = readFormDraft(draftKey, achievementDraftSchema);
    if (!stored || (!stored.body && !stored.dateInput)) return;
    setBody((current) => current || stored.body);
    setDateInput((current) => current || stored.dateInput);
  }, [accountId, authEpoch, draftKey]);

  // Persist while typing; an empty draft means the local copy is dropped.
  useEffect(() => {
    if (!draftKey) return;
    if (!body && !dateInput) {
      draftWriter.current.cancel();
      clearFormDraft(draftKey);
      return;
    }
    const account = accountId;
    const lease = captureDraftWriteLease(queryClient);
    draftWriter.current.schedule(() => {
      // The session lease (captured at schedule time) is retired when logout
      // begins and reissued only by the next session; a pending write cannot
      // be re-armed by re-scheduling before that.
      if (account === null || !draftWriteLeaseIsValid(queryClient, lease))
        return;
      const written = writeFormDraft(draftKey, { body, dateInput });
      // Only a failing storage API warns; a successful write clears only this
      // writer's error, not the form's.
      onStorageErrorRef.current?.(
        draftWriteNeedsWarning(written) ? DRAFT_STORAGE_ERROR_MESSAGE : null,
      );
    });
  }, [accountId, body, dateInput, draftKey]);

  useEffect(() => {
    return () => {
      draftWriter.current.flush();
    };
  }, []);

  const beginWrite = () => {
    if (
      writeToken.current !== 0 ||
      parentBusyRef.current() ||
      !editableRef.current
    )
      return null;
    const token = nextChildWriteToken();
    writeToken.current = token;
    setWriteActive(true);
    onChildWriteRef.current(token, true);
    return token;
  };

  const saveAchievement = () => {
    const parsedDate = parseAchievementDateInput(dateInput);
    const bodyText = body.trim();
    const nextBodyError = !bodyText
      ? 'Введите описание достижения'
      : bodyText.length > 4_000
        ? 'Введите описание короче 4000 символов'
        : null;
    setBodyError(nextBodyError);
    setDateGroupError(parsedDate.error);
    if (nextBodyError || !parsedDate.date) return;
    const token = beginWrite();
    if (token === null) return;
    const draft: AchievementDraft = {
      token,
      epoch: currentAuthEpoch(queryClient),
      body: bodyText,
      occurredDate: parsedDate.date,
    };
    addAchievement.mutate(draft);
  };

  const removeAchievement = (id: string) => {
    const token = beginWrite();
    if (token === null) return;
    deleteAchievement.mutate({
      token,
      epoch: currentAuthEpoch(queryClient),
      id,
    });
  };

  const achievements = application.data?.achievements ?? [];
  const savedAchievementError = addAchievement.error
    ? readFormFailure(addAchievement.error, ['body', 'occurredDate'])
    : null;
  const savedBodyError = savedAchievementError?.fields.body;
  const savedDateError = savedAchievementError?.fields.occurredDate
    ? presentAchievementDateGroup(savedAchievementError.fields.occurredDate)
    : null;
  const savedFormError =
    savedAchievementError && savedAchievementError.disposition !== 'passthrough'
      ? savedAchievementError.formMessage
      : addAchievement.isError
        ? getUserFacingErrorMessage(
            addAchievement.error,
            'Не удалось обновить достижение',
          )
        : null;

  return (
    <View style={{ gap: designTokens.space.x3 }}>
      {application.isLoading ? (
        <AppText role="bodySmall" tone="secondary">
          Загружаем достижения…
        </AppText>
      ) : null}
      {application.isError ? (
        <InfrastructureErrorState
          presentation="inline"
          onRetry={() => void application.refetch()}
        />
      ) : null}
      {achievements.map((item) => (
        <View key={item.id} style={{ gap: designTokens.space.x2 }}>
          {item.image ? (
            <ResilientRemoteImage
              uri={getApiAssetUrl(item.image.url)}
              component="AuthorAchievement"
              accessibilityLabel="Фото выставки или достижения автора"
              fallbackLabel="Фотография недоступна"
              style={{
                width: '100%',
                aspectRatio: 3 / 4,
                borderRadius: designTokens.radius.achievement,
              }}
            />
          ) : null}
          {item.occurredDate ? (
            <AppText role="caption" tone="secondary">
              {formatAchievementDate(item.occurredDate)}
            </AppText>
          ) : null}
          <AppText role="bodySmall">{item.body}</AppText>
          {editable ? (
            <SecondaryButton
              label="Удалить"
              width="block"
              disabled={writeActive}
              loading={
                deleteAchievement.isPending &&
                deleteAchievement.variables?.id === item.id
              }
              onPress={() => {
                removeAchievement(item.id);
              }}
            />
          ) : null}
        </View>
      ))}
      {editable ? (
        <>
          <DateField
            key={accountId ?? 'anonymous'}
            label="Дата достижения"
            value={dateInput}
            onChangeText={(value) => {
              if (writeToken.current !== 0 || parentBusyRef.current()) return;
              setDateInput(value);
              setDateGroupError(null);
              addAchievement.reset();
            }}
            editable={!writeActive}
            error={dateGroupError ?? savedDateError ?? undefined}
            variant="authorApplication"
          />
          <TextField
            label="Описание достижения"
            value={body}
            onChangeText={(value) => {
              if (writeToken.current !== 0 || parentBusyRef.current()) return;
              setBodyError(null);
              setBody(value);
            }}
            placeholder="Напишите краткое описание"
            editable={!writeActive}
            error={bodyError ?? savedBodyError}
            variant="authorApplication"
          />
          <View style={{ alignSelf: 'center' }}>
            <FigmaButton
              label="Добавить событие"
              variant="muted"
              size="event"
              icon="plus"
              width="content"
              disabled={!body.trim() || !dateInput.trim() || writeActive}
              loading={addAchievement.isPending}
              onPress={saveAchievement}
            />
          </View>
        </>
      ) : null}
      {savedFormError || deleteAchievement.isError ? (
        <AppText
          role="bodySmall"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {savedFormError ?? 'Не удалось обновить достижение'}
        </AppText>
      ) : null}
    </View>
  );
}
