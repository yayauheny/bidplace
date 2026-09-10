export type CreatorAboutSectionId = 'biography' | 'practice';

export type CreatorAboutSection = {
  id: CreatorAboutSectionId;
  title: string;
  body: string;
};

export function visibleCreatorAboutSections(input: {
  biography?: string | null;
  practice?: string | null;
}): CreatorAboutSection[] {
  const sections: CreatorAboutSection[] = [];
  const biography = input.biography?.trim() ?? '';
  const practice = input.practice?.trim() ?? '';

  if (biography.length > 0) {
    sections.push({
      id: 'biography',
      title: 'Биография',
      body: biography,
    });
  }

  if (practice.length > 0) {
    sections.push({
      id: 'practice',
      title: 'Практика и подход',
      body: practice,
    });
  }

  return sections;
}
