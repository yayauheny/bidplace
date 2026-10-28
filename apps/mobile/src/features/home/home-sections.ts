export type HomeWorkItem = {
  work: {
    publicId: string;
    title: string;
    images: Array<{ url: string }>;
    author?: {
      slug: string;
    };
  };
  author: {
    slug: string;
    fullName: string;
    shortDescription: string;
    profilePhotoUrl: string;
    discipline?: string | null;
  };
};

export type HomeCuratorSelection = {
  curator: {
    slug: string;
    fullName: string;
    shortDescription: string;
    profilePhotoUrl: string;
  };
  work: HomeWorkItem['work'] & {
    author: {
      slug: string;
    };
  };
  note: string | null;
};

export type HomeAuthor = {
  slug: string;
  fullName: string;
  profilePhotoUrl: string;
  discipline?: string | null;
};

export type HomePayload = {
  curatorSelection: HomeCuratorSelection | null;
  newWorks: HomeWorkItem[];
  newAuthors: HomeAuthor[];
};

export type HomeSectionPlan = {
  opening: HomeCuratorSelection | null;
  works: HomeWorkItem[];
  authors: HomeAuthor[];
  showWorks: boolean;
  showAuthors: boolean;
  showAuthorsLink: boolean;
  showEmpty: boolean;
};

export function visibleCuratorSelection(
  selection: HomeCuratorSelection | null | undefined,
): HomeCuratorSelection | null {
  if (!selection?.work?.publicId || !selection.curator?.slug) {
    return null;
  }

  return selection;
}

export function homeSectionPlan(
  data: HomePayload | null | undefined,
): HomeSectionPlan {
  const opening = visibleCuratorSelection(data?.curatorSelection);
  const works = data?.newWorks ?? [];
  const authors = data?.newAuthors ?? [];

  return {
    opening,
    works,
    authors,
    showWorks: works.length > 0,
    showAuthors: authors.length > 0,
    showAuthorsLink:
      authors.length === 0 && (works.length > 0 || opening !== null),
    showEmpty: opening === null && works.length === 0 && authors.length === 0,
  };
}
