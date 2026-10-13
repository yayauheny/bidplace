import type { LegalDocumentId, LegalDocumentsResponse } from '@bidplace/contracts';

import { AppDialog, AppText } from '../../components/ui';
import { LegalDocumentContent } from './legal-document-content';

export function LegalDocumentViewer({
  selected,
  documents,
  onClose,
  loading = false,
}: {
  selected: LegalDocumentId | null;
  documents: LegalDocumentsResponse | null;
  onClose: () => void;
  loading?: boolean;
}) {
  const document = documents?.documents.find((item) => item.id === selected);
  return (
    <AppDialog open={selected !== null} title={document?.title ?? 'Юридический документ'} onClose={onClose}>
      {document ? (
        <>
          <AppText role="metadata">Редакция: {document.version.split('+')[0]}</AppText>
          <LegalDocumentContent markdown={document.markdown} />
        </>
      ) : (
        <AppText role="bodySmall" tone="secondary">{loading ? 'Загружаем документ…' : 'Документ пока не опубликован.'}</AppText>
      )}
    </AppDialog>
  );
}
