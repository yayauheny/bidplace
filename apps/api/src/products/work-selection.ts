import { ConflictException } from '@nestjs/common';
import type { Prisma } from '@bidplace/database';

import { OTHER_CATEGORY_SLUG, normalizeCatalogName } from '../catalog/catalog-data';

export type WorkSelectionInput = {
  categoryId?: string | null | undefined;
  materialTermIds?: string[] | undefined;
  techniqueTermIds?: string[] | undefined;
  materialProposals?: string[] | undefined;
  techniqueProposals?: string[] | undefined;
  categoryProposal?: string | null | undefined;
};

export async function assertSelectableCategory(
  tx: Prisma.TransactionClient,
  categoryId: string,
  priorCategoryId: string | null,
) {
  const category = await tx.category.findUnique({
    where: { id: categoryId },
    select: { id: true, active: true },
  });
  if (!category) throw new ConflictException('Category is unknown');
  if (!category.active && priorCategoryId !== category.id) {
    throw new ConflictException('Category is hidden from new selections');
  }
}

export async function syncWorkSelection(
  tx: Prisma.TransactionClient,
  revisionId: string,
  authorUserId: string,
  input: WorkSelectionInput,
  priorCategoryId: string | null = null,
) {
  if (input.materialTermIds) {
    await replaceTerms(tx, revisionId, input.materialTermIds, 'MATERIAL');
  }
  if (input.techniqueTermIds) {
    await replaceTerms(tx, revisionId, input.techniqueTermIds, 'TECHNIQUE');
  }
  if (input.categoryId) {
    await assertSelectableCategory(tx, input.categoryId, priorCategoryId);
  }
  if (input.categoryProposal !== undefined) {
    await syncNameProposals(tx, {
      revisionId,
      authorUserId,
      kind: 'CATEGORY',
      names: input.categoryProposal ? [input.categoryProposal] : [],
    });
    if (input.categoryProposal) {
      const other = await tx.category.findUnique({
        where: { slug: OTHER_CATEGORY_SLUG },
        select: { id: true },
      });
      const revision = await tx.productRevision.findUnique({
        where: { id: revisionId },
        select: { categoryId: true },
      });
      if (!other || revision?.categoryId !== other.id) {
        throw new ConflictException('A category proposal requires the Other category');
      }
    }
  }
  if (input.materialProposals) {
    await syncNameProposals(tx, {
      revisionId,
      authorUserId,
      kind: 'MATERIAL',
      names: input.materialProposals,
    });
  }
  if (input.techniqueProposals) {
    await syncNameProposals(tx, {
      revisionId,
      authorUserId,
      kind: 'TECHNIQUE',
      names: input.techniqueProposals,
    });
  }
}

async function replaceTerms(
  tx: Prisma.TransactionClient,
  revisionId: string,
  termIds: readonly string[],
  role: 'MATERIAL' | 'TECHNIQUE',
) {
  if (new Set(termIds).size !== termIds.length) {
    throw new ConflictException('Catalog terms must be unique');
  }
  const existing = await tx.productRevisionTerm.findMany({
    where: { revisionId, term: { role } },
    select: { termId: true },
  });
  const keptIds = new Set(existing.map((item) => item.termId));
  const additions = termIds.filter((termId) => !keptIds.has(termId));
  if (additions.length > 0) {
    const active = await tx.catalogTerm.findMany({
      where: { id: { in: additions }, role, active: true },
      select: { id: true },
    });
    if (active.length !== additions.length) {
      throw new ConflictException('Catalog term is unknown, hidden, or has the wrong role');
    }
  }
  if (termIds.length > 0) {
    const known = await tx.catalogTerm.findMany({
      where: { id: { in: [...termIds] }, role },
      select: { id: true },
    });
    if (known.length !== termIds.length) {
      throw new ConflictException('Catalog term is unknown, hidden, or has the wrong role');
    }
  }
  if (existing.length > 0) {
    await tx.productRevisionTerm.deleteMany({
      where: { revisionId, termId: { in: existing.map((item) => item.termId) } },
    });
  }
  if (termIds.length > 0) {
    await tx.productRevisionTerm.createMany({
      data: termIds.map((termId) => ({ revisionId, termId })),
    });
  }
  await writeTermLabel(tx, revisionId, role);
}

export async function writeTermLabel(
  tx: Prisma.TransactionClient,
  revisionId: string,
  role: 'MATERIAL' | 'TECHNIQUE',
) {
  const selected = await tx.productRevisionTerm.findMany({
    where: { revisionId, term: { role } },
    select: { term: { select: { name: true } } },
  });
  const label = selected
    .map((item) => item.term.name.trim())
    .filter((name) => name.length > 0)
    .sort((left, right) => left.localeCompare(right, 'ru-RU'))
    .join(', ');
  await tx.productRevision.update({
    where: { id: revisionId },
    data: role === 'MATERIAL' ? { materials: label || null } : { technique: label || null },
  });
}

async function syncNameProposals(
  tx: Prisma.TransactionClient,
  input: {
    revisionId: string;
    authorUserId: string;
    kind: 'CATEGORY' | 'MATERIAL' | 'TECHNIQUE';
    names: readonly string[];
  },
) {
  const normalized = input.names.map((name) => ({
    rawName: name.trim(),
    normalizedName: normalizeCatalogName(name),
  }));
  if (new Set(normalized.map((item) => item.normalizedName)).size !== normalized.length) {
    throw new ConflictException('Catalog proposals must be unique');
  }
  const current = await tx.catalogProposal.findMany({
    where: { productRevisionId: input.revisionId, kind: input.kind },
  });
  const next = new Set(normalized.map((item) => item.normalizedName));
  for (const proposal of current) {
    if (
      !next.has(proposal.normalizedName) &&
      (proposal.status === 'PENDING' || proposal.status === 'REJECTED')
    ) {
      await tx.catalogProposal.update({
        where: { id: proposal.id },
        data: { selected: false },
      });
    }
  }
  for (const item of normalized) {
    const match = current.find((proposal) => proposal.normalizedName === item.normalizedName);
    if (match) {
      if (!match.selected) {
        await tx.catalogProposal.update({
          where: { id: match.id },
          data: { selected: true, rawName: item.rawName },
        });
      }
      continue;
    }
    await tx.catalogProposal.create({
      data: {
        authorUserId: input.authorUserId,
        productRevisionId: input.revisionId,
        kind: input.kind,
        rawName: item.rawName,
        normalizedName: item.normalizedName,
      },
    });
  }
}

export async function selectedPendingProposalCount(
  tx: Prisma.TransactionClient,
  revisionId: string,
) {
  return tx.catalogProposal.count({
    where: {
      productRevisionId: revisionId,
      selected: true,
      status: { in: ['PENDING', 'REJECTED'] },
    },
  });
}
