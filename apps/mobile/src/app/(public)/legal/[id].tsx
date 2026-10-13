import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { legalDocumentIdSchema } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../../components/layout/AppShell';
import { BrandLogo } from '../../../components/layout/BrandLogo';
import { AppText, TextButton } from '../../../components/ui';
import { LegalDocumentContent } from '../../../features/auth/legal-document-content';
import { LegalFooter } from '../../../features/auth/legal-footer';
import { useApiClient } from '../../../providers/api-provider';

export default function LegalDocumentRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const parsed = legalDocumentIdSchema.safeParse(id);
  const api = useApiClient();
  const legal = useQuery({
    queryKey: ['public-legal-documents'],
    queryFn: ({ signal }) => api.auth.getLegalDocuments({ signal }),
    retry: false,
  });
  const document = parsed.success ? legal.data?.documents.find((item) => item.id === parsed.data) : null;
  return (
    <AppShell hideDock>
      <ScrollView contentContainerStyle={{ padding: designTokens.space.pageGutter, gap: designTokens.space.x4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandLogo />
          <TextButton href="/" label="На главную" />
        </View>
        <AppText role="sectionTitle">{document?.title ?? 'Юридические документы'}</AppText>
        {document ? (
          <View style={{ gap: designTokens.space.x4 }}>
            <AppText role="metadata">Редакция: {document.version.split('+')[0]}</AppText>
            <LegalDocumentContent markdown={document.markdown} />
          </View>
        ) : (
          <AppText role="bodySmall" tone={legal.isError ? 'danger' : 'secondary'}>
            {!parsed.success ? 'Неизвестный документ.' : legal.isLoading ? 'Загружаем документ…' : 'Документ пока не опубликован.'}
          </AppText>
        )}
        <LegalFooter />
      </ScrollView>
    </AppShell>
  );
}
