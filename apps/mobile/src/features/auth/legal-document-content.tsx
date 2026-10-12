import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { AppText } from '../../components/ui';

/** Lightweight, native-friendly rendering of the repository's legal Markdown. */
export function LegalDocumentContent({ markdown }: { markdown: string }) {
  const blocks = markdown.trim().split(/\n\s*\n/);
  return (
    <View style={{ gap: designTokens.space.x4, minWidth: 0 }}>
      {blocks.map((block, index) => {
        const heading = /^(#{1,3})\s+(.+)$/.exec(block);
        if (heading) {
          return <AppText key={index} role={heading[1]?.length === 1 ? 'sectionTitle' : 'body'} style={{ color: designTokens.color.fieldValue }}>{heading[2]}</AppText>;
        }
        if (block.startsWith('|')) {
          const rows = block.split('\n').filter((line) => /^\|/.test(line) && !/^\|[\s:|-]+\|$/.test(line));
          const cells = rows.map((row) => row.split('|').slice(1, -1).map((value) => value.trim()));
          const headers = cells[0] ?? [];
          return (
            <View key={index} style={{ gap: designTokens.space.x3 }}>
              {cells.slice(1).map((row, rowIndex) => (
                <View key={rowIndex} style={{ gap: designTokens.space.x1, padding: designTokens.space.x3, backgroundColor: designTokens.color.canvas, borderRadius: designTokens.radius.card }}>
                  {row.map((cell, cellIndex) => (
                    <AppText key={cellIndex} role="bodySmall" style={{ lineHeight: 21 }}>
                      {headers[cellIndex] ? headers[cellIndex] + ': ' : ''}{cell.replace(/\*\*/g, '')}
                    </AppText>
                  ))}
                </View>
              ))}
            </View>
          );
        }
        return <AppText key={index} role="bodySmall" style={{ lineHeight: 23, color: designTokens.color.fieldValue }}>
          {block.replace(/^\s*[-*]\s+/gm, '• ').replace(/\*\*/g, '')}
        </AppText>;
      })}
    </View>
  );
}
