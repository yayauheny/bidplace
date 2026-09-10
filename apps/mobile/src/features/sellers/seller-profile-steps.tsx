import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import type { ProfileFieldErrors } from './profile-validation';
import {
  authorApplicationStep,
  authorApplicationStepCount,
} from './seller-profile-wizard';

import {
  handoffContactTypeLabels,
  handoffInitiatorLabels,
  presentEnum,
} from '../../lib/presentation';

import {
  AppText,
  FormSection,
  SelectableRow,
  TextField,
} from '../../components/ui';

export type ProfileFields = {
  slug: string;
  fullName: string;
  discipline: string;
  country: string;
  city: string;
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
}: {
  profileStep: number;
  setProfileStep?: unknown;
  stepCount?: number;
}) {
  return (
    <AppText role="metadata" tone="secondary">
      Шаг {profileStep} из {authorApplicationStepCount}
    </AppText>
  );
}

export function SellerProfileFormSteps({
  isProfileCreation,
  profileStep,
  editable,
  fields,
  profile,
  fieldErrors,
  handoffContactError,
  update,
}: {
  isProfileCreation: boolean;
  profileStep: number;
  editable: boolean;
  fields: ProfileFields;
  profile?: SellerProfileForDisplay | null;
  fieldErrors: ProfileFieldErrors;
  handoffContactError: string | undefined;
  update: (key: keyof ProfileFields, value: string) => void;
}) {
  return (
    <>
      {(!isProfileCreation || profileStep === authorApplicationStep.identity) && (
        <FormSection
          title="Публичный профиль"
          description="Имя, адрес страницы и город будут на открытой странице автора."
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
        </FormSection>
      )}

      {(!isProfileCreation || profileStep === authorApplicationStep.about) && (
        <FormSection
          title="Раскройте себя как автора"
          description="Напишите о себе и укажите основные направления."
        >
          <TextField
            label="Дисциплина"
            value={fields.discipline}
            onChangeText={(value) => update('discipline', value)}
            placeholder="Керамика, живопись, текстиль"
            editable={editable}
            required
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

      {(!isProfileCreation || profileStep === authorApplicationStep.contacts) && (
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
            placeholder="HTTPS-ссылка, если есть"
            autoCapitalize="none"
            editable={editable}
            error={fieldErrors.socialLink}
          />
        </FormSection>
      )}

      {(!isProfileCreation || profileStep === authorApplicationStep.handoff) && (
        <FormSection
          title="Закрытый контакт"
          description="Контакт не публикуется. Он нужен только для передачи предмета."
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
                  profileStep === authorApplicationStep.handoff &&
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
  if (!isProfileCreation || profileStep !== authorApplicationStep.handoff) {
    return null;
  }

  return (
    <FormSection
      title="Проверка профиля"
      description="Публичная страница показывает имя, адрес, описание, фото и ссылки. Контакт передачи остаётся закрытым."
    >
      <AppText role="label">
        {fields.fullName || 'Имя автора'} · @{fields.slug || 'profile-address'}
      </AppText>
      <AppText role="bodySmall" tone="secondary">
        {fields.discipline || 'Дисциплина не заполнена'} ·{' '}
        {fields.country || 'Страна не заполнена'}
      </AppText>
    </FormSection>
  );
}

