import { Link, type Href } from 'expo-router';
import { Linking, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import type { LegalDocumentId } from '@bidplace/contracts';

import { AppText } from '../../components/ui';
import { MotionPressable } from '../../components/ui/MotionPressable';

const links: { id: LegalDocumentId; title: string }[] = [
  { id: 'agreement', title: 'Соглашение' },
  { id: 'privacy', title: 'Политика и cookies' },
  { id: 'data-consent', title: 'Согласие ПДн' },
  { id: 'author-rules', title: 'Правила авторов' },
  { id: 'prohibited', title: 'Запрещённое и правообладателям' },
];

export function LegalFooter() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: designTokens.space.x3, paddingVertical: designTokens.space.x4 }}>
      {links.map(({ id, title }) => (
        <Link key={id} href={('/legal/' + id) as Href} asChild>
          <MotionPressable accessibilityRole="link" accessibilityLabel={title} preset="button">
            <AppText role="metadata" style={{ color: designTokens.color.textSubdued, textDecorationLine: 'underline' }}>{title}</AppText>
          </MotionPressable>
        </Link>
      ))}
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel="Связаться с оператором bidplace"
        preset="button"
        onPress={() => { void Linking.openURL('mailto:work.evles@gmail.com'); }}
      >
        <AppText role="metadata" style={{ color: designTokens.color.textSubdued, textDecorationLine: 'underline' }}>
          Связаться с оператором
        </AppText>
      </MotionPressable>
    </View>
  );
}
