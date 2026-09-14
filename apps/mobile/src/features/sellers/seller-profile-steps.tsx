import type { Dispatch, SetStateAction } from 'react';

import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import type { ProfileFieldErrors } from './profile-validation';

import {
  handoffContactTypeLabels,
  handoffInitiatorLabels,
  presentEnum,
} from '../../lib/presentation';

import {
  AppText,
  FormSection,
  SelectableRow,
  SecondaryButton,
  TextField,
} from '../../components/ui';

export type ProfileFields = {
  slug: string;
  fullName: string;
  discipline: string;
  country: string;
  city: string;
  practice: string;
  socialLink: string;
  telegramUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  shortDescription: string;
  handoffContactType: 'TELEGRAM' | 'PHONE' | 'INSTAGRAM';
  handoffContactValue: string;
  handoffInitiator: 'BUYER_CONTACTS_SELLER' | 'SELLER_CONTACTS_BUYER';
};

export type SellerProfileForDisplay = Pick<
  ProfileFields,
  'handoffContactType' | 'handoffContactValue' | 'handoffInitiator'
>;

export function SellerProfileCreationStepSelector({
  profileStep,
  setProfileStep,
  stepCount = 3,
}: {
  profileStep: number;
  setProfileStep: Dispatch<SetStateAction<number>>;
  stepCount?: number;
}) {
  return (
    <FormSection
      title="Создание профиля"
      description="Соберите публичную страницу автора и отдельно укажите закрытые данные для передачи предмета."
    >
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: designTokens.space.x2,
        }}
      >
        {['Об авторе', 'Публичные ссылки', 'Передача и проверка'].map(
          (label, index) => {
            const step = index + 1;
            return (
              <SecondaryButton
                key={label}
                label={`${step}. ${label}`}
                disabled={step > profileStep}
                onPress={() => setProfileStep(step)}
              />
            );
          },
        )}
      </View>
      <AppText role="metadata" tone="secondary">
        Шаг {profileStep} из {stepCount}
      </AppText>
    </FormSection>
  );
}

export function SellerProfileFormSteps({
  isProfileCreation,
  profileStep,
  editable,
  fields,
  profile,
  fieldErrors,
  hasPublicLink,
  handoffContactError,
  update,
}: {
  isProfileCreation: boolean;
  profileStep: number;
  editable: boolean;
  fields: ProfileFields;
  profile?: SellerProfileForDisplay | null;
  fieldErrors: ProfileFieldErrors;
  hasPublicLink: boolean;
  handoffContactError: string | undefined;
  update: (key: keyof ProfileFields, value: string) => void;
}) {
  return (
    <>
      {(!isProfileCreation || profileStep === 1) && (
        <FormSection
          title="Публичный профиль"
          description="Эти данные увидят коллекционеры на странице автора."
        >
          <TextField
            label="URL-slug"
            value={fields.slug}
            onChangeText={(value) => update('slug', value)}
            placeholder="my-store"
            autoCapitalize="none"
            editable={editable}
            required
          />
          <TextField
            label="Имя или название"
            value={fields.fullName}
            onChangeText={(value) => update('fullName', value)}
            placeholder="Иван Иванов"
            editable={editable}
            required
          />
          <TextField
            label="Страна"
            value={fields.country}
            onChangeText={(value) => update('country', value)}
            placeholder="BY"
            autoCapitalize="characters"
            editable={editable}
            required
          />
          <TextField
            label="Город"
            value={fields.city}
            onChangeText={(value) => update('city', value)}
            placeholder="Минск"
            editable={editable}
            required
            error={fieldErrors.city}
          />
          <TextField
            label="Дисциплина"
            value={fields.discipline}
            onChangeText={(value) => update('discipline', value)}
            placeholder="Керамика, живопись, текстиль"
            editable={editable}
            required
          />
          <TextField
            label="Практика"
            value={fields.practice}
            onChangeText={(value) => update('practice', value)}
            placeholder="Авторская керамика"
            editable={editable}
          />
          <TextField
            label="Публичная ссылка"
            value={fields.socialLink}
            onChangeText={(value) => update('socialLink', value)}
            placeholder="https://t.me/..."
            autoCapitalize="none"
            editable={editable}
            error={fieldErrors.socialLink}
          />
          <TextField
            label="Короткое описание"
            value={fields.shortDescription}
            onChangeText={(value) => update('shortDescription', value)}
            placeholder="Расскажите о себе и своих работах"
            multiline
            editable={editable}
            required
          />
        </FormSection>
      )}

      {(!isProfileCreation || profileStep === 2) && (
        <FormSection
          title="Публичные ссылки"
          description="Эти ссылки попадут на открытую страницу автора."
        >
          <TextField
            label="Telegram"
            value={fields.telegramUrl}
            onChangeText={(value) => update('telegramUrl', value)}
            placeholder="https://t.me/username"
            autoCapitalize="none"
            editable={editable}
            error={fieldErrors.telegramUrl}
          />
          <TextField
            label="Instagram"
            value={fields.instagramUrl}
            onChangeText={(value) => update('instagramUrl', value)}
            placeholder="https://instagram.com/username"
            autoCapitalize="none"
            editable={editable}
            error={fieldErrors.instagramUrl}
          />
          <TextField
            label="Сайт"
            value={fields.websiteUrl}
            onChangeText={(value) => update('websiteUrl', value)}
            placeholder="https://example.com"
            autoCapitalize="none"
            editable={editable}
            error={fieldErrors.websiteUrl}
          />
          <TextField
            label="Основная публичная ссылка"
            value={fields.socialLink}
            onChangeText={(value) => update('socialLink', value)}
            placeholder="Одна ссылка обязательна"
            autoCapitalize="none"
            editable={editable}
            required
            error={fieldErrors.socialLink}
          />
          {!hasPublicLink ? (
            <AppText role="bodySmall" tone="danger">
              Добавьте хотя бы одну публичную ссылку.
            </AppText>
          ) : null}
        </FormSection>
      )}

      {(!isProfileCreation || profileStep === 3) && (
        <FormSection
          title="Передача предмета"
          description="Контакт используется для передачи предмета после завершения аукциона."
        >
          {!profile || editable ? (
            <>
              <SelectableRow
                label="Способ передачи"
                value={fields.handoffContactType}
                options={Object.entries(handoffContactTypeLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(value) =>
                  update(
                    'handoffContactType',
                    value as ProfileFields['handoffContactType'],
                  )
                }
                disabled={!editable}
              />
              <TextField
                label="Контакт для передачи"
                value={fields.handoffContactValue}
                onChangeText={(value) =>
                  update('handoffContactValue', value)
                }
                placeholder="@username или +375..."
                autoCapitalize="none"
                editable={editable}
                error={
                  isProfileCreation &&
                  profileStep === 3 &&
                  !fields.handoffContactValue.trim()
                    ? 'Укажите контакт для передачи'
                    : handoffContactError
                }
              />
              <SelectableRow
                label="Кто начинает контакт"
                value={fields.handoffInitiator}
                options={Object.entries(handoffInitiatorLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(value) =>
                  update(
                    'handoffInitiator',
                    value as ProfileFields['handoffInitiator'],
                  )
                }
                disabled={!editable}
              />
            </>
          ) : (
            <View style={{ gap: designTokens.space.x2 }}>
              <AppText role="bodySmall" tone="secondary">
                {presentEnum(
                  profile.handoffContactType,
                  handoffContactTypeLabels,
                  'Неизвестный тип контакта',
                )}
                : {profile.handoffContactValue}
              </AppText>
              <AppText role="bodySmall" tone="secondary">
                Инициатор:{' '}
                {presentEnum(
                  profile.handoffInitiator,
                  handoffInitiatorLabels,
                  'Неизвестный режим контакта',
                )}
              </AppText>
            </View>
          )}
        </FormSection>
      )}
    </>
  );
}

export function SellerProfileVerificationSection({
  isProfileCreation,
  profileStep,
  fields,
}: {
  isProfileCreation: boolean;
  profileStep: number;
  fields: ProfileFields;
}) {
  if (!isProfileCreation || profileStep !== 3) return null;

  return (
    <FormSection
      title="Проверка профиля"
      description="Публичная страница показывает имя, адрес, описание, фото и ссылки. Контакт передачи остаётся закрытым до завершения сделки."
    >
      <AppText role="label">
        {fields.fullName || 'Имя автора'} · @{fields.slug || 'profile-address'}
      </AppText>
      <AppText role="bodySmall" tone="secondary">
        {fields.discipline || 'Дисциплина не заполнена'} ·{' '}
        {fields.country || 'Страна не заполнена'}
        {fields.city.trim() ? ` · ${fields.city.trim()}` : ''}
      </AppText>
    </FormSection>
  );
}

