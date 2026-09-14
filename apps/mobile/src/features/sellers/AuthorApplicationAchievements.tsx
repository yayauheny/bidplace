import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  FormSection,
  ResilientRemoteImage,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';
import { formatAchievementDate } from './achievement-date';

export function AuthorApplicationAchievements({
  editable,
}: {
  editable: boolean;
}) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageLabel, setImageLabel] = useState<string | null>(null);
  const application = useQuery({
    queryKey: ['seller', 'application'],
    queryFn: () => api.portfolio.getAuthorApplication(),
    retry: false,
  });

  const addAchievement = useMutation({
    mutationFn: () =>
      api.portfolio.addAuthorAchievement(
        { body: body.trim() },
        imageBlob ?? undefined,
      ),
    onSuccess: () => {
      setBody('');
      setImageBlob(null);
      setImageLabel(null);
      void queryClient.invalidateQueries({ queryKey: ['seller', 'application'] });
    },
  });

  const deleteAchievement = useMutation({
    mutationFn: (id: string) => api.portfolio.deleteAuthorAchievement(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['seller', 'application'] }),
  });

  const chooseImage = async () => {
    if (!editable) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    const blob = await fetch(asset.uri).then((response) => response.blob());
    setImageBlob(blob);
    setImageLabel(asset.fileName ?? 'Фото выбрано');
  };

  const achievements = application.data?.achievements ?? [];

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
        <AppText role="bodySmall" tone="danger">
          Не удалось загрузить достижения
        </AppText>
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
          {item.occurredAt ? (
            <AppText role="caption" tone="secondary">
              {formatAchievementDate(item.occurredAt)}
            </AppText>
          ) : null}
          <AppText role="bodySmall">{item.body}</AppText>
          {editable ? (
            <SecondaryButton
              label="Удалить"
              width="block"
              loading={
                deleteAchievement.isPending &&
                deleteAchievement.variables === item.id
              }
              onPress={() => deleteAchievement.mutate(item.id)}
            />
          ) : null}
        </View>
      ))}
      {editable ? (
        <>
          <TextField
            label="Описание достижения"
            value={body}
            onChangeText={setBody}
            placeholder="Выставка, публикация или награда"
            multiline
          />
          <SecondaryButton
            label={imageLabel ? `Фото: ${imageLabel}` : 'Добавить фото (необязательно)'}
            width="block"
            onPress={() => void chooseImage()}
          />
          <SecondaryButton
            label="Сохранить достижение"
            width="block"
            disabled={!body.trim() || addAchievement.isPending}
            loading={addAchievement.isPending}
            onPress={() => addAchievement.mutate()}
          />
        </>
      ) : null}
      {addAchievement.isError || deleteAchievement.isError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось обновить достижение
        </AppText>
      ) : null}
    </FormSection>
  );
}
