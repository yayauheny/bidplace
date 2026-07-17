import { Screen, LoadingState, ErrorState } from '../../components/ui';
import { SellerProfileForm } from '../../features/seller/seller-profile-form';
import { useMySellerProfileQuery } from '../../features/seller/hooks';
import {
  getErrorStatus,
  getUserFacingErrorMessage,
} from '../../lib/errors';

export default function SellerProfileScreen() {
  const profileQuery = useMySellerProfileQuery();

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Загружаем seller profile" />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    const status = getErrorStatus(profileQuery.error);

    if (status !== 404) {
      return (
        <Screen>
          <ErrorState
            description={getUserFacingErrorMessage(
              profileQuery.error,
              'Не удалось загрузить профиль продавца',
            )}
            onAction={() => profileQuery.refetch()}
          />
        </Screen>
      );
    }
  }

  const profile = profileQuery.data?.sellerProfile ?? null;

  return (
    <Screen>
      <SellerProfileForm profile={profile} />
    </Screen>
  );
}
