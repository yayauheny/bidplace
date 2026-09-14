import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

import { PrismaClient } from '@bidplace/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';

const requireFromHere = createRequire(__filename);
const { assertFigmaComparisonTarget, MANIFEST, verifyFigmaComparisonRecords } =
  requireFromHere(
    '../../../../packages/database/prisma/figma-comparison-fixture.js',
  ) as {
    assertFigmaComparisonTarget: (databaseUrl: string) => {
      databaseName: string;
      schemaName: string;
    };
    MANIFEST: {
      author: { profilePhoto: { checksum: string } };
      curatorSelectionPublicId: string;
      works: Array<{ publicId: string; checksum: string }>;
    };
    verifyFigmaComparisonRecords: (prisma: PrismaClient) => Promise<unknown>;
  };

const applyUrl = process.env.FIGMA_COMPARISON_DATABASE_URL;

describe.skipIf(!applyUrl)('applied Figma comparison preview database', () => {
  let prisma: PrismaClient;
  let http: HttpTestApp;
  let guest: HttpTestClient;
  let databaseName: string;

  beforeAll(async () => {
    databaseName = assertFigmaComparisonTarget(applyUrl).databaseName;
    prisma = new PrismaClient({
      datasources: { db: { url: applyUrl } },
    });
    await prisma.$connect();
    http = await createHttpTestApp(applyUrl, 'http://localhost:8081');
    guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
  });

  afterAll(async () => {
    await http?.close();
    await prisma?.$disconnect();
  });

  it('serves the scoped public comparison payloads and exact media checksums', async () => {
    expect(databaseName).not.toBe('bidplace');
    await verifyFigmaComparisonRecords(prisma);

    const home = await guest.get('/portfolio/home');
    expect(home.status).toBe(200);
    const homeBody = (await home.json()) as {
      curatorSelection: { work: { publicId: string } } | null;
    };
    expect(homeBody.curatorSelection?.work.publicId).toBe(
      MANIFEST.curatorSelectionPublicId,
    );

    const photo = await guest.get('/sellers/vex/photo');
    expect(photo.status).toBe(200);
    expect(
      createHash('sha256')
        .update(Buffer.from(await photo.arrayBuffer()))
        .digest('hex'),
    ).toBe(MANIFEST.author.profilePhoto.checksum);

    const work = await guest.get(`/works/${MANIFEST.works[0]?.publicId}`);
    expect(work.status).toBe(200);
    const workBody = (await work.json()) as {
      work: { images: Array<{ url: string; checksum: string }> };
    };
    expect(workBody.work.images[0]?.checksum).toBe(MANIFEST.works[0]?.checksum);
    const image = await guest.get(
      workBody.work.images[0].url.replace(/^\/api/, ''),
    );
    expect(image.status).toBe(200);
    expect(
      createHash('sha256')
        .update(Buffer.from(await image.arrayBuffer()))
        .digest('hex'),
    ).toBe(MANIFEST.works[0]?.checksum);
  });
});
