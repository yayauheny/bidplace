import { BackButton } from '../../components/figma/BackButton';
import type { SellerProductDetailResponse } from '@bidplace/contracts';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { PrivateStoryImage } from '../../components/shared/PrivateStoryImage';
import { useAppTheme } from '../../providers/theme-provider';
import { productMediaStyle } from '../../components/ui/product-media-style';
import { DraftImageGrid, DraftImageRow } from './product-draft-images';
import type { EditableStoryBlock } from './use-product-story-editor';
import { useWatch } from 'react-hook-form';

import {
  AppText,
  FormSection,
  PrimaryButton,
} from '../../components/ui';
import { productDraftTermLabels, type ProductDraftFormValues } from './product-draft-form';

export type ProductDraftReviewStepProps = {
  categories: ReadonlyArray<{ id: string; name: string }>;
  selection?: SellerProductDetailResponse['selection'];
  catalog: Pick<SellerProductDetailResponse['selection'], 'materialTerms' | 'techniqueTerms'>;
  productId: string;
  sessionEpoch: number;
  images: Array<{
    id: string;
    url: string;
    position: number;
    mediaAssetId?: string | null;
  }>;
  blocks: EditableStoryBlock[];
  editable: boolean;
  submitLabel: string;

  wizardSubmitted: boolean;
  submitPending: boolean;
  submitError: boolean;
  onSubmitPress: () => void;
  onBackToStory: () => void;
};

export function ProductDraftReviewStep({
  categories,
  selection,
  catalog,
  productId,
  sessionEpoch,
  images,
  blocks,
  editable,
  submitLabel,
  wizardSubmitted,
  submitPending,
  submitError,
  onSubmitPress,
  onBackToStory,
}: ProductDraftReviewStepProps) {
  const values = useWatch<ProductDraftFormValues>();
  const title = values.title ?? '';
  const palette = useAppTheme();
  const category = values.categoryId
    ? categories.find((item) => item.id === values.categoryId)?.name ??
      (selection?.category?.id === values.categoryId ? selection.category.name : 'Название категории недоступно')
    : values.categoryProposal;
  const characteristics = [
    ['Категория', category],
    ['Материалы', productDraftTermLabels(values.materialTermIds ?? [], values.materialProposals ?? [], catalog.materialTerms, selection?.materialTerms ?? [])],
    ['Техники', productDraftTermLabels(values.techniqueTermIds ?? [], values.techniqueProposals ?? [], catalog.techniqueTerms, selection?.techniqueTerms ?? [])],
    ['Размеры', values.dimensions],
    ['Год создания', values.year],
    ['Уникальность', values.uniqueness],
  ] as const;
  return (
    <FormSection
      title="Проверка перед модерацией"
      description="Проверьте обязательные поля, изображения и историю создания. После отправки редактирование будет ограничено статусом модерации."
    >
      <AppText role="label">Название: {title.trim() || 'Не заполнено'}</AppText>
      <AppText role="bodySmall" tone="secondary">
        Изображения: {images.length}/10 · История:{' '}
        {blocks.length > 0 ? 'заполнена' : 'не заполнена'}
      </AppText>
      <View style={{ gap: designTokens.space.x3 }}>
        {characteristics.filter(([, value]) => value?.trim()).map(([label, value]) => (
          <AppText key={label} role="bodySmall">{label}: {value}</AppText>
        ))}
        <DraftImageGrid
          images={images}
          renderItem={(image) => (
            <DraftImageRow
              url={image.url}
              position={image.position}
              editable={false}
              isLast={false}
              isReordering={false}
              isRemoving={false}
              onMove={() => undefined}
              onDelete={() => undefined}
            />
          )}
        />
        {blocks.map((block) =>
          block.type === 'IMAGE' ? (
            <PrivateStoryImage
              key={block.key}
              productId={productId}
              sessionEpoch={sessionEpoch}
              mediaAssetId={block.mediaAssetId}
              galleryImageId={
                images.find(
                  (image) => image.mediaAssetId === block.mediaAssetId,
                )?.id
              }
              label={block.altText || 'Фото истории работы'}
              style={productMediaStyle('100%', palette)}
            />
          ) : (
            <AppText
              key={block.key}
              role="bodySmall"
              style={
                block.type === 'HEADING'
                  ? designTokens.typography.storyHeading
                  : undefined
              }
            >
              {block.text}
            </AppText>
          ),
        )}
      </View>
      {wizardSubmitted ? (
        <AppText role="bodySmall" tone="success">
          Предмет отправлен на модерацию.
        </AppText>
      ) : (
        <PrimaryButton
          label={submitLabel}
          loading={submitPending}
          disabled={!editable || images.length < 1}
          onPress={() => onSubmitPress()}
        />
      )}
      {submitError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось отправить предмет на модерацию. Проверьте обязательные поля
          и попробуйте ещё раз.
        </AppText>
      ) : null}
      <BackButton
        accessibilityHint="Назад к истории создания"
        disabled={submitPending || wizardSubmitted}
        onPress={() => onBackToStory()}
      />
    </FormSection>
  );
}
