import { PageContainer, Heading, Text } from '../../src/components/ui/layout';
import { Card } from '../../src/components/ui/surfaces';

export default function TelegramMiniAppPage() {
  return (
    <PageContainer>
      <Card>
        <Heading level="display">Telegram Mini App</Heading>
        <Text tone="muted">
          Этот экран подготовлен для будущей mobile-friendly оболочки BidPlace.
        </Text>
      </Card>
    </PageContainer>
  );
}
