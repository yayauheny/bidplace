import { catalogTermListResponseSchema, countryListResponseSchema, listCountries } from '@bidplace/contracts';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    const name = input.name.trim();
    const normalizedName = this.requireNormalizedName(name);
    const slug = input.slug ?? catalogSlug(name);
    try {
      const category = await this.prisma.category.create({
        data: { slug, name, normalizedName, description: input.description ?? null },
      });
      await this.audit(actorUserId, category.id, null, 'ACTIVE', `create category ${slug}`);
      return category;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.prisma.category.findUnique({ where: { normalizedName } });
      if (existing) return existing;
      throw new ConflictException('Category slug is already used');
    }
  }

  async renameCategory(actorUserId: string, id: string, name: string) {
    const current = await this.requireCategory(id);
    const trimmed = name.trim();
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: { name: trimmed, normalizedName: this.requireNormalizedName(trimmed) },
      });
      await this.audit(actorUserId, id, current.name, category.name, 'rename category');
      return category;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      throw new ConflictException('Category name is already used');
    }
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
    const name = input.name.trim();
    const normalizedName = this.requireNormalizedName(name);
    const slug = input.slug ?? catalogSlug(name);
    try {
      const term = await this.prisma.catalogTerm.create({
        data: { role: input.role, slug, name, normalizedName },
      });
      await this.audit(actorUserId, term.id, null, 'ACTIVE', `create ${input.role} ${slug}`);
      return term;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      const existing = await this.prisma.catalogTerm.findUnique({
        where: { role_normalizedName: { role: input.role, normalizedName } },
      });
      if (existing) return existing;
      throw new ConflictException('Catalog term slug is already used');
    }
  }

  async renameTerm(actorUserId: string, id: string, name: string) {
    const current = await this.requireTerm(id);
    const trimmed = name.trim();
    try {
      const term = await this.prisma.catalogTerm.update({
        where: { id },
        data: { name: trimmed, normalizedName: this.requireNormalizedName(trimmed) },
      });
      await this.audit(actorUserId, id, current.name, term.name, 'rename term');
      return term;
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      throw new ConflictException('Catalog term name is already used');
    }
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
    return this.prisma.catalogTerm.findFirst({
      where: { role, normalizedName: normalizeCatalogName(name), active: true },
    });
  }

  private requireNormalizedName(name: string) {
    const normalizedName = normalizeCatalogName(name);
    if (!normalizedName) throw new ConflictException('Catalog name is empty');
    return normalizedName;
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
