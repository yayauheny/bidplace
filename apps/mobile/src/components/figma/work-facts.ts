export type WorkFact = {
  label: string;
  value: string;
};

export function visibleWorkFacts(input: {
  technique?: string | null;
  materials?: string | null;
  dimensions?: string | null;
  year?: number | null;
  city?: string | null;
}): WorkFact[] {
  const year = input.year == null ? null : String(input.year);
  const rows: Array<[string, string | null | undefined]> = [
    ['Техника', input.technique],
    ['Материал', input.materials],
    ['Размеры', input.dimensions],
    ['Год создания', year],
    ['Город', input.city],
  ];

  return rows.flatMap(([label, value]) => {
    const trimmed = value?.trim() ?? '';
    return trimmed.length > 0 ? [{ label, value: trimmed }] : [];
  });
}
