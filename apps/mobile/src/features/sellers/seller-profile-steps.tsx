import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { countryName } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { type FigmaIconName } from '../../components/figma/figma-icon-names';
import { type FigmaFieldVariant } from '../../components/figma/figma-text-field-style';
import { AppText, FormSection, TextField } from '../../components/ui';
import { FigmaSelectField } from '../../components/figma/FigmaSelectField';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';
import { CountryPickerSheet } from './country-picker-sheet';

export type ProfileFields = {
  slug: string;
  fullName: string;
  discipline: string;
  directionCategoryIds: string[];
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

export const requiredProfileMessages: Partial<
  Record<keyof ProfileFields, string>
> = {
  slug: 'Введите никнейм',
  fullName: 'Введите имя или название',
  country: 'Укажите страну',
  discipline: 'Укажите направление',
  directionCategoryIds: 'Выберите хотя бы одно направление',
  shortDescription: 'Добавьте короткое описание о себе',
};

const ProfileFieldWriteGuardContext = createContext<RefObject<boolean> | null>(
  null,
);

type RevealedRequirements = Partial<Record<keyof ProfileFields, true>>;

type ProfileRequirements = {
  revealed: RevealedRequirements;
  reveal: (names: readonly (keyof ProfileFields)[]) => void;
};

const ProfileRequirementContext = createContext<ProfileRequirements | null>(
  null,
);

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
    <ProfileRequirementContext.Provider value={value}>
      {children}
    </ProfileRequirementContext.Provider>
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
  requiredMarker = true,
  multiline,
  variant,
  icon,
  iconColor,
}: {
  name: Exclude<keyof ProfileFields, 'directionCategoryIds'>;
  label: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'characters';
  editable: boolean;
  /** Reveals the requirement message on blur. */
  required?: boolean;
  /** Adds the ` *` label marker. The basic-information step states requirements in its placeholders instead. */
  requiredMarker?: boolean;
  multiline?: boolean;
  variant?: FigmaFieldVariant;
  icon?: FigmaIconName;
  iconColor?: string;
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
    requiredMessage && revealed && !field.value.trim()
      ? requiredMessage
      : undefined;
  const message = schemaMessage ?? requirementMessage;
  return (
    <TextField
      ref={field.ref}
      label={label}
      required={required && requiredMarker}
      value={field.value}
      onBlur={() => {
        field.onBlur();
        if (requiredMessage && !field.value.trim()) requirements.reveal([name]);
      }}
      onChangeText={(value) => {
        if (guard.current) return;
        setValue(name, value, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        if (requiredMessage && !value.trim()) requirements.reveal([name]);
      }}
      placeholder={placeholder}
      autoCapitalize={autoCapitalize}
      editable={editable}
      multiline={multiline}
      variant={variant}
      icon={icon}
      iconColor={iconColor}
      error={typeof message === 'string' ? message : undefined}
    />
  );
}

/** Country is chosen from the `GET /countries` directory; the form keeps only the ISO code. */
function ProfileCountryField({ editable }: { editable: boolean }) {
  const guard = useContext(ProfileFieldWriteGuardContext);
  if (!guard) {
    throw new Error('Profile field write guard is missing');
  }
  const requirements = useContext(ProfileRequirementContext);
  if (!requirements) {
    throw new Error('Profile requirement scope is missing');
  }
  const { control, setValue } = useFormContext<ProfileFields>();
  const { field, fieldState } = useController({ control, name: 'country' });
  const [pickerOpen, setPickerOpen] = useState(false);
  const revealed = requirements.revealed.country === true;
  const requirementMessage =
    revealed && !field.value.trim()
      ? requiredProfileMessages.country
      : undefined;
  const message = fieldState.error?.message ?? requirementMessage;
  return (
    <>
      <FigmaSelectField
        label="Страна"
        placeholder="Страна (обязательное)"
        value={field.value ? (countryName(field.value) ?? '') : ''}
        disabled={!editable}
        error={typeof message === 'string' ? message : undefined}
        onPress={() => setPickerOpen(true)}
      />
      <CountryPickerSheet
        open={pickerOpen}
        selectedCode={field.value}
        onClose={() => {
          setPickerOpen(false);
          if (!field.value.trim()) requirements.reveal(['country']);
        }}
        onSelect={(code) => {
          setPickerOpen(false);
          if (guard.current) return;
          setValue('country', code, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }}
      />
    </>
  );
}

export function ProfileContactsFields({ editable }: { editable: boolean }) {
  return (
    <>
      <ProfileDraftField
        name="instagramUrl"
        label="Instagram"
        placeholder="Instagram"
        autoCapitalize="none"
        editable={editable}
        variant="authorApplication"
        icon="at-sign"
        iconColor={designTokens.color.muted}
      />
      <ProfileDraftField
        name="telegramUrl"
        label="Telegram"
        placeholder="Telegram"
        autoCapitalize="none"
        editable={editable}
        variant="authorApplication"
        icon="at-sign"
        iconColor={designTokens.color.muted}
      />
      <ProfileDraftField
        name="websiteUrl"
        label="Сайт"
        placeholder="Веб-сайт"
        autoCapitalize="none"
        editable={editable}
        variant="authorApplication"
      />
      <ProfileDraftField
        name="publicEmail"
        label="Почта"
        placeholder="Почта"
        autoCapitalize="none"
        editable={editable}
        variant="authorApplication"
      />
    </>
  );
}

export function ProfileAboutFields({ editable }: { editable: boolean }) {
  return (
    <>
      <ProfileDraftField
        name="shortDescription"
        label="Коротко о себе"
        placeholder="Коротко о себе, (обязательное)"
        editable={editable}
        required
        requiredMarker={false}
        variant="authorApplication"
      />
      <ProfileDraftField
        name="practice"
        label="Практика"
        placeholder="Практика и подход"
        editable={editable}
        variant="authorApplication"
      />
    </>
  );
}

/** Basic information of the author application; slug stays read-only after it is assigned. */
export function ProfileBasicsFields({
  editable,
  slugEditable,
}: {
  editable: boolean;
  slugEditable: boolean;
}) {
  return (
    <>
      <ProfileDraftField
        name="fullName"
        label="Имя или название"
        placeholder="Ваше имя фамилия, (обязательное)"
        editable={editable}
        required
        requiredMarker={false}
        variant="authorApplication"
      />
      <ProfileDraftField
        name="slug"
        label="Никнейм"
        placeholder="Никнейм, (обязательное)"
        autoCapitalize="none"
        editable={slugEditable}
        required
        requiredMarker={false}
        variant="authorApplication"
        icon="at-sign"
        iconColor={designTokens.color.muted}
      />
      <ProfileCountryField editable={editable} />
      <ProfileDraftField
        name="city"
        label="Город"
        placeholder="Город"
        editable={editable}
        variant="authorApplication"
      />
    </>
  );
}

export function SellerProfileCreationStepSelector({
  profileStep,
}: {
  profileStep: number;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Шаг ${profileStep} из 4`}
      accessibilityValue={{ min: 1, max: 4, now: profileStep }}
      style={{ flexDirection: 'row', gap: designTokens.space.x2 }}
    >
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor:
              step === profileStep
                ? designTokens.color.inkStrong
                : designTokens.color.border,
          }}
        />
      ))}
    </View>
  );
}

export function ProfileDirectionsControl({
  labels,
  error,
  editable,
  onOpen,
  onRemove,
}: {
  labels: readonly { id: string; name: string }[];
  error?: string;
  editable: boolean;
  onOpen: () => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <FigmaButton
        label="Выберите основные направления"
        variant="muted"
        size="navigation"
        contentAlign="navigation"
        icon="arrow-right-01"
        iconPosition="right"
        width="full"
        disabled={!editable}
        onPress={onOpen}
      />
      {labels.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: designTokens.space.authorChipGap,
          }}
        >
          {labels.map((direction) => (
            <FigmaChoiceChip
              key={direction.id}
              label={direction.name}
              selected
              removable={onRemove !== undefined}
              disabled={!editable}
              onPress={onOpen}
              onRemove={onRemove ? () => onRemove(direction.id) : undefined}
            />
          ))}
        </View>
      ) : null}
      {error ? (
        <AppText role="bodySmall" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function SellerProfileFormSteps({
  profileStep,
  showAllSteps,
  editable,
  slugEditable,
  directionLabels,
  directionsError,
  onOpenDirections,
}: {
  profileStep: number;
  showAllSteps: boolean;
  editable: boolean;
  slugEditable: boolean;
  directionLabels?: readonly { id: string; name: string }[];
  directionsError?: string;
  onOpenDirections?: () => void;
}) {
  return (
    <>
      {(showAllSteps || profileStep === 1) && (
        <FormSection
          title="Основная информация"
          description="Эти данные увидят посетители после одобрения заявки."
        >
          <ProfileBasicsFields
            editable={editable}
            slugEditable={slugEditable}
          />
        </FormSection>
      )}
      {(showAllSteps || profileStep === 2) && (
        <FormSection
          title="Контакты"
          description="Все контакты необязательны и станут публичными только после одобрения."
        >
          <ProfileContactsFields editable={editable} />
        </FormSection>
      )}
      {(showAllSteps || profileStep === 3) && (
        <FormSection
          title="Раскройте себя как автора"
          description="Расскажите посетителям о вашем направлении и подходе."
        >
          <ProfileAboutFields editable={editable} />
          {onOpenDirections ? (
            <ProfileDirectionsControl
              labels={directionLabels ?? []}
              error={directionsError}
              editable={editable}
              onOpen={onOpenDirections}
            />
          ) : null}
        </FormSection>
      )}
    </>
  );
}

export function SellerProfileVerificationSection() {
  const [fullName, slug, directionCategoryIds, country, city] = useWatch<
    ProfileFields,
    ['fullName', 'slug', 'directionCategoryIds', 'country', 'city']
  >({
    name: ['fullName', 'slug', 'directionCategoryIds', 'country', 'city'],
  });
  const directionsSummary =
    (directionCategoryIds?.length ?? 0) > 0
      ? `${directionCategoryIds.length} направлений`
      : 'Направления не выбраны';
  return (
    <FormSection
      title="Проверка заявки"
      description="Проверьте данные перед отправкой на модерацию."
    >
      <AppText role="label">
        {fullName || 'Имя автора'} · @{slug || 'profile-address'}
      </AppText>
      <AppText role="bodySmall" tone="secondary">
        {directionsSummary} · {country || 'Страна не заполнена'}
        {(city ?? '').trim() ? ` · ${(city ?? '').trim()}` : ''}
      </AppText>
    </FormSection>
  );
}
