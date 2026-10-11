import { catalogTermListResponseSchema, countryListResponseSchema, listCountries } from '@bidplace/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@bidplace/database';

import { PrismaService } from '../core/database';
import { bootstrapCatalog } from './catalog-bootstrap';
import { catalogSlug, normalizeCatalogName } from './catalog-data';

type TermRole = 'MATERIAL' | 'TECHNIQUE';

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  bootstrap(): Promise<void> {
    return bootstrapCatalog(this.prisma);
  }

  listCountries(query?: string) {
    return countryListResponseSchema.parse({ countries: listCountries(query) });
  }

  async listTerms(role?: TermRole, includeInactive = false) {
    const terms = await this.prisma.catalogTerm.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(includeInactive ? {} : { active: true }),
      },
      orderBy: [{ name: 'asc' }, { slug: 'asc' }],
    });
    return catalogTermListResponseSchema.parse({
      terms: terms.map((term) => ({
        id: term.id,
        role: term.role,
        slug: term.slug,
        name: term.name,
        active: term.active,
      })),
    });
  }

  async createCategory(
    actorUserId: string,
    input: { name: string; slug?: string | undefined; description?: string | null | undefined },
  ) {
    const slug = input.slug ?? catalogSlug(input.name);
    try {
      const category = await this.prisma.category.create({
        data: { slug, name: input.name.trim(), description: input.description ?? null },
      });
      await this.audit(actorUserId, category.id, null, 'ACTIVE', `create category ${slug}`);
      return category;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.prisma.category.findUnique({ where: { slug } });
      if (!existing) throw error;
      return existing;
    }
  }

  async renameCategory(actorUserId: string, id: string, name: string) {
    const current = await this.requireCategory(id);
    const category = await this.prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });
    await this.audit(actorUserId, id, current.name, category.name, 'rename category');
    return category;
  }

  async setCategoryActive(actorUserId: string, id: string, active: boolean) {
    await this.requireCategory(id);
    const category = await this.prisma.category.update({
      where: { id },
      data: { active },
    });
    await this.audit(actorUserId, id, null, active ? 'ACTIVE' : 'HIDDEN', 'category visibility');
    return category;
  }

  async createTerm(
    actorUserId: string,
    input: { role: TermRole; name: string; slug?: string | undefined },
  ) {
    const slug = input.slug ?? catalogSlug(input.name);
    try {
      const term = await this.prisma.catalogTerm.create({
        data: { role: input.role, slug, name: input.name.trim() },
      });
      await this.audit(actorUserId, term.id, null, 'ACTIVE', `create ${input.role} ${slug}`);
      return term;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.prisma.catalogTerm.findUnique({
        where: { role_slug: { role: input.role, slug } },
      });
      if (!existing) throw error;
      return existing;
    }
  }

  async renameTerm(actorUserId: string, id: string, name: string) {
    const current = await this.requireTerm(id);
    const term = await this.prisma.catalogTerm.update({
      where: { id },
      data: { name: name.trim() },
    });
    await this.audit(actorUserId, id, current.name, term.name, 'rename term');
    return term;
  }

  async setTermActive(actorUserId: string, id: string, active: boolean) {
    await this.requireTerm(id);
    const term = await this.prisma.catalogTerm.update({
      where: { id },
      data: { active },
    });
    await this.audit(actorUserId, id, null, active ? 'ACTIVE' : 'HIDDEN', 'term visibility');
    return term;
  }

  async findTermByNormalizedName(role: TermRole, name: string) {
    const normalized = normalizeCatalogName(name);
    const terms = await this.prisma.catalogTerm.findMany({ where: { role, active: true } });
    return terms.find((term) => normalizeCatalogName(term.name) === normalized) ?? null;
  }

  private async requireCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private async requireTerm(id: string) {
    const term = await this.prisma.catalogTerm.findUnique({ where: { id } });
    if (!term) throw new NotFoundException('Catalog term not found');
    return term;
  }

  private audit(
    actorUserId: string,
    targetId: string,
    oldStatus: string | null,
    newStatus: string,
    reason: string,
  ) {
    return this.prisma.auditEvent.create({
      data: {
        actorUserId,
        targetType: 'CATALOG',
        targetId,
        oldStatus,
        newStatus,
        reason,
      },
    });
  }
}
