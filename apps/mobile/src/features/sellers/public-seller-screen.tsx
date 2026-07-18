import { useRouter } from 'expo-router';
import { YStack } from 'tamagui';

import {
  AppCard,
  DetailList,
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Screen,
  SectionHeader,
} from '../../components/ui';
import { ProductGrid } from '../../components/storefront/ProductGrid';
import { formatNumber } from '../../lib/formatters';
import {
  getErrorStatus,
  getUserFacingErrorMessage,
} from '../../lib/errors';
import { useApiClient } from '../../providers/api-provider';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { mapAuctionListItemToStorefrontProduct } from '../storefront/model';
import { usePublicSellerDetailQuery } from './hooks';

type PublicSellerScreenProps = {
  slug: string;
};

export function PublicSellerScreen({ slug }: PublicSellerScreenProps) {
  const router = useRouter();
  const api = useApiClient();
  const sellerQuery = usePublicSellerDetailQuery(slug);

  if (sellerQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем профиль продавца" />
      </Screen>
    );
  }

  if (sellerQuery.isError) {
    const status = getErrorStatus(sellerQuery.error);

    if (status === 404) {
      return (
        <Screen>
          <EmptyState
            title="Профиль не найден"
            description="Проверьте ссылку или вернитесь к каталогу."
            actionLabel="В каталог"
            onAction={() => router.push('/catalog')}
          />
        </Screen>
      );
    }

    return (
      <Screen>
        <ErrorState
          description={getUserFacingErrorMessage(sellerQuery.error, 'Не удалось загрузить профиль')}
          onAction={() => sellerQuery.refetch()}
        />
      </Screen>
    );
  }

  if (!sellerQuery.data) {
    return (
      <Screen>
        <EmptyState
          title="Профиль не найден"
          description="Проверьте ссылку или вернитесь к каталогу."
          actionLabel="В каталог"
          onAction={() => router.push('/catalog')}
        />
      </Screen>
    );
  }

  const profile = sellerQuery.data.sellerProfile;
  const relatedAuctions = sellerQuery.data.auctions;
  const relatedProducts = relatedAuctions.map((item) =>
    mapAuctionListItemToStorefrontProduct(item, api.baseUrl),
  );

  return (
    <Screen>
      <YStack
        style={{
          width: '100%',
          maxWidth: mobileLayout.contentMaxWidth,
          alignSelf: 'center',
          gap: mobileSpacing[5],
        }}
      >
        <AppCard>
          <YStack style={{ gap: mobileSpacing[3] }}>
            <PageIntro
              title={profile.storeName}
              description={profile.shortDescription ?? 'Описание не заполнено'}
            />
            <DetailList
              items={[
                { label: 'Страна', value: profile.country },
                { label: 'Тип', value: profile.sellerType },
                { label: 'Контакт', value: profile.contactPreference },
                ...(profile.socialLink ? [{ label: 'Ссылка', value: profile.socialLink }] : []),
              ]}
            />
          </YStack>
        </AppCard>

        <YStack style={{ gap: mobileSpacing[3] }}>
          <SectionHeader
            title="Аукционы продавца"
            description={`В каталоге сейчас ${formatNumber(relatedAuctions.length)} предложений.`}
          />
          {relatedAuctions.length === 0 ? (
            <EmptyState
              title="Нет публичных аукционов"
              description="Сейчас у продавца нет активных или запланированных аукционов в каталоге."
            />
          ) : (
            <ProductGrid products={relatedProducts} />
          )}
        </YStack>
      </YStack>
    </Screen>
  );
}
