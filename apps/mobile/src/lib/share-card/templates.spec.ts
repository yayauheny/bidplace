import { describe, expect, it } from 'vitest';
import { receiptTemplate, workTemplate } from './templates';

describe('share templates', () => {
  it.each(['story', 'post', 'square', 'original'] as const)('includes real work data for %s and no optional description by default', (format) => {
    const layers = workTemplate(format, { title: 'Название', handle: 'artist', link: 'bid.place/works/abcdefghijk', price: '100 BYN', timer: '2 д.', status: 'Продано', description: null });
    expect(layers[0]).toMatchObject({ kind: 'image', fit: 'contain' });
    if (format === 'post' || format === 'square') expect(layers[0]).toMatchObject({ background: 'blur' });
    expect(JSON.stringify(layers)).toContain('Название');
    expect(JSON.stringify(layers)).toContain('Продано');
    expect(layers).toContainEqual(expect.objectContaining({ kind: 'text', text: 'bid.place/works/abcdefghijk', color: 'dark', chip: true }));
  });
  it('includes explicit receipt data and the disclaimer', () => {
    const receipt = { workTitle: 'Работа', author: 'Автор', publicId: 'order123456', dealCode: '123456', amount: '100 BYN', completedAt: '05.11.2026', source: 'Аукцион' };
    const content = JSON.stringify(receiptTemplate(receipt));
    for (const value of Object.values(receipt)) expect(content).toContain(value);
    expect(content).toContain('Не является кассовым чеком');
    expect(content).not.toMatch(/contact|email|phone/i);
  });
});
