import { Redirect, useLocalSearchParams } from 'expo-router';

import { AppShell } from '../../../components/layout';
import { InfrastructurePageStatus } from '../../../components/shared/InfrastructurePageStatus';
import { ProductDraftScreen } from '../../../features/sellers/product-draft-screen';
import { getMobileCreateHref } from '../../../components/layout/header-chrome';
import { useSellerCapability } from '../../../hooks/use-seller-capability';

function CreateWorkEntry() {
  const capability = useSellerCapability();
  if (
    capability.isLoading ||
    capability.isError ||
    (capability.status === null && !capability.isAbsent)
  ) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={capability.isError ? 'error' : 'loading'}
          onRetry={() => void capability.refetch()}
        />
      </AppShell>
    );
  }
  return (
    <Redirect
      href={getMobileCreateHref({
        isAuthenticated: true,
        sellerStatus: capability.status,
        sellerState: capability,
      })}
    />
  );
}

export default function NewProductRoute() {
  const { entry } = useLocalSearchParams<{ entry?: string }>();
  return entry === 'create' ? <CreateWorkEntry /> : <ProductDraftScreen />;
}
