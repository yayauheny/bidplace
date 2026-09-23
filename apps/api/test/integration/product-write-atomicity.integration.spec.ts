import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PostgresImageStore } from '../../src/core/image-store';
import { PublicIdService } from '../../src/core/public-id';
import { AdminModerationService } from '../../src/admin/admin-moderation.service';
import { ImagesService } from '../../src/images/images.service';
import { ProductsService } from '../../src/products/products.service';
import { SellersService } from '../../src/sellers/sellers.service';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterEach(reset);
afterAll(async () => context?.cleanup());

async function reset() {
  await prisma.auditEvent.deleteMany();
  await prisma.phoneVerificationCode.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionRules.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.updateMany({
    data: { editingRevisionId: null, publishedRevisionId: null },
  });
  await prisma.productRevision.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCreationStep.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function waitForProductsRowWait() {
  const deadline = Date.now() + 3_000;
  while (Date.now() < deadline) {
    const waits = await prisma.$queryRaw<Array<{ pid: number }>>`
      SELECT pid
      FROM pg_stat_activity
      WHERE cardinality(pg_blocking_pids(pid)) > 0
      LIMIT 1
    `;
    if (waits.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('Product row lock wait did not appear within 3000ms');
}

async function waitThenRelease(release: { resolve: () => void }) {
  try {
    await waitForProductsRowWait();
  } finally {
    release.resolve();
  }
}

async function createSubmitReadyProduct(
  status: 'DRAFT' | 'REJECTED' | 'APPROVED' = 'DRAFT',
) {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
  const owner = await prisma.user.create({
    data: {
      email: `owner.${suffix}@write-race.test`,
      passwordHash: 'test',
      displayName: 'Owner',
    },
  });
  const category = await prisma.category.create({
    data: { slug: `write-race-${suffix}`, name: 'Write race' },
  });
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: owner.id,
      slug: `write-race-${suffix}`,
      sellerType: 'creator',
      fullName: 'Owner',
      country: 'BY',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: png.byteLength,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: png,
      socialLink: 'https://example.com/owner',
      shortDescription: 'Write race seller',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@owner',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
    },
  });
  const product = await prisma.product.create({
    data: {
      publicId: new PublicIdService().generate(),
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Original title',
      story: 'Original story',
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      status,
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: png.byteLength,
          data: png,
          checksum: 'a'.repeat(64),
        },
      },
      creationSteps: {
        create: {
          position: 0,
          title: 'Sketch',
          body: 'First step',
        },
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      editingRevisionId: true,
      images: { select: { id: true, byteLength: true } },
      creationSteps: { select: { id: true, title: true } },
    },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status,
      categoryId: category.id,
      title: 'Original title',
      story: 'Original story',
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      images: {
        create: {
          imageId: product.images[0]!.id,
          position: 0,
        },
      },
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: {
      editingRevisionId: revision.id,
      publishedRevisionId: status === 'APPROVED' ? revision.id : null,
    },
  });
  return {
    owner,
    product: { ...product, editingRevisionId: revision.id },
  };
}

function createServices() {
  const imageStore = new PostgresImageStore(prisma as never);
  return {
    products: new ProductsService(prisma as never, new PublicIdService()),
    images: new ImagesService(prisma as never, imageStore),
    admin: new AdminModerationService(prisma as never),
    sellers: new SellersService(prisma as never, imageStore),
  };
}

async function holdProductAndMutate(
  productId: string,
  mutate: (tx: Prisma.TransactionClient) => Promise<void>,
) {
  const held = deferred();
  const release = deferred();
  const finished = prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM "products" WHERE id = ${productId}::uuid FOR UPDATE`,
      );
      held.resolve();
      await release.promise;
      await mutate(tx);
    },
    { timeout: 20_000, maxWait: 10_000 },
  );
  await held.promise;
  return { release, finished };
}

describe('Product write atomicity against PostgreSQL', () => {
  it('keeps the editing revision canonical from draft save through approval', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { products, admin, sellers } = createServices();
    const adminUser = await prisma.user.create({
      data: {
        email: `admin.${randomUUID()}@write-race.test`,
        passwordHash: 'test',
        displayName: 'Admin',
        role: 'admin',
      },
    });

    await products.update(owner.id, product.id, {
      title: 'Latest canonical draft',
      story: 'Latest canonical story',
    });
    expect(
      (await sellers.getProduct(owner.id, product.id)).product,
    ).toMatchObject({
      title: 'Latest canonical draft',
      story: 'Latest canonical story',
    });

    await products.submit(owner.id, product.id);
    expect(
      await prisma.productRevision.findUniqueOrThrow({
        where: { id: product.editingRevisionId },
        select: { title: true, story: true, status: true },
      }),
    ).toEqual({
      title: 'Latest canonical draft',
      story: 'Latest canonical story',
      status: 'PENDING_REVIEW',
    });

    await admin.updateProductStatus(adminUser.id, product.id, {
      status: 'APPROVED',
    });
    expect(
      (await products.getPortfolio(product.publicId)).product,
    ).toMatchObject({
      title: 'Latest canonical draft',
      story: 'Latest canonical story',
    });
  });

  it('keeps a late field write from mutating a Product after submit wins the row', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { products } = createServices();
    const { release, finished } = await holdProductAndMutate(
      product.id,
      async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { status: 'PENDING_REVIEW' },
        });
      },
    );

    const updatePromise = products.update(owner.id, product.id, {
      title: 'Late write after lock',
    });
    await waitThenRelease(release);

    await expect(updatePromise).rejects.toThrow('Product cannot be edited');
    await finished;

    const persisted = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { status: true, title: true },
    });
    expect(persisted.status).toBe('PENDING_REVIEW');
    expect(persisted.title).toBe('Original title');
  });

  it('keeps a late image delete from removing media after moderation locks the Product', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { images } = createServices();
    const imageId = product.images[0]!.id;
    const { release, finished } = await holdProductAndMutate(
      product.id,
      async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { status: 'PENDING_REVIEW' },
        });
      },
    );

    const removePromise = images.remove(owner.id, product.id, imageId);
    await waitThenRelease(release);

    await expect(removePromise).rejects.toThrow('Product images are locked');
    await finished;

    const remaining = await prisma.productImage.findMany({
      where: { productId: product.id },
      select: { id: true, byteLength: true },
    });
    expect(remaining).toEqual([{ id: imageId, byteLength: png.byteLength }]);
  });

  it('does not persist a late image upload after submit and leaves no orphaned bytes', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { images } = createServices();
    const before = await prisma.productImage.findMany({
      where: { productId: product.id },
      select: { id: true, byteLength: true, data: true },
    });
    const { release, finished } = await holdProductAndMutate(
      product.id,
      async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { status: 'PENDING_REVIEW' },
        });
      },
    );

    const addPromise = images.add(owner.id, product.id, [
      { buffer: png, mimetype: 'image/png' },
    ]);
    await waitThenRelease(release);

    await expect(addPromise).rejects.toThrow('Product images are locked');
    await finished;

    const after = await prisma.productImage.findMany({
      where: { productId: product.id },
      select: { id: true, byteLength: true, data: true },
    });
    expect(after.map((row) => row.id)).toEqual(before.map((row) => row.id));
    expect(after[0]?.byteLength).toBe(before[0]?.byteLength);
    expect(Buffer.from(after[0]!.data)).toEqual(Buffer.from(before[0]!.data));
  });

  it('keeps a late creation-story write from landing after a Listing lock', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { products } = createServices();
    const startsAt = new Date('2026-09-07T10:00:00.000Z');
    const endsAt = new Date('2026-09-07T12:00:00.000Z');
    const { release, finished } = await holdProductAndMutate(
      product.id,
      async (tx) => {
        await tx.listing.create({
          data: {
            productId: product.id,
            status: 'SCHEDULED',
            startsAt,
            originalEndsAt: endsAt,
            endsAt,
            currentPrice: new Prisma.Decimal(10),
            auctionRules: { create: { startPrice: new Prisma.Decimal(10) } },
          },
        });
      },
    );

    const storyPromise = products.replaceCreationStory(owner.id, product.id, {
      intro: 'Late story',
      steps: [
        {
          id: product.creationSteps[0]!.id,
          title: 'Changed',
          body: 'Should not persist',
        },
      ],
    });
    await waitThenRelease(release);

    await expect(storyPromise).rejects.toThrow(
      'Product is locked by an active Listing',
    );
    await finished;

    const step = await prisma.productCreationStep.findUniqueOrThrow({
      where: { id: product.creationSteps[0]!.id },
      select: { title: true, body: true },
    });
    const persisted = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { creationIntro: true },
    });
    expect(step.title).toBe('Sketch');
    expect(step.body).toBe('First step');
    expect(persisted.creationIntro).toBeNull();
  });

  it('lets a rejected Product stay editable and resubmit on the same id', async () => {
    const { owner, product } = await createSubmitReadyProduct('REJECTED');
    const { products } = createServices();

    const updated = await products.update(owner.id, product.id, {
      title: 'Corrected rejected work',
    });
    expect(updated.product.id).toBe(product.id);
    expect(updated.product.status).toBe('REJECTED');
    expect(updated.product.title).toBe('Corrected rejected work');

    const submitted = await products.submit(owner.id, product.id);
    expect(submitted.product.id).toBe(product.id);
    expect(submitted.product.status).toBe('PENDING_REVIEW');
    expect(await prisma.product.count()).toBe(1);
  });

  it('serializes concurrent update and submit into one legal Product state', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { products } = createServices();

    const results = await Promise.allSettled([
      products.update(owner.id, product.id, { title: 'Concurrent title' }),
      products.submit(owner.id, product.id),
    ]);

    const persisted = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { status: true, title: true },
    });
    const updateResult = results[0];
    const submitResult = results[1];

    if (persisted.status === 'PENDING_REVIEW') {
      expect(submitResult.status).toBe('fulfilled');
      if (updateResult.status === 'fulfilled') {
        expect(persisted.title).toBe('Concurrent title');
      } else {
        expect(persisted.title).toBe('Original title');
        expect(updateResult.reason).toMatchObject({
          message: 'Product cannot be edited',
        });
      }
    } else {
      expect(persisted.status).toBe('DRAFT');
      expect(updateResult.status).toBe('fulfilled');
      expect(persisted.title).toBe('Concurrent title');
      expect(submitResult.status).toBe('rejected');
    }
  });

  it('keeps a late image reorder from landing after the Product leaves an editable status', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { images } = createServices();
    const { release, finished } = await holdProductAndMutate(
      product.id,
      async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { status: 'PENDING_REVIEW' },
        });
      },
    );

    const reorderPromise = images.reorder(
      owner.id,
      product.id,
      product.images.map((image) => image.id),
    );
    await waitThenRelease(release);

    await expect(reorderPromise).rejects.toThrow('Product images are locked');
    await finished;
    expect(
      (
        await prisma.product.findUniqueOrThrow({
          where: { id: product.id },
          select: { status: true },
        })
      ).status,
    ).toBe('PENDING_REVIEW');
  });

  it('keeps concurrent add and remove from violating unique image positions', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const second = await prisma.productImage.create({
      data: {
        productId: product.id,
        position: 1,
        mimeType: 'image/png',
        byteLength: png.byteLength,
        data: png,
        checksum: 'b'.repeat(64),
      },
    });
    await prisma.productRevisionImage.create({
      data: {
        revisionId: product.editingRevisionId,
        imageId: second.id,
        position: 1,
      },
    });
    const { images } = createServices();
    const { release, finished } = await holdProductAndMutate(
      product.id,
      async (tx) => {
        const added = await tx.productImage.create({
          data: {
            productId: product.id,
            position: 2,
            mimeType: 'image/png',
            byteLength: png.byteLength,
            data: png,
            checksum: 'c'.repeat(64),
          },
        });
        await tx.productRevisionImage.create({
          data: {
            revisionId: product.editingRevisionId,
            imageId: added.id,
            position: 2,
          },
        });
      },
    );

    const removePromise = images.remove(
      owner.id,
      product.id,
      product.images[0]!.id,
    );
    await waitThenRelease(release);

    await expect(removePromise).resolves.toEqual({ ok: true });
    await finished;

    const remaining = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { position: 'asc' },
      select: { id: true, position: true },
    });
    expect(remaining.map((row) => row.position)).toEqual([0, 1]);
    expect(remaining.map((row) => row.id)).not.toContain(product.images[0]!.id);
    expect(remaining.some((row) => row.id === second.id)).toBe(true);
  });

  it('rejects reorder after a concurrent add changes the locked image set', async () => {
    const { owner, product } = await createSubmitReadyProduct();
    const { images } = createServices();
    const { release, finished } = await holdProductAndMutate(
      product.id,
      async (tx) => {
        const added = await tx.productImage.create({
          data: {
            productId: product.id,
            position: 1,
            mimeType: 'image/png',
            byteLength: png.byteLength,
            data: png,
            checksum: 'd'.repeat(64),
          },
        });
        await tx.productRevisionImage.create({
          data: {
            revisionId: product.editingRevisionId,
            imageId: added.id,
            position: 1,
          },
        });
      },
    );

    const reorderPromise = images.reorder(
      owner.id,
      product.id,
      product.images.map((image) => image.id),
    );
    await waitThenRelease(release);

    await expect(reorderPromise).rejects.toThrow(
      'Image order must include every Product image exactly once',
    );
    await finished;

    const remaining = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { position: 'asc' },
      select: { id: true, position: true },
    });
    expect(remaining.map((row) => row.position)).toEqual([0, 1]);
    expect(remaining.some((row) => row.id === product.images[0]!.id)).toBe(
      true,
    );
  });
});
