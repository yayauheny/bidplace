import type { ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui';

function legalInline(source: string): ReactNode[] {
  return source.split(/(https?:\/\/[^\s<>]+|\*\*[^*\n]+\*\*|`[^`\n]+`)/g).filter(Boolean).map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      const address = part.replace(/[.,;]+$/, '');
      const suffix = part.slice(address.length);
      return (
        <Text key={index}>
          <Text
            accessibilityRole="link"
            style={{ textDecorationLine: 'underline', color: designTokens.color.fieldValue }}
            onPress={() => { void Linking.openURL(address); }}
          >
            {address}
          </Text>
          {suffix}
        </Text>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={index} style={{ fontWeight: '600' }}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Text key={index} style={{ fontFamily: 'monospace' }}>{part.slice(1, -1)}</Text>;
    }
    return part;
  });
}

function legalTable(block: string) {
  const cells = block.split('\n').filter((line) =>
    /^\|/.test(line) && !/^\|[\s:|-]+\|$/.test(line),
  ).map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
  const headers = cells[0] ?? [];
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      {cells.slice(1).map((row, index) => (
        <View key={index} style={{
          gap: designTokens.space.x2,
          padding: designTokens.space.x3,
          backgroundColor: designTokens.color.canvas,
          borderRadius: designTokens.radius.dialog,
        }}>
          {row.map((cell, cellIndex) => (
            <AppText key={cellIndex} role="bodySmall" selectable style={{ lineHeight: 22 }}>
              <Text style={{ fontWeight: '600' }}>{headers[cellIndex] ? `${headers[cellIndex]}: ` : ''}</Text>
              {legalInline(cell)}
            </AppText>
          ))}
        </View>
      ))}
    </View>
  );
}

// The canonical legal pack uses headings, paragraphs, plain HTTPS URLs, lists,
// bold/code spans and Markdown tables. Keep all prose and URLs selectable.
export function LegalDocumentContent({ markdown }: { markdown: string }) {
  const blocks = markdown.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  return (
    <View style={{ gap: designTokens.space.x4, minWidth: 0 }}>
      {blocks.map((block, index) => {
        const heading = /^(#{1,3})\s+(.+)$/.exec(block);
        if (heading) {
          const top = heading[1]?.length === 1;
          return (
            <AppText
              key={index}
              role={top ? 'sectionTitle' : 'body'}
              selectable
              style={{ color: designTokens.color.fieldValue, fontWeight: '600', lineHeight: top ? 32 : 26 }}
            >
              {legalInline(heading[2] ?? '')}
            </AppText>
          );
        }
        if (block.startsWith('|')) return <View key={index}>{legalTable(block)}</View>;
        return (
          <AppText
            key={index}
            role="bodySmall"
            selectable
            style={{ lineHeight: 23, color: designTokens.color.fieldValue }}
          >
            {legalInline(block.replace(/^\s*[-*]\s+/gm, '• '))}
          </AppText>
        );
      })}
    </View>
  );
}
