import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiClient } from '@bidplace/api-client';
import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';
import { FormPageShell, FormPageColumns } from '../../components/layout';
import { BackButton } from '../../components/figma/BackButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { WorkGallery } from '../../components/figma/WorkGallery';
import {
  AppDialog,
  AppText,
  FormSection,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { MediaDeliveryNotice } from '../../components/shared/MediaDeliveryNotice';
import { PrivateStoryImage } from '../../components/shared/PrivateStoryImage';
import { useApiClient } from '../../providers/api-provider';
import { formatAchievementDate } from '../sellers/achievement-date';
import { currentAuthEpoch } from '../../lib/query-cache';
import { readFormFailure } from '../../errors';
import {
  presentEnum,
  productStatusLabels,
  sellerStatusLabels,
} from '../../lib/presentation';
import {
  AdminAchievementImage,
  AdminReviewImage,
  AdminRevisionPhoto,
} from './AdminRevisionPhoto';
import { AdminWorkCatalogProposals } from './AdminWorkCatalogProposals';
import {
  moderationComparison,
  moderationStoryChanged,
  moderationPhotoChanges,
  parentTarget,
} from './admin-moderation-state';

type ProductDetail = Awaited<
  ReturnType<ApiClient['admin']['getProductDetail']>
>;
type SellerDetail = Awaited<ReturnType<ApiClient['admin']['getSellerDetail']>>;
type Detail =
  | { kind: 'products'; data: ProductDetail }
  | { kind: 'authors'; data: SellerDetail };
type Action =
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'SUSPENDED'
  | 'RESTORE';
const actionNames: Record<Action, string> = {
  RESTORE: 'Восстановить публикацию',
  APPROVED: 'Одобрить',
  CHANGES_REQUESTED: 'Запросить исправления',
  REJECTED: 'Отклонить',
  ARCHIVED: 'Скрыть работу',
  SUSPENDED: 'Приостановить автора',
};
const tabs = [
  { value: 'preview', label: 'Просмотр' },
  { value: 'changes', label: 'Изменения' },
  { value: 'history', label: 'История' },
];

export function AdminModerationDetail({
  id,
  kind,
}: {
  id: string;
  kind: 'products' | 'authors';
}) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState('preview');
  const [showAll, setShowAll] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    detail: Detail;
    action: Action;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [nextError, setNextError] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const saving = useRef(false);
  const queryKey = ['admin', 'detail', kind, id];
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }): Promise<Detail> =>
      kind === 'products'
        ? { kind, data: await api.admin.getProductDetail(id, { signal }) }
        : { kind, data: await api.admin.getSellerDetail(id, { signal }) },
  });
  const history = useInfiniteQuery({
    queryKey: ['admin', 'history', kind, id],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      kind === 'products'
        ? api.admin.getProductHistory(
            id,
            { limit: 20, ...(pageParam ? { cursor: pageParam } : {}) },
            { signal },
          )
        : api.admin.getSellerHistory(
            id,
            { limit: 20, ...(pageParam ? { cursor: pageParam } : {}) },
            { signal },
          ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: tab === 'history',
  });
  const decision = useMutation({
    mutationFn: async ({
      detail,
      action,
      reason: inputReason,
    }: {
      detail: Detail;
      action: Action;
      reason: string;
    }) => {
      if (detail.kind === 'products') {
        if (action === 'SUSPENDED') throw new Error('Недоступное действие');
        const entity = detail.data.entity;
        return api.admin.updateProductStatus(id, {
          status: action === 'RESTORE' ? 'APPROVED' : action,
          reason: inputReason.trim() || undefined,
          target:
            action === 'ARCHIVED' || action === 'RESTORE'
              ? parentTarget({
                  status: entity.parentStatus,
                  updatedAt: entity.parentUpdatedAt,
                })
              : detail.data.decisionTarget,
        });
      }
      if (action === 'ARCHIVED') throw new Error('Недоступное действие');
      const entity = detail.data.entity;
      return api.admin.updateSellerStatus(id, {
        status: action === 'RESTORE' ? 'APPROVED' : action,
        reason: inputReason.trim() || undefined,
        target:
          action === 'SUSPENDED' || action === 'RESTORE'
            ? parentTarget({
                status: entity.parentStatus,
                updatedAt: entity.parentUpdatedAt,
              })
            : detail.data.decisionTarget,
      });
    },
  });
  const refresh = async () => {
    await query.refetch();
    void queryClient.invalidateQueries({ queryKey: ['admin', 'queue'] });
  };
  const submit = async () => {
    if (!confirmation || saving.current || stale) return;
    if (
      !['APPROVED', 'RESTORE'].includes(confirmation.action) &&
      !reason.trim()
    ) {
      setFailure('Укажите причину решения.');
      return;
    }
    saving.current = true;
    const epoch = currentAuthEpoch(queryClient);
    setFailure(null);
    try {
      await decision.mutateAsync({ ...confirmation, reason });
      if (currentAuthEpoch(queryClient) !== epoch) return;
      setConfirmation(null);
      setReason('');
      setSuccess(
        'Решение принято. Фактический статус публикации показан ниже.',
      );
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (error) {
      if (currentAuthEpoch(queryClient) !== epoch) return;
      const conflict =
        error instanceof ApiClientError && error.kind === 'conflict';
      setStale(conflict);
      setFailure(
        conflict
          ? 'Решение не применено: данные или условия публикации изменились. Обновите заявку и проверьте ограничения. Причина сохранена.'
          : (readFormFailure(error, []).formMessage ??
              'Решение не сохранено. Попробуйте ещё раз.'),
      );
    } finally {
      saving.current = false;
    }
  };
  const detail = query.data;
  if (!detail)
    return (
      <FormPageShell>
        <BackButton onPress={() => router.back()} />
        <InfrastructurePageStatus
          status={query.isError ? 'error' : 'loading'}
          onRetry={() => void query.refetch()}
        />
      </FormPageShell>
    );
  const entity = detail.data.entity;
  const review = detail.data.reviewRevision;
  const published = detail.data.publishedRevision;
  const content = review?.content ?? entity.parent;
  const title =
    'title' in content ? (content.title ?? 'Без названия') : content.fullName;
  const fields = moderationComparison(published?.content ?? null, content);
  const canDecide =
    !entity.hasBlockingListing &&
    (review?.status === 'PENDING_REVIEW' ||
      (!review && entity.parentStatus === 'PENDING_REVIEW'));
  const recovering =
    entity.parentStatus === 'ARCHIVED' || entity.parentStatus === 'SUSPENDED';
  const open = (action: Action) => {
    if (saving.current) return;
    setConfirmation({ action, detail });
    setFailure(null);
    setStale(false);
  };
  const approvalBlocked =
    detail.kind === 'products' &&
    (detail.data.entity.sellerProfile.status !== 'APPROVED' ||
      detail.data.reviewRevision?.selection.proposals.some(
        (proposal) => proposal.selected && proposal.status !== 'APPROVED',
      ));
  const actions = (
    <View
      style={{
        gap: designTokens.space.x2,
        paddingTop: designTokens.space.x2,
        width: '100%',
        maxWidth: designTokens.layout.actionColumnMax,
        alignSelf: 'flex-end',
      }}
    >
      {canDecide ? (
        <PrimaryButton
          label="Одобрить"
          width="block"
          disabled={decision.isPending || approvalBlocked}
          onPress={() => open('APPROVED')}
        />
      ) : null}
      {recovering ? (
        <SecondaryButton
          label="Восстановить публикацию"
          disabled={
            decision.isPending ||
            entity.hasBlockingListing ||
            (detail.kind === 'products' &&
              detail.data.entity.sellerProfile.status !== 'APPROVED')
          }
          onPress={() => open('RESTORE')}
        />
      ) : null}
      {approvalBlocked ? (
        <AppText role="bodySmall" tone="danger">
          Для одобрения нужен одобренный автор и решённые каталоговые
          предложения.
        </AppText>
      ) : null}
      {canDecide ? (
        <View style={{ flexDirection: 'row', gap: designTokens.space.x2 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label="Исправления"
              width="block"
              disabled={decision.isPending}
              onPress={() => open('CHANGES_REQUESTED')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label="Отклонить"
              width="block"
              disabled={decision.isPending}
              onPress={() => open('REJECTED')}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
  return (
    <View testID="admin-moderation-detail" style={{ flex: 1, minWidth: 0 }}>
      <FormPageShell bottomAction={actions}>
        <BackButton onPress={() => router.back()} />
        <PageHeader title={title} />
        {query.isError ? (
          <>
            <AppText role="bodySmall" tone="danger">
              Не удалось обновить заявку. Показана сохранённая версия.
            </AppText>
            <SecondaryButton
              label="Обновить заявку"
              onPress={() => void refresh()}
            />
          </>
        ) : null}
        {detail.kind === 'products' ? (
          <AppText role="bodySmall">
            {detail.data.entity.sellerProfile.fullName} · @
            {detail.data.entity.sellerProfile.slug}
          </AppText>
        ) : null}
        <View style={{ gap: designTokens.space.x1 }}>
          <AppText role="bodySmall">
            Сущность:{' '}
            {presentEnum(
              entity.parentStatus,
              detail.kind === 'products'
                ? productStatusLabels
                : sellerStatusLabels,
              'Статус неизвестен',
            )}
          </AppText>
          <AppText role="bodySmall">
            Редакция:{' '}
            {review
              ? presentEnum(
                  review.status,
                  detail.kind === 'products'
                    ? productStatusLabels
                    : sellerStatusLabels,
                  'Статус неизвестен',
                )
              : 'Нет проверяемой редакции'}
          </AppText>
          <AppText role="caption" tone="secondary">
            {review?.submittedAt
              ? `Отправлено ${new Date(review.submittedAt).toLocaleString('ru-RU')}`
              : 'Дата отправки неизвестна'}
          </AppText>
          {entity.publication ? (
            <MediaDeliveryNotice delivery={entity.publication} />
          ) : null}
          {entity.hasBlockingListing ? (
            <AppText role="bodySmall" tone="danger">
              Действия ограничены активной публикацией продажи.
            </AppText>
          ) : null}
          {success ? (
            <AppText role="bodySmall" accessibilityLiveRegion="polite">
              {success}
            </AppText>
          ) : null}
        </View>
        <FigmaTabs
          tabs={tabs}
          value={tab}
          onChange={setTab}
          label="Просмотр заявки"
          panelId="moderation-detail"
        />
        <View
          nativeID="moderation-detail"
          role="tabpanel"
          aria-labelledby={`moderation-detail-${tab}`}
          style={{ gap: designTokens.space.sectionGap }}
        >
          {tab === 'preview' ? (
            <>
              <FormPageColumns
                layout="adaptive"
                sidebar={<ReviewMedia detail={detail} />}
              >
                <View style={{ gap: designTokens.space.sectionGap }}>
                  {detail.kind === 'products' && detail.data.reviewRevision ? (
                    <FormSection title="Каталог">
                      <AppText role="body">
                        Категория:{' '}
                        {detail.data.reviewRevision.selection.category?.name ??
                          'Не выбрана'}
                      </AppText>
                      <AppText role="bodySmall">
                        Материалы:{' '}
                        {detail.data.reviewRevision.selection.materialTerms
                          .map((term) => term.name)
                          .join(', ') || 'Не указаны'}
                      </AppText>
                      <AppText role="bodySmall">
                        Техники:{' '}
                        {detail.data.reviewRevision.selection.techniqueTerms
                          .map((term) => term.name)
                          .join(', ') || 'Не указаны'}
                      </AppText>
                    </FormSection>
                  ) : null}
                  {detail.kind === 'authors' ? (
                    <AuthorAchievements detail={detail.data} />
                  ) : null}
                  <FormSection title="Сведения">
                    {fields.map((field) => (
                      <View
                        key={field.key}
                        style={{ gap: designTokens.space.x1 }}
                      >
                        <AppText role="label">{field.label}</AppText>
                        <AppText role="body">{field.after}</AppText>
                      </View>
                    ))}
                  </FormSection>
                  {detail.kind === 'products' && detail.data.reviewRevision ? (
                    <>
                      <AdminWorkCatalogProposals
                        proposals={
                          detail.data.reviewRevision.selection.proposals
                        }
                        onChanged={() => void refresh()}
                      />
                      <FormSection title="Этапы создания">
                        {detail.data.reviewRevision.story.blocks.length ? (
                          detail.data.reviewRevision.story.blocks.map(
                            (block) => (
                              <View key={block.id}>
                                {block.type === 'IMAGE' ? (
                                  <PrivateStoryImage
                                    productId={id}
                                    mediaAssetId={block.mediaAssetId}
                                    sessionEpoch={currentAuthEpoch(queryClient)}
                                    label={block.altText ?? 'Этап создания'}
                                    style={{
                                      width: '100%',
                                      aspectRatio:
                                        designTokens.ratio.productPortrait,
                                    }}
                                  />
                                ) : (
                                  <AppText role="body">{block.text}</AppText>
                                )}
                              </View>
                            ),
                          )
                        ) : (
                          <AppText role="bodySmall">
                            Дополнительные этапы не указаны.
                          </AppText>
                        )}
                      </FormSection>
                    </>
                  ) : null}
                  {entity.lastModerationReason ? (
                    <FormSection title="Предыдущее решение">
                      <AppText role="body">
                        {entity.lastModerationReason}
                      </AppText>
                    </FormSection>
                  ) : null}
                  {entity.parentStatus === 'APPROVED' &&
                  !entity.hasBlockingListing ? (
                    <SecondaryButton
                      label={
                        detail.kind === 'products'
                          ? 'Скрыть работу'
                          : 'Приостановить автора'
                      }
                      onPress={() =>
                        open(
                          detail.kind === 'products' ? 'ARCHIVED' : 'SUSPENDED',
                        )
                      }
                    />
                  ) : null}
                </View>
              </FormPageColumns>
            </>
          ) : tab === 'changes' ? (
            <>
              <AppText role="bodySmall" tone="secondary">
                {published
                  ? 'Сравнение с опубликованной редакцией'
                  : 'Опубликованный снимок отсутствует. Показана новая редакция; исторические данные не восстанавливаются.'}
              </AppText>
              <TextButton
                label={showAll ? 'Только изменения' : 'Показать все поля'}
                onPress={() => setShowAll(!showAll)}
              />
              {fields
                .filter((field) => showAll || field.changed)
                .map((field) => (
                  <FormSection key={field.key} title={field.label}>
                    {published ? (
                      <AppText role="bodySmall" tone="secondary">
                        Было: {field.before}
                      </AppText>
                    ) : null}
                    <AppText role="body">
                      {published ? 'Стало: ' : ''}
                      {field.after}
                    </AppText>
                  </FormSection>
                ))}
              {fields.every((field) => !field.changed) ? (
                <AppText role="bodySmall">
                  Текстовые поля не изменились.
                </AppText>
              ) : null}
              <StoryComparison detail={detail} showAll={showAll} />
              <CatalogComparison detail={detail} showAll={showAll} />
              <PhotoComparison detail={detail} />
            </>
          ) : (
            <FormSection title="История модерации">
              {history.isPending || history.isError ? (
                <InfrastructurePageStatus
                  status={history.isError ? 'error' : 'loading'}
                  onRetry={() => void history.refetch()}
                />
              ) : history.data?.pages.every(
                  (page) => page.events.length === 0,
                ) ? (
                <AppText role="body">История решений отсутствует.</AppText>
              ) : (
                history.data?.pages
                  .flatMap((page) => page.events)
                  .map((event) => (
                    <View key={event.id} style={{ gap: designTokens.space.x1 }}>
                      <AppText role="label">
                        {event.action === 'SUBMITTED'
                          ? 'Редакция отправлена'
                          : event.action === 'DECISION'
                            ? 'Решение администратора'
                            : event.action === 'PUBLICATION_COMPLETED'
                              ? event.oldStatus === 'ARCHIVED' ||
                                event.oldStatus === 'SUSPENDED'
                                ? 'Публикация восстановлена'
                                : 'Публикация завершена'
                              : 'Историческое событие'}
                      </AppText>
                      <AppText role="caption">
                        {new Date(event.createdAt).toLocaleString('ru-RU')}
                      </AppText>
                      {event.newStatus ? (
                        <AppText role="bodySmall">
                          {presentEnum(
                            event.newStatus,
                            detail.kind === 'products'
                              ? productStatusLabels
                              : sellerStatusLabels,
                            'Статус неизвестен',
                          )}
                        </AppText>
                      ) : null}
                      <AppText role="caption" tone="secondary">
                        Проверяющий: {event.actorUserId ?? 'неизвестен'} ·
                        Редакция: {event.revisionId ?? 'неизвестна'}
                      </AppText>
                      {event.reason ? (
                        <AppText role="body">{event.reason}</AppText>
                      ) : null}
                    </View>
                  ))
              )}
              {history.hasNextPage ? (
                <SecondaryButton
                  label="Ещё события"
                  loading={history.isFetchingNextPage}
                  onPress={() => void history.fetchNextPage()}
                />
              ) : null}
            </FormSection>
          )}
        </View>
        {nextError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось загрузить следующую заявку. Повторите переход или
            вернитесь к очереди.
          </AppText>
        ) : null}
        {success ? (
          <SecondaryButton
            label="Следующая заявка"
            onPress={async () => {
              setNextError(false);
              const epoch = currentAuthEpoch(queryClient);
              try {
                const page =
                  detail.kind === 'products'
                    ? await api.admin.listProductSummaries({ limit: 2 })
                    : await api.admin.listSellerSummaries({ limit: 2 });
                if (currentAuthEpoch(queryClient) !== epoch) return;
                const next = page.items.find((item) => item.id !== id);
                if (next)
                  router.replace({
                    pathname:
                      detail.kind === 'products'
                        ? '/admin/products/[id]'
                        : '/admin/authors/[id]',
                    params: { id: next.id },
                  });
                else router.back();
              } catch {
                setNextError(true);
              }
            }}
          />
        ) : null}
        <AppDialog
          open={confirmation !== null}
          title={confirmation ? actionNames[confirmation.action] : 'Решение'}
          onClose={() => {
            if (!saving.current) setConfirmation(null);
          }}
        >
          <AppText role="body">
            {confirmation &&
            ['APPROVED', 'RESTORE'].includes(confirmation.action)
              ? 'Подтвердите одобрение этой редакции. Публикация станет доступна после завершения доставки медиа.'
              : 'Укажите понятную причину для автора.'}
          </AppText>
          {confirmation &&
          !['APPROVED', 'RESTORE'].includes(confirmation.action) ? (
            <TextField
              label="Причина решения"
              value={reason}
              onChangeText={setReason}
              multiline
              editable={!decision.isPending}
            />
          ) : null}
          {failure ? (
            <AppText role="bodySmall" tone="danger" accessibilityRole="alert">
              {failure}
            </AppText>
          ) : null}
          {stale ? (
            <SecondaryButton
              label="Обновить заявку"
              onPress={() => {
                setConfirmation(null);
                void refresh();
              }}
            />
          ) : (
            <PrimaryButton
              label="Подтвердить решение"
              loading={decision.isPending}
              onPress={() => void submit()}
            />
          )}
          <TextButton
            label="Отмена"
            disabled={decision.isPending}
            onPress={() => setConfirmation(null)}
          />
        </AppDialog>
      </FormPageShell>
    </View>
  );
}

function ReviewMedia({ detail }: { detail: Detail }) {
  if (detail.kind === 'authors') {
    const review = detail.data.reviewRevision;
    return review?.content.profilePhoto ? (
      <AdminRevisionPhoto
        profileId={detail.data.entity.id}
        revisionId={review.id}
        updatedAt={review.updatedAt}
        checksum={review.content.profilePhoto.checksum}
        label={`Фото автора ${review.content.fullName}`}
        style={{
          width: '100%',
          aspectRatio: designTokens.ratio.productPortrait,
        }}
      />
    ) : (
      <AppText role="bodySmall">Фото проверяемой редакции отсутствует.</AppText>
    );
  }
  const content =
    detail.data.reviewRevision?.content ?? detail.data.entity.parent;
  const [first, ...rest] = content.images;
  return first ? (
    <WorkGallery
      thumbnails
      images={[first, ...rest]}
      label={content.title ?? 'Работа'}
      renderImage={(image, style) => (
        <AdminReviewImage
          imageId={image.id}
          checksum={
            content.images.find((item) => item.id === image.id)!.checksum
          }
          label={content.title ?? 'Работа'}
          fallbackLabel="Изображение недоступно"
          style={style}
        />
      )}
    />
  ) : (
    <AppText role="bodySmall">Фотографии отсутствуют.</AppText>
  );
}
function PhotoComparison({ detail }: { detail: Detail }) {
  if (detail.kind === 'authors') {
    const old = detail.data.publishedRevision;
    const next = detail.data.reviewRevision;
    if (
      old?.content.profilePhoto?.checksum ===
      next?.content.profilePhoto?.checksum
    )
      return <AppText role="bodySmall">Фото не изменилось.</AppText>;
    return (
      <FormSection title="Фото автора">
        {old?.content.profilePhoto ? (
          <AdminRevisionPhoto
            profileId={detail.data.entity.id}
            revisionId={old.id}
            updatedAt={old.updatedAt}
            checksum={old.content.profilePhoto.checksum}
            label="Было: фото автора"
          />
        ) : null}
        {next?.content.profilePhoto ? (
          <AdminRevisionPhoto
            profileId={detail.data.entity.id}
            revisionId={next.id}
            updatedAt={next.updatedAt}
            checksum={next.content.profilePhoto.checksum}
            label="Стало: фото автора"
          />
        ) : (
          <AppText role="bodySmall">Новое фото отсутствует.</AppText>
        )}
      </FormSection>
    );
  }
  const before = detail.data.publishedRevision?.content.images ?? [];
  const after =
    detail.data.reviewRevision?.content.images ??
    detail.data.entity.parent.images;
  const changes = moderationPhotoChanges(before, after);
  return (
    <FormSection title="Изменения фотографий">
      <AppText role="bodySmall">
        Добавлено: {changes.added.length} · Удалено: {changes.removed.length}
        {changes.reordered ? ' · Изменён порядок' : ''}
      </AppText>
      {[
        { label: 'Добавлено', images: changes.added },
        { label: 'Удалено', images: changes.removed },
      ].map(({ label, images }) => (
        <View key={String(label)}>
          <AppText role="label">{String(label)}</AppText>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: designTokens.space.x2,
            }}
          >
            {images.map((image) => (
              <AdminReviewImage
                key={image.id}
                imageId={image.id}
                checksum={image.checksum}
                label={`${label}: фото`}
                fallbackLabel="Фото недоступно"
              />
            ))}
          </View>
        </View>
      ))}
    </FormSection>
  );
}

function CatalogComparison({
  detail,
  showAll,
}: {
  detail: Detail;
  showAll: boolean;
}) {
  if (detail.kind !== 'products') return null;
  const before = detail.data.publishedRevision?.selection;
  const after = detail.data.reviewRevision?.selection;
  if (!after) return null;
  const signature = (value: typeof after) =>
    JSON.stringify([
      value.category?.id,
      value.category?.name,
      [...value.materialTerms, ...value.techniqueTerms]
        .map((term) => `${term.id}:${term.name}`)
        .sort(),
    ]);
  if (!showAll && before && signature(before) === signature(after)) return null;
  return (
    <FormSection title="Каталог: было / стало">
      {before ? (
        <AppText role="bodySmall">
          Было: {before.category?.name ?? 'Не выбрана'};{' '}
          {[...before.materialTerms, ...before.techniqueTerms]
            .map((term) => term.name)
            .join(', ') || 'Без терминов'}
        </AppText>
      ) : null}
      <AppText role="body">
        Стало: {after.category?.name ?? 'Не выбрана'};{' '}
        {[...after.materialTerms, ...after.techniqueTerms]
          .map((term) => term.name)
          .join(', ') || 'Без терминов'}
      </AppText>
    </FormSection>
  );
}
function AuthorAchievements({ detail }: { detail: SellerDetail }) {
  const achievements =
    detail.reviewRevision?.content.achievements ??
    detail.publishedRevision?.content.achievements ??
    [];
  return (
    <FormSection title="Достижения">
      {achievements.length ? (
        achievements.map((achievement) => (
          <View key={achievement.id} style={{ gap: designTokens.space.x2 }}>
            <AppText role="label">
              {formatAchievementDate(achievement.occurredDate)}
            </AppText>
            <AppText role="body">{achievement.body}</AppText>
            {achievement.image ? (
              <AdminAchievementImage
                id={achievement.id}
                checksum={achievement.image.checksum}
                label={`Достижение: ${achievement.body}`}
                style={{
                  width: '100%',
                  aspectRatio: designTokens.ratio.productPortrait,
                }}
              />
            ) : null}
          </View>
        ))
      ) : (
        <AppText role="bodySmall">Достижения не указаны.</AppText>
      )}
    </FormSection>
  );
}

function StoryComparison({
  detail,
  showAll,
}: {
  detail: Detail;
  showAll: boolean;
}) {
  const client = useQueryClient();
  if (detail.kind !== 'products' || !detail.data.reviewRevision) return null;
  const before = detail.data.publishedRevision?.story.blocks ?? [];
  const after = detail.data.reviewRevision.story.blocks;
  if (!showAll && !moderationStoryChanged(before, after))
    return <AppText role="bodySmall">История создания не изменилась.</AppText>;
  return (
    <FormSection title="История создания: изменения">
      {[
        ...(detail.data.publishedRevision
          ? [{ label: 'Было', blocks: before }]
          : []),
        { label: 'Стало', blocks: after },
      ].map(({ label, blocks }) => (
        <View key={label} style={{ gap: designTokens.space.x2 }}>
          <AppText role="label">{label}</AppText>
          {blocks.length ? (
            blocks.map((block, index) => (
              <View key={block.id} style={{ gap: designTokens.space.x1 }}>
                <AppText role="caption">Этап {index + 1}</AppText>
                {block.type === 'IMAGE' ? (
                  <PrivateStoryImage
                    productId={detail.data.entity.id}
                    mediaAssetId={block.mediaAssetId}
                    sessionEpoch={currentAuthEpoch(client)}
                    label={block.altText ?? 'Этап создания'}
                    style={{
                      width: '100%',
                      aspectRatio: designTokens.ratio.productPortrait,
                    }}
                  />
                ) : (
                  <AppText role="body">{block.text}</AppText>
                )}
              </View>
            ))
          ) : (
            <AppText role="bodySmall">Этапы не указаны.</AppText>
          )}
        </View>
      ))}
    </FormSection>
  );
}
