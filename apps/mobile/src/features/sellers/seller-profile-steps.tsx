import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, type RefObject } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText, FormSection, TextField } from '../../components/ui';

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

export const requiredProfileMessages: Partial<Record<keyof ProfileFields, string>> = {
  slug: 'Введите никнейм',
  fullName: 'Введите имя или название',
  country: 'Укажите страну',
  city: 'Укажите город',
  discipline: 'Укажите направление',
  shortDescription: 'Добавьте короткое описание о себе',
};

const ProfileFieldWriteGuardContext = createContext<RefObject<boolean> | null>(null);

type RevealedRequirements = Partial<Record<keyof ProfileFields, true>>;

type ProfileRequirements = {
  revealed: RevealedRequirements;
  reveal: (names: readonly (keyof ProfileFields)[]) => void;
};

const ProfileRequirementContext = createContext<ProfileRequirements | null>(null);

export type ProfileRequirementControls = {
  reveal: (names: readonly (keyof ProfileFields)[]) => void;
};

export function ProfileRequirementScope({
  epoch,
  controls,
  children,
}: {
  epoch: number;
  controls: RefObject<ProfileRequirementControls>;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState<RevealedRequirements>({});
  const [seenEpoch, setSeenEpoch] = useState(epoch);
  if (seenEpoch !== epoch) {
    setSeenEpoch(epoch);
    setRevealed({});
  }
  const reveal = useCallback((names: readonly (keyof ProfileFields)[]) => {
    setRevealed((current) => {
      let changed = false;
      const next = { ...current };
      for (const name of names) {
        if (next[name]) continue;
        next[name] = true;
        changed = true;
      }
      return changed ? next : current;
    });
  }, []);
  const visibleRevealed = seenEpoch === epoch ? revealed : {};
  controls.current = { reveal };
  const value = useMemo(
    () => ({ revealed: visibleRevealed, reveal }),
    [visibleRevealed, reveal],
  );
  return (
    <ProfileRequirementContext.Provider value={value}>{children}</ProfileRequirementContext.Provider>
  );
}

export function ProfileFieldWriteGuard({
  guard,
  children,
}: {
  guard: RefObject<boolean>;
  children: ReactNode;
}) {
  return (
    <ProfileFieldWriteGuardContext.Provider value={guard}>
      {children}
    </ProfileFieldWriteGuardContext.Provider>
  );
}

function ProfileDraftField({
  name,
  label,
  placeholder,
  autoCapitalize,
  editable,
  required,
  multiline,
}: {
  name: keyof ProfileFields;
  label: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'characters';
  editable: boolean;
  required?: boolean;
  multiline?: boolean;
}) {
  const guard = useContext(ProfileFieldWriteGuardContext);
  if (!guard) {
    throw new Error('Profile field write guard is missing');
  }
  const requirements = useContext(ProfileRequirementContext);
  if (!requirements) {
    throw new Error('Profile requirement scope is missing');
  }
  const { control, setValue } = useFormContext<ProfileFields>();
  const { field, fieldState } = useController({ control, name });
  const requiredMessage = required ? requiredProfileMessages[name] : undefined;
  const revealed = requirements.revealed[name] === true;
  const schemaMessage = fieldState.error?.message;
  const requirementMessage =
    requiredMessage && revealed && !field.value.trim() ? requiredMessage : undefined;
  const message = schemaMessage ?? requirementMessage;
  return (
    <TextField
      ref={field.ref}
      label={label}
      value={field.value}
      onBlur={() => {
        field.onBlur();
        if (requiredMessage && !field.value.trim()) requirements.reveal([name]);
      }}
      onChangeText={(value) => {
        if (guard.current) return;
        setValue(name, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        if (requiredMessage && !value.trim()) requirements.reveal([name]);
      }}
      placeholder={placeholder}
      autoCapitalize={autoCapitalize}
      editable={editable}
      required={required}
      multiline={multiline}
      error={typeof message === 'string' ? message : undefined}
    />
  );
}

export function SellerProfileCreationStepSelector({ profileStep }: { profileStep: number }) {
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 4, now: profileStep }} style={{ alignItems: 'center', gap: designTokens.space.x2 }}>
    <View style={{ flexDirection: 'row', gap: designTokens.space.x2 }}>
      {[1, 2, 3, 4].map((step) => <View key={step} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: step <= profileStep ? designTokens.color.ink : designTokens.color.border }} />)}
    </View>
    <AppText role="metadata" tone="secondary">Шаг {profileStep} из 4</AppText>
  </View>;
}

export function SellerProfileFormSteps({
  profileStep,
  showAllSteps,
  editable,
}: {
  profileStep: number;
  showAllSteps: boolean;
  editable: boolean;
}) {
  return <>
    {(showAllSteps || profileStep === 1) && <FormSection title="Основная информация" description="Эти данные увидят посетители после одобрения заявки.">
      <ProfileDraftField name="slug" label="Никнейм" placeholder="my-store" autoCapitalize="none" editable={editable} required />
      <ProfileDraftField name="fullName" label="Имя или название" placeholder="Иван Иванов" editable={editable} required />
      <ProfileDraftField name="country" label="Страна" placeholder="BY" autoCapitalize="characters" editable={editable} required />
      <ProfileDraftField name="city" label="Город" placeholder="Минск" editable={editable} required />
    </FormSection>}
    {(showAllSteps || profileStep === 2) && <FormSection title="Контакты" description="Все контакты необязательны и станут публичными только после одобрения.">
      <ProfileDraftField name="telegramUrl" label="Telegram" placeholder="@username" autoCapitalize="none" editable={editable} />
      <ProfileDraftField name="instagramUrl" label="Instagram" placeholder="@username" autoCapitalize="none" editable={editable} />
      <ProfileDraftField name="websiteUrl" label="Сайт" placeholder="https://example.com" autoCapitalize="none" editable={editable} />
      <ProfileDraftField name="publicEmail" label="Публичный email" placeholder="hello@example.com" autoCapitalize="none" editable={editable} />
    </FormSection>}
    {(showAllSteps || profileStep === 3) && <FormSection title="Раскройте себя как автора" description="Расскажите посетителям о вашем направлении и подходе.">
      <ProfileDraftField name="discipline" label="Дисциплина" placeholder="Керамика, живопись, текстиль" editable={editable} required />
      <ProfileDraftField name="practice" label="Практика" placeholder="Авторская керамика" editable={editable} />
      <ProfileDraftField name="shortDescription" label="Короткое описание" placeholder="Расскажите о себе и своих работах" multiline editable={editable} required />
    </FormSection>}
  </>;
}

export function SellerProfileVerificationSection() {
  const [fullName, slug, discipline, country, city] = useWatch<
    ProfileFields,
    ['fullName', 'slug', 'discipline', 'country', 'city']
  >({
    name: ['fullName', 'slug', 'discipline', 'country', 'city'],
  });
  return <FormSection title="Проверка заявки" description="Проверьте данные перед отправкой на модерацию.">
    <AppText role="label">{fullName || 'Имя автора'} · @{slug || 'profile-address'}</AppText>
    <AppText role="bodySmall" tone="secondary">{discipline || 'Дисциплина не заполнена'} · {country || 'Страна не заполнена'}{(city ?? '').trim() ? ` · ${(city ?? '').trim()}` : ''}</AppText>
  </FormSection>;
}
