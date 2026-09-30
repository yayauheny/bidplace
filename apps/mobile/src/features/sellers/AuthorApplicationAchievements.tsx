import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { InfrastructureErrorState } from '../../components/shared/InfrastructureErrorState';
import {
  AppText,
  FormSection,
  ResilientRemoteImage,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { canWritePrivateCache, currentAuthEpoch, refreshPrivateQuery } from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { useApiClient } from '../../providers/api-provider';
import { formatAchievementDate } from './achievement-date';

let childWriteSequence = 0;

function nextChildWriteToken() {
  childWriteSequence += 1;
  return childWriteSequence;
}

type AchievementDraft = {
  token: number;
  epoch: number;
  body: string;
  occurredDate: { year: number; month: number; day: number | null };
  image?: Blob;
};

type AchievementDelete = {
  token: number;
  epoch: number;
  id: string;
};

export function AuthorApplicationAchievements({
  editable,
  parentBusy,
  onChildWrite,
}: {
  editable: boolean;
  parentBusy: () => boolean;
  onChildWrite: (token: number, active: boolean) => void;
}) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const seenAuthEpoch = useRef(authEpoch);
  const sessionOperation = useRef(0);
  const imageSelection = useRef(0);
  const writeToken = useRef(0);
  const parentBusyRef = useRef(parentBusy);
  const onChildWriteRef = useRef(onChildWrite);
  const editableRef = useRef(editable);
  parentBusyRef.current = parentBusy;
  onChildWriteRef.current = onChildWrite;
  editableRef.current = editable;

  const [body, setBody] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageLabel, setImageLabel] = useState<string | null>(null);
  const [writeActive, setWriteActive] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const application = useQuery({
    queryKey: ['seller', 'application'],
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
      return variables.image
        ? api.portfolio.addAuthorAchievement(input, variables.image)
        : api.portfolio.addAuthorAchievement(input);
    },
    onSuccess: async (_saved, variables) => {
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      if (writeToken.current === variables.token) {
        setBody('');
        setYear('');
        setMonth('');
        setDay('');
        setImageBlob(null);
        setImageLabel(null);
        setPickerError(null);
      }
      await refreshPrivateQuery(queryClient, ['seller', 'application'], variables.epoch);
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      await queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
    },
    onSettled: (_saved, _error, variables) => {
      releaseWrite(variables.token);
    },
  });

  const deleteAchievement = useMutation({
    mutationFn: (variables: AchievementDelete) => api.portfolio.deleteAuthorAchievement(variables.id),
    onSuccess: async (_saved, variables) => {
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      await refreshPrivateQuery(queryClient, ['seller', 'application'], variables.epoch);
      if (!canWritePrivateCache(queryClient, variables.epoch)) return;
      await queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
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
    sessionOperation.current += 1;
    imageSelection.current += 1;
    const token = writeToken.current;
    writeToken.current = 0;
    setWriteActive(false);
    if (token !== 0) onChildWriteRef.current(token, false);
    setBody('');
    setYear('');
    setMonth('');
    setDay('');
    setImageBlob(null);
    setImageLabel(null);
    setPickerError(null);
    addAchievement.reset();
    deleteAchievement.reset();
  }, [addAchievement, authEpoch, deleteAchievement]);

  const beginWrite = () => {
    if (writeToken.current !== 0 || parentBusyRef.current() || !editableRef.current) return null;
    const token = nextChildWriteToken();
    writeToken.current = token;
    setWriteActive(true);
    onChildWriteRef.current(token, true);
    return token;
  };

  const saveAchievement = () => {
    const token = beginWrite();
    if (token === null) return;
    const draft: AchievementDraft = {
      token,
      epoch: currentAuthEpoch(queryClient),
      body: body.trim(),
      occurredDate: {
        year: Number(year),
        month: Number(month),
        day: day.trim() ? Number(day) : null,
      },
    };
    if (imageBlob) draft.image = imageBlob;
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

  const chooseImage = async () => {
    if (!editableRef.current || writeToken.current !== 0 || parentBusyRef.current()) return;
    const epoch = currentAuthEpoch(queryClient);
    const operation = sessionOperation.current;
    const selection = imageSelection.current + 1;
    imageSelection.current = selection;
    setPickerError(null);
    const stillOwns = () =>
      selection === imageSelection.current &&
      writeToken.current === 0 &&
      !parentBusyRef.current() &&
      editableRef.current &&
      sessionOperation.current === operation &&
      canWritePrivateCache(queryClient, epoch);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!stillOwns()) return;
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const blob = await fetch(asset.uri).then((response) => response.blob());
      if (!stillOwns()) return;
      setImageBlob(blob);
      setImageLabel(asset.fileName ?? 'Фото выбрано');
    } catch {
      if (!stillOwns()) return;
      setPickerError('Не удалось выбрать фото');
    }
  };

  const achievements = application.data?.achievements ?? [];
  const updateDraft = (apply: (value: string) => void) => (value: string) => {
    if (writeToken.current !== 0) return;
    apply(value);
  };

  return (
    <FormSection
      title="Выставки и достижения"
      description="Необязательное фото. Описание остаётся видимым. Публичная страница меняется только после одобрения."
    >
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
                deleteAchievement.isPending && deleteAchievement.variables?.id === item.id
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
          <TextField label="Год" value={year} onChangeText={updateDraft(setYear)} placeholder="2025" editable={!writeActive} />
          <TextField label="Месяц" value={month} onChangeText={updateDraft(setMonth)} placeholder="3" editable={!writeActive} />
          <TextField label="День (необязательно)" value={day} onChangeText={updateDraft(setDay)} placeholder="17" editable={!writeActive} />
          <TextField
            label="Описание достижения"
            value={body}
            onChangeText={updateDraft(setBody)}
            placeholder="Выставка, публикация или награда"
            multiline
            editable={!writeActive}
          />
          <SecondaryButton
            label={
              imageLabel
                ? `Фото: ${imageLabel}`
                : 'Добавить фото (необязательно)'
            }
            width="block"
            disabled={writeActive}
            onPress={() => void chooseImage()}
          />
          <SecondaryButton
            label="Сохранить достижение"
            width="block"
            disabled={!body.trim() || !year.trim() || !month.trim() || writeActive}
            loading={addAchievement.isPending}
            onPress={saveAchievement}
          />
        </>
      ) : null}
      {pickerError ? (
        <AppText role="bodySmall" tone="danger">
          {pickerError}
        </AppText>
      ) : null}
      {addAchievement.isError || deleteAchievement.isError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось обновить достижение
        </AppText>
      ) : null}
    </FormSection>
  );
}
