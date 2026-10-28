import { MediaLifecycleService } from '../core/media/media-lifecycle.service';
import {
  productResponseSchema,
  type PortfolioWorksQuery,
  isEditableProductStatus,
  type ProductStatus,
  type ProductWriteRequest,
  type SellerStatus,
  type StoryWriteRequest,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import {
  Inject,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { PublicIdService } from '../core/public-id';
import {
  portfolioCatalogProductSelect,
  productRevisionOwnerSelect,
  productSelect,
  toImageContracts,
  toOwnerContractProduct,
  toProductResponse,
  projectedCatalogLabel,
  toRevisionGalleryImages,
  type PortfolioCatalogProductRecord,
} from './products.mapper';
import {
  portfolioCatalogCte,
  portfolioCatalogOrderBy,
  type PublicCatalogPageRow,
  type PublicWorkFacetRow,
} from './products-catalog.query';
import { missingProductApprovalFields } from './product-requirements';
import {
  copyRevisionStory,
  readStory,
  replaceProductStory,
} from './product-story';
import { assertSelectableCategory, syncWorkSelection } from './work-selection';
import {
  assertProductWritable,
  lockProductRowForUpdate,
  productWriteGuardSelect,
  writableProductWhere,
} from './product-write-guard';
import {
  portfolioCatalogProductWhere,
  portfolioDirectProductWhere,
} from './public-visibility';
import {
  assertProductRevisionTransition,
  canAuthorEditRevision,
} from './product-revision-state';
import { assertApprovedSeller } from '../sellers/seller-capability';
import { toPublicSellerProfile } from '../sellers/seller-profile.mapper';

async function readOwnerProductResponse(
  tx: Prisma.TransactionClient,
  productId: string,
  revisionId: string,
) {
  const [product, editingRevision] = await Promise.all([
    tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: productSelect,
    }),
    tx.productRevision.findUniqueOrThrow({
      where: { id: revisionId },
      select: productRevisionOwnerSelect,
    }),
  ]);
  return productResponseSchema.parse({
    product: toOwnerContractProduct(product, editingRevision),
    ...(product.mediaOperations?.[0]
      ? { publication: product.mediaOperations[0] }
      : {}),
  });
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicIds: PublicIdService,
    @Inject(MediaLifecycleService)
    private readonly media?: MediaLifecycleService,
  ) {}

  async create(userId: string, input: ProductWriteRequest) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller profile not found');
    }

    assertApprovedSeller(seller.status as SellerStatus);
    return this.createWithPublicId(seller.id, userId, input);
  }

  private async createWithPublicId(
    sellerProfileId: string,
    authorUserId: string,
    input: ProductWriteRequest,
  ) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const data: Prisma.ProductUncheckedCreateInput = {
          sellerProfileId,
          publicId: this.publicIds.generate(),
          categoryId: input.categoryId ?? null,
          title: input.title ?? null,
          story: input.story ?? null,
          dimensions: input.dimensions ?? null,
          weight: input.weight ?? null,
          year: input.year ?? null,
          condition: input.condition ?? null,
          uniqueness: input.uniqueness ?? null,
          provenance: input.provenance ?? null,
          city: input.city ?? null,
          packaging: input.packaging ?? null,
          deliveryInfo: input.deliveryInfo ?? null,
          creationIntro: input.creationIntro ?? null,
          status: 'DRAFT',
        };

        const product = await this.prisma.$transaction(async (tx) => {
          if (input.categoryId) {
            await assertSelectableCategory(tx, input.categoryId, null);
          }
          const created = await tx.product.create({ data });
          const revision = await tx.productRevision.create({
            data: {
              productId: created.id,
              version: 1,
              status: 'DRAFT',
              categoryId: data.categoryId ?? null,
              title: data.title ?? null,
              story: data.story ?? null,
              dimensions: data.dimensions ?? null,
              weight: data.weight ?? null,
              year: data.year ?? null,
              condition: data.condition ?? null,
              uniqueness: data.uniqueness ?? null,
              provenance: data.provenance ?? null,
              city: data.city ?? null,
              packaging: data.packaging ?? null,
              deliveryInfo: data.deliveryInfo ?? null,
              creationIntro: data.creationIntro ?? null,
            },
          });
          await syncWorkSelection(tx, revision.id, authorUserId, input, null);
          await tx.product.update({
            where: { id: created.id },
            data: { editingRevisionId: revision.id },
          });
          return readOwnerProductResponse(tx, created.id, revision.id);
        });

        return product;
      } catch (error) {
        if (
          !(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
          )
        ) {
          throw error;
        }
      }
    }

    throw new ConflictException('Could not assign public identifier');
  }

  async update(userId: string, id: string, input: ProductWriteRequest) {
    const data: Prisma.ProductUncheckedUpdateInput = {};
    const revisionData: Prisma.ProductRevisionUncheckedUpdateInput = {};

    if (input.categoryId !== undefined) {
      data.categoryId = input.categoryId;
      revisionData.categoryId = input.categoryId;
    }
    if (input.title !== undefined) {
      data.title = input.title;
      revisionData.title = input.title;
    }
    if (input.story !== undefined) {
      data.story = input.story;
      revisionData.story = input.story;
    }
    if (input.dimensions !== undefined) {
      data.dimensions = input.dimensions;
      revisionData.dimensions = input.dimensions;
    }
    if (input.weight !== undefined) {
      data.weight = input.weight;
      revisionData.weight = input.weight;
    }
    if (input.year !== undefined) {
      data.year = input.year;
      revisionData.year = input.year;
    }
    if (input.condition !== undefined) {
      data.condition = input.condition;
      revisionData.condition = input.condition;
    }
    if (input.uniqueness !== undefined) {
      data.uniqueness = input.uniqueness;
      revisionData.uniqueness = input.uniqueness;
    }
    if (input.provenance !== undefined) {
      data.provenance = input.provenance;
      revisionData.provenance = input.provenance;
    }
    if (input.city !== undefined) {
      data.city = input.city;
      revisionData.city = input.city;
    }
    if (input.packaging !== undefined) {
      data.packaging = input.packaging;
      revisionData.packaging = input.packaging;
    }
    if (input.deliveryInfo !== undefined) {
      data.deliveryInfo = input.deliveryInfo;
      revisionData.deliveryInfo = input.deliveryInfo;
    }
    if (input.creationIntro !== undefined) {
      data.creationIntro = input.creationIntro;
      revisionData.creationIntro = input.creationIntro;
    }

    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, id);
      const product = await tx.product.findUnique({
        where: { id },
        select: {
          ...productWriteGuardSelect,
          editingRevisionId: true,
          publishedRevisionId: true,
        },
      });
      if (
        product &&
        (product.status === 'APPROVED' || product.status === 'ARCHIVED') &&
        product.publishedRevisionId &&
        product.editingRevisionId
      ) {
        if (product.sellerProfile.userId !== userId) {
          throw new ForbiddenException('Product is not owned by user');
        }
        assertApprovedSeller(product.sellerProfile.status as SellerStatus);
        if (product.listings.length > 0) {
          throw new ConflictException('Product is locked by an active Listing');
        }
        let editingRevisionId = product.editingRevisionId;
        if (product.editingRevisionId === product.publishedRevisionId) {
          const published = await tx.productRevision.findUniqueOrThrow({
            where: { id: product.publishedRevisionId },
            include: { images: true },
          });
          const editing = await tx.productRevision.create({
            data: {
              productId: product.id,
              version: published.version + 1,
              status: 'DRAFT',
              categoryId: published.categoryId,
              title: published.title,
              story: published.story,
              technique: published.technique,
              materials: published.materials,
              dimensions: published.dimensions,
              weight: published.weight,
              year: published.year,
              condition: published.condition,
              uniqueness: published.uniqueness,
              provenance: published.provenance,
              city: published.city,
              packaging: published.packaging,
              deliveryInfo: published.deliveryInfo,
              creationIntro: published.creationIntro,
              images: {
                createMany: {
                  data: published.images.map((image) => ({
                    imageId: image.imageId,
                    position: image.position,
                    crop: image.crop ?? Prisma.DbNull,
                  })),
                },
              },
            },
          });
          await copyRevisionStory(tx, published.id, editing.id);
          editingRevisionId = editing.id;
          await tx.product.update({
            where: { id: product.id },
            data: { editingRevisionId },
          });
        } else {
          const editingRevision = await tx.productRevision.findUniqueOrThrow({
            where: { id: editingRevisionId },
            select: { status: true },
          });
          if (!canAuthorEditRevision(editingRevision.status)) {
            throw new ConflictException('Product revision cannot be edited');
          }
        }

        const priorRevision = await tx.productRevision.findUniqueOrThrow({
          where: { id: editingRevisionId },
          select: { categoryId: true },
        });
        if (input.categoryId) {
          await assertSelectableCategory(
            tx,
            input.categoryId,
            priorRevision.categoryId,
          );
        }
        if (Object.keys(revisionData).length > 0) {
          await tx.productRevision.update({
            where: { id: editingRevisionId },
            data: revisionData,
          });
        }
        await syncWorkSelection(
          tx,
          editingRevisionId,
          userId,
          input,
          priorRevision.categoryId,
        );
        return readOwnerProductResponse(tx, id, editingRevisionId);
      }
      assertProductWritable(product, userId, 'edit');
      if (!product.editingRevisionId) {
        throw new ConflictException('Product editing revision is missing');
      }
      const priorRevision = await tx.productRevision.findUniqueOrThrow({
        where: { id: product.editingRevisionId },
        select: { categoryId: true },
      });
      if (input.categoryId) {
        await assertSelectableCategory(
          tx,
          input.categoryId,
          priorRevision.categoryId,
        );
      }
      const editingRevision = await tx.productRevision.findUniqueOrThrow({
        where: { id: product.editingRevisionId },
        select: { status: true },
      });
      if (!canAuthorEditRevision(editingRevision.status)) {
        throw new ConflictException('Product revision cannot be edited');
      }

      if (Object.keys(data).length > 0) {
        const written = await tx.product.updateMany({
          where: { id, ...writableProductWhere },
          data,
        });
        if (written.count !== 1) {
          assertProductWritable(
            await tx.product.findUnique({
              where: { id },
              select: productWriteGuardSelect,
            }),
            userId,
            'edit',
          );
          throw new ConflictException('Product cannot be edited');
        }
      }

      if (Object.keys(revisionData).length > 0) {
        await tx.productRevision.update({
          where: { id: product.editingRevisionId },
          data: revisionData,
        });
      }
      await syncWorkSelection(
        tx,
        product.editingRevisionId,
        userId,
        input,
        priorRevision.categoryId,
      );
      return readOwnerProductResponse(tx, id, product.editingRevisionId);
    });
  }

  async submit(userId: string, id: string) {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, id);
      const current = await tx.product.findUnique({
        where: { id },
        select: {
          ...productWriteGuardSelect,
          editingRevisionId: true,
          editingRevision: { select: { status: true } },
          publishedRevisionId: true,
          title: true,
          story: true,
          categoryId: true,
          condition: true,
          uniqueness: true,
          provenance: true,
          city: true,
          packaging: true,
          deliveryInfo: true,
          images: { select: { id: true }, take: 1 },
        },
      });

      if (
        current?.editingRevisionId &&
        current.editingRevision?.status === 'PENDING_REVIEW'
      ) {
        if (current.sellerProfile.userId !== userId)
          throw new ForbiddenException('Product is not owned by user');
        assertApprovedSeller(current.sellerProfile.status as SellerStatus);
        if (current.listings.length > 0)
          throw new ConflictException('Product is locked by an active Listing');
        const revision = await tx.productRevision.findUniqueOrThrow({
          where: { id: current.editingRevisionId },
          select: productRevisionOwnerSelect,
        });
        const product = await tx.product.findUniqueOrThrow({
          where: { id },
          select: productSelect,
        });
        return productResponseSchema.parse({
          product: toOwnerContractProduct(product, revision),
        });
      }

      if (
        current &&
        (current.status === 'APPROVED' || current.status === 'ARCHIVED') &&
        current.publishedRevisionId &&
        current.editingRevisionId &&
        current.editingRevisionId !== current.publishedRevisionId
      ) {
        if (current.sellerProfile.userId !== userId) {
          throw new ForbiddenException('Product is not owned by user');
        }
        assertApprovedSeller(current.sellerProfile.status as SellerStatus);
        if (current.listings.length > 0) {
          throw new ConflictException('Product is locked by an active Listing');
        }

        const editingRevision = await tx.productRevision.findUniqueOrThrow({
          where: { id: current.editingRevisionId },
          select: {
            status: true,
            title: true,
            story: true,
            categoryId: true,
            condition: true,
            uniqueness: true,
            provenance: true,
            city: true,
            packaging: true,
            deliveryInfo: true,
            images: { select: { imageId: true }, take: 1 },
          },
        });
        assertProductRevisionTransition(
          'author',
          editingRevision.status,
          'PENDING_REVIEW',
        );
        const missingFields = missingProductApprovalFields({
          ...editingRevision,
          images: editingRevision.images.map(({ imageId }) => ({
            id: imageId,
          })),
        });
        if (missingFields.length > 0) {
          throw new ConflictException(
            `Product is missing required fields: ${missingFields.join(', ')}`,
          );
        }

        await tx.productRevision.update({
          where: { id: current.editingRevisionId },
          data: { status: 'PENDING_REVIEW', submittedAt: new Date() },
        });
        const [updated, submittedRevision] = await Promise.all([
          tx.product.findUniqueOrThrow({
            where: { id },
            select: productSelect,
          }),
          tx.productRevision.findUniqueOrThrow({
            where: { id: current.editingRevisionId },
            select: productRevisionOwnerSelect,
          }),
        ]);
        await tx.auditEvent.create({
          data: {
            actorUserId: userId,
            targetType: 'PRODUCT',
            targetId: updated.id,
            oldStatus: editingRevision.status,
            action: 'SUBMITTED',
            revisionId: current.editingRevisionId,
            newStatus: 'PENDING_REVIEW',
            reason: null,
          },
        });
        return productResponseSchema.parse({
          product: toOwnerContractProduct(updated, submittedRevision),
        });
      }

      assertProductWritable(current, userId, 'submit');

      if (!current.editingRevisionId) {
        throw new ConflictException('Product editing revision is missing');
      }
      const editingRevision = await tx.productRevision.findUniqueOrThrow({
        where: { id: current.editingRevisionId },
        select: {
          status: true,
          title: true,
          categoryId: true,
          images: { select: { imageId: true }, take: 1 },
        },
      });
      assertProductRevisionTransition(
        'author',
        editingRevision.status,
        'PENDING_REVIEW',
      );
      const missingFields = missingProductApprovalFields({
        ...editingRevision,
        images: editingRevision.images.map(({ imageId }) => ({ id: imageId })),
      });
      if (missingFields.length > 0) {
        throw new ConflictException(
          `Product is missing required fields: ${missingFields.join(', ')}`,
        );
      }

      const moved = await tx.product.updateMany({
        where: { id, ...writableProductWhere },
        data: { status: 'PENDING_REVIEW' },
      });
      if (moved.count !== 1) {
        throw new ConflictException('Product cannot be submitted for review');
      }
      await tx.productRevision.update({
        where: { id: current.editingRevisionId },
        data: { status: 'PENDING_REVIEW', submittedAt: new Date() },
      });

      const [updated, submittedRevision] = await Promise.all([
        tx.product.findUniqueOrThrow({
          where: { id },
          select: productSelect,
        }),
        tx.productRevision.findUniqueOrThrow({
          where: { id: current.editingRevisionId },
          select: productRevisionOwnerSelect,
        }),
      ]);

      await tx.auditEvent.create({
        data: {
          actorUserId: userId,
          targetType: 'PRODUCT',
          targetId: updated.id,
          oldStatus: current.status,
          action: 'SUBMITTED',
          revisionId: current.editingRevisionId,
          newStatus: 'PENDING_REVIEW',
          reason: null,
        },
      });

      return productResponseSchema.parse({
        product: toOwnerContractProduct(updated, submittedRevision),
      });
    });
  }

  async hide(userId: string, id: string) {
    return this.setAuthorVisibility(userId, id, 'ARCHIVED');
  }

  async unhide(userId: string, id: string) {
    return this.setAuthorVisibility(userId, id, 'APPROVED');
  }

  private async setAuthorVisibility(
    userId: string,
    id: string,
    nextStatus: 'APPROVED' | 'ARCHIVED',
  ) {
    let deliveryId: string | undefined;
    const response = await runReadCommittedTransaction(
      this.prisma,
      async (tx) => {
        await lockProductRowForUpdate(tx, id);
        const product = await tx.product.findUnique({
          where: { id },
          select: {
            ...productWriteGuardSelect,
            publishedRevisionId: true,
          },
        });
        if (!product) {
          throw new NotFoundException('Product not found');
        }
        if (product.sellerProfile.userId !== userId) {
          throw new ForbiddenException('Product is not owned by user');
        }
        assertApprovedSeller(product.sellerProfile.status as SellerStatus);
        assertProductRevisionTransition(
          'author',
          product.status as ProductStatus,
          nextStatus,
        );
        if (product.publishedRevisionId == null) {
          throw new ConflictException('Product has no published revision');
        }
        if (nextStatus === 'ARCHIVED' && product.listings.length > 0) {
          throw new ConflictException(
            'Work cannot be hidden while a scheduled or live listing exists',
          );
        }

        if (this.media?.enabled) {
          if (nextStatus === 'ARCHIVED')
            await this.media.enqueueRevoke(tx, { productId: id });
          else {
            const revision = await tx.productRevision.findUniqueOrThrow({
              where: { id: product.publishedRevisionId },
            });
            const operation = await this.media.enqueuePublication(
              tx,
              { productId: id },
              revision,
              product.publishedRevisionId,
              userId,
              true,
            );
            deliveryId = operation.id;
            return toProductResponse(
              await tx.product.findUniqueOrThrow({
                where: { id },
                select: productSelect,
              }),
            );
          }
        }
        await tx.product.update({
          where: { id },
          data: { status: nextStatus },
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: userId,
            targetType: 'PRODUCT',
            targetId: id,
            action: 'DECISION',
            revisionId: product.publishedRevisionId,
            oldStatus: product.status,
            newStatus: nextStatus,
            reason: null,
          },
        });
        if (nextStatus === 'APPROVED') {
          await tx.auditEvent.create({
            data: {
              actorUserId: userId,
              targetType: 'PRODUCT',
              targetId: id,
              action: 'PUBLICATION_COMPLETED',
              revisionId: product.publishedRevisionId,
              oldStatus: product.status,
              newStatus: 'APPROVED',
            },
          });
        }

        const updated = await tx.product.findUniqueOrThrow({
          where: { id },
          select: productSelect,
        });
        return toProductResponse(updated);
      },
    );
    if (this.media?.enabled) {
      try {
        if (deliveryId) await this.media.deliver(deliveryId);
      } finally {
        await this.media.deliverOutstanding({ productId: id }, 'REVOKE');
      }
      if (deliveryId)
        return toProductResponse(
          await this.prisma.product.findUniqueOrThrow({
            where: { id },
            select: productSelect,
          }),
        );
    }
    return response;
  }

  async replaceCreationStory(
    userId: string,
    productId: string,
    input: StoryWriteRequest,
  ) {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, productId);
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          ...productWriteGuardSelect,
          editingRevisionId: true,
          publishedRevisionId: true,
        },
      });
      if (!product) throw new NotFoundException('Product not found');
      if (product.sellerProfile.userId !== userId) {
        throw new ForbiddenException('Product is not owned by user');
      }
      assertApprovedSeller(product.sellerProfile.status as SellerStatus);
      if (product.listings.length > 0) {
        throw new ConflictException('Product is locked by an active Listing');
      }
      if (!product.editingRevisionId) {
        throw new ConflictException('Product editing revision is missing');
      }
      const editingPublishedRevision =
        product.publishedRevisionId === product.editingRevisionId;
      const separateDraftOfPublishedWork =
        !editingPublishedRevision &&
        (product.status === 'APPROVED' || product.status === 'ARCHIVED');
      if (
        editingPublishedRevision ||
        (!separateDraftOfPublishedWork &&
          !isEditableProductStatus(product.status as ProductStatus))
      ) {
        throw new ForbiddenException('Product creation story is locked');
      }
      const revision = await tx.productRevision.findUniqueOrThrow({
        where: { id: product.editingRevisionId },
        select: { status: true },
      });
      if (!canAuthorEditRevision(revision.status)) {
        throw new ConflictException('Product revision cannot be edited');
      }
      return replaceProductStory(tx, {
        media: this.media,
        userId,
        productId,
        revisionId: product.editingRevisionId,
        request: input,
      });
    });
  }

  async getPublishedStory(publicId: string) {
    const product = await this.prisma.product.findFirst({
      where: { publicId, ...portfolioDirectProductWhere },
      select: { publishedRevisionId: true },
    });
    if (!product?.publishedRevisionId) {
      throw new NotFoundException('Work not found');
    }
    return readStory(this.prisma, product.publishedRevisionId);
  }

  async getPortfolio(publicId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        publicId,
        ...portfolioDirectProductWhere,
      },
      select: portfolioCatalogProductSelect,
    });
    if (!product) {
      throw new NotFoundException('Work not found');
    }
    const item = this.toPortfolioItem(product);
    if (!item) {
      throw new NotFoundException('Work not found');
    }
    return item;
  }

  async listPortfolio(query: PortfolioWorksQuery) {
    const { products, pagination } = await this.loadPortfolioCatalogPage(query);
    return {
      items: products.flatMap((product) => {
        const item = this.toPortfolioItem(product);
        return item ? [item] : [];
      }),
      pagination,
    };
  }

  async listPortfolioMaterialFacets() {
    const cte = portfolioCatalogCte({
      page: 1,
      limit: 1,
      sort: 'newest',
    });
    const rows = await this.prisma.$queryRaw<PublicWorkFacetRow[]>(
      Prisma.sql`${cte}
        SELECT DISTINCT term."name" AS "materials"
        FROM filtered
        INNER JOIN "products" catalog_product ON catalog_product."id" = filtered."id"
        INNER JOIN "product_revision_terms" selected_term
          ON selected_term."revision_id" = catalog_product."published_revision_id"
        INNER JOIN "catalog_terms" term
          ON term."id" = selected_term."term_id"
          AND term."role" = 'MATERIAL'
        WHERE NULLIF(BTRIM(term."name"), '') IS NOT NULL`,
    );
    return rows.map((row) => row.materials);
  }

  private async loadPortfolioCatalogPage(query: PortfolioWorksQuery) {
    const cte = portfolioCatalogCte(query);
    const pageRows = await this.prisma.$queryRaw<PublicCatalogPageRow[]>(
      Prisma.sql`${cte}
        SELECT "id", COUNT(*) OVER()::int AS "total"
        FROM filtered p
        ORDER BY ${Prisma.raw(portfolioCatalogOrderBy(query.sort))}
        LIMIT ${query.limit}
        OFFSET ${(query.page - 1) * query.limit}`,
    );

    const total = pageRows.length
      ? Number(pageRows[0]!.total)
      : Number(
          (
            await this.prisma.$queryRaw<Array<{ total: number | bigint }>>(
              Prisma.sql`${cte}
                SELECT COUNT(*)::int AS "total"
                FROM filtered`,
            )
          )[0]?.total ?? 0,
        );

    if (!pageRows.length) {
      return {
        products: [] as PortfolioCatalogProductRecord[],
        pagination: { page: query.page, limit: query.limit, total },
      };
    }

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: pageRows.map((row) => row.id) },
        ...portfolioCatalogProductWhere,
      },
      select: portfolioCatalogProductSelect,
    });
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const pagedProducts = pageRows
      .map((row) => productsById.get(row.id))
      .filter(
        (product): product is PortfolioCatalogProductRecord =>
          product !== undefined,
      );

    return {
      products: pagedProducts,
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  toPortfolioItem(product: PortfolioCatalogProductRecord) {
    const published = product.publishedRevision;
    const images = toRevisionGalleryImages(published);
    if (
      !published?.title ||
      !published.categoryId ||
      !product.publishedAt ||
      !images ||
      images.length === 0
    ) {
      return null;
    }

    return {
      product: {
        id: product.id,
        publicId: product.publicId,
        title: published.title,
        story: published.story,
        categoryId: published.categoryId,
        technique: projectedCatalogLabel(published.terms, 'TECHNIQUE'),
        materials: projectedCatalogLabel(published.terms, 'MATERIAL'),
        dimensions: published.dimensions,
        year: published.year,
        uniqueness: published.uniqueness?.trim() || null,
        images: toImageContracts(images, 'public'),
        publishedAt: product.publishedAt.toISOString(),
        materialTermIds: (published.terms ?? [])
          .filter((item) => item.term.role === 'MATERIAL')
          .map((item) => item.termId),
        techniqueTermIds: (published.terms ?? [])
          .filter((item) => item.term.role === 'TECHNIQUE')
          .map((item) => item.termId),
      },
      sellerProfile: toPublicSellerProfile(product.sellerProfile),
    };
  }
}
