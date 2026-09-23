import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import type { ProfileFieldErrors } from './profile-validation';
import { AppText, FormSection, SecondaryButton, TextField } from '../../components/ui';

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
  publicEmail: string;
  shortDescription: string;
};

export function SellerProfileCreationStepSelector({ profileStep, unlockedStep, onStepChange }: { profileStep: number; unlockedStep: number; onStepChange: (step: 1 | 2 | 3 | 4) => void }) {
  return <FormSection title="Заявка автора" description="Сохраните черновик и отправьте его на проверку, когда всё будет готово.">
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
      {(['Основная информация', 'Контакты', 'Об авторе', 'Выставки и достижения'] as const).map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4;
        return <SecondaryButton key={label} label={`${step}. ${label}`} disabled={step > unlockedStep} onPress={() => onStepChange(step)} />;
      })}
    </View>
    <AppText role="metadata" tone="secondary">Шаг {profileStep} из 4</AppText>
  </FormSection>;
}

export function SellerProfileFormSteps({ profileStep, showAllSteps, editable, fields, fieldErrors, update }: { profileStep: number; showAllSteps: boolean; editable: boolean; fields: ProfileFields; fieldErrors: ProfileFieldErrors; update: (key: keyof ProfileFields, value: string) => void }) {
  return <>
    {(showAllSteps || profileStep === 1) && <FormSection title="Основная информация" description="Эти данные увидят посетители после одобрения заявки.">
      <TextField label="Никнейм" value={fields.slug} onChangeText={(value) => update('slug', value)} placeholder="my-store" autoCapitalize="none" editable={editable} required />
      <TextField label="Имя или название" value={fields.fullName} onChangeText={(value) => update('fullName', value)} placeholder="Иван Иванов" editable={editable} required />
      <TextField label="Страна" value={fields.country} onChangeText={(value) => update('country', value)} placeholder="BY" autoCapitalize="characters" editable={editable} required />
      <TextField label="Город" value={fields.city} onChangeText={(value) => update('city', value)} placeholder="Минск" editable={editable} required error={fieldErrors.city} />
    </FormSection>}
    {(showAllSteps || profileStep === 2) && <FormSection title="Контакты" description="Все контакты необязательны и станут публичными только после одобрения.">
      <TextField label="Telegram" value={fields.telegramUrl} onChangeText={(value) => update('telegramUrl', value)} placeholder="@username" autoCapitalize="none" editable={editable} error={fieldErrors.telegramUrl} />
      <TextField label="Instagram" value={fields.instagramUrl} onChangeText={(value) => update('instagramUrl', value)} placeholder="@username" autoCapitalize="none" editable={editable} error={fieldErrors.instagramUrl} />
      <TextField label="Сайт" value={fields.websiteUrl} onChangeText={(value) => update('websiteUrl', value)} placeholder="https://example.com" autoCapitalize="none" editable={editable} error={fieldErrors.websiteUrl} />
      <TextField label="Публичный email" value={fields.publicEmail} onChangeText={(value) => update('publicEmail', value)} placeholder="hello@example.com" autoCapitalize="none" editable={editable} error={fieldErrors.publicEmail} />
    </FormSection>}
    {(showAllSteps || profileStep === 3) && <FormSection title="Раскройте себя как автора" description="Расскажите посетителям о вашем направлении и подходе.">
      <TextField label="Дисциплина" value={fields.discipline} onChangeText={(value) => update('discipline', value)} placeholder="Керамика, живопись, текстиль" editable={editable} required />
      <TextField label="Практика" value={fields.practice} onChangeText={(value) => update('practice', value)} placeholder="Авторская керамика" editable={editable} />
      <TextField label="Короткое описание" value={fields.shortDescription} onChangeText={(value) => update('shortDescription', value)} placeholder="Расскажите о себе и своих работах" multiline editable={editable} required />
    </FormSection>}
  </>;
}

export function SellerProfileVerificationSection({ fields }: { fields: ProfileFields }) {
  return <FormSection title="Проверка заявки" description="Проверьте данные перед отправкой на модерацию.">
    <AppText role="label">{fields.fullName || 'Имя автора'} · @{fields.slug || 'profile-address'}</AppText>
    <AppText role="bodySmall" tone="secondary">{fields.discipline || 'Дисциплина не заполнена'} · {fields.country || 'Страна не заполнена'}{fields.city.trim() ? ` · ${fields.city.trim()}` : ''}</AppText>
  </FormSection>;
}
